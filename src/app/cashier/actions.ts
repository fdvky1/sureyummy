'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus, PaymentMethod, TableStatus } from "@/generated/prisma/client"
import { createOrderSchema, CreateOrderInput } from "@/lib/validations"
import { z } from "zod"

export async function createOrder(data: CreateOrderInput) {
  try {
    // Validate input
    const validated = createOrderSchema.parse(data)
    
    const order = await prisma.order.create({
      data: {
        tableId: validated.tableId,
        totalPrice: validated.totalPrice,
        status: OrderStatus.PENDING,
        paymentMethod: validated.paymentMethod as PaymentMethod | undefined,
        orderItems: {
          create: validated.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    })

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: validated.tableId },
      data: { status: TableStatus.OCCUPIED }
    })

    revalidatePath('/live')
    revalidatePath('/cashier')
    revalidatePath('/table')
    return { success: true, data: order }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error creating order:', error)
    return { success: false, error: 'Gagal membuat pesanan' }
  }
}

export async function getActiveOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        table: true,
        session: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: orders }
  } catch (error) {
    console.error('Error fetching active orders:', error)
    return { success: false, error: 'Failed to fetch active orders' }
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: true,
        table: true
      }
    })
    revalidatePath('/live')
    revalidatePath('/cashier')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

export async function completeOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        session: true,
      }
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // If order has a session, complete all orders in that session
    if (order.sessionId && order.session) {
      // Get all orders in this session
      const sessionOrders = await prisma.order.findMany({
        where: {
          sessionId: order.sessionId,
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
          }
        }
      })

      // Complete all orders in the session
      await prisma.order.updateMany({
        where: {
          sessionId: order.sessionId,
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
          }
        },
        data: {
          status: OrderStatus.COMPLETED,
          isPaid: true
        }
      })

      // Deactivate the session
      await prisma.session.update({
        where: { id: order.sessionId },
        data: { isActive: false }
      })

      // Set table to AVAILABLE
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: TableStatus.AVAILABLE }
      })
    } else {
      // No session, complete just this order
      await prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.COMPLETED,
          isPaid: true
        }
      })

      // Check if table has any other active orders
      const activeOrders = await prisma.order.findMany({
        where: {
          tableId: order.tableId,
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
          }
        }
      })

      // If no active orders, set table to AVAILABLE
      if (activeOrders.length === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: TableStatus.AVAILABLE }
        })
      }
    }

    revalidatePath('/live')
    revalidatePath('/cashier')
    revalidatePath('/table')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error completing order:', error)
    return { success: false, error: 'Failed to complete order' }
  }
}

export async function getSessionOrders(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        table: true
      }
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    // Calculate totals
    const grandTotal = session.orders.reduce((sum, order) => sum + order.totalPrice, 0)
    const totalItems = session.orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    return {
      success: true,
      data: {
        session,
        grandTotal,
        totalItems,
        batches: session.orders.length
      }
    }
  } catch (error) {
    console.error('Error fetching session orders:', error)
    return { success: false, error: 'Failed to fetch session orders' }
  }
}
