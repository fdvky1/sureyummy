'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus, PaymentMethod, TableStatus } from "@/generated/prisma/client"
import { createOrderSchema, CreateOrderInput } from "@/lib/validations"
import { broadcastToWebSocket } from "@/lib/ws.broadcast"
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
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        session: {
          select: {
            id: true,
            sessionId: true,
            isActive: true
          }
        }
      }
    })

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: validated.tableId },
      data: { status: TableStatus.OCCUPIED }
    })

    // Get updated tables for broadcast
    const updatedTables = await prisma.table.findMany({
      include: {
        orders: {
          where: {
            status: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
            }
          }
        }
      }
    })

    // Broadcast to WebSocket clients
    broadcastToWebSocket({ order, tables: updatedTables }, 'order.new').catch(err => 
      console.error('Failed to broadcast new order:', err)
    )

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
          notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.READY]
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        session: {
          select: {
            id: true,
            sessionId: true,
            isActive: true
          }
        }
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
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        session: {
          select: {
            id: true,
            sessionId: true,
            isActive: true
          }
        }
      }
    })

    // If order is cancelled or completed, check if table should be available
    if (status === OrderStatus.CANCELLED || status === OrderStatus.COMPLETED) {
      // Check if there are any other active orders for this table
      const activeOrdersCount = await prisma.order.count({
        where: {
          tableId: order.table.id,
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
          }
        }
      })

      // If no active orders, set table to AVAILABLE
      if (activeOrdersCount === 0) {
        await prisma.table.update({
          where: { id: order.table.id },
          data: { status: TableStatus.AVAILABLE }
        })

        // Deactivate session if exists
        if (order.session) {
          await prisma.session.update({
            where: { id: order.session.id },
            data: { isActive: false }
          })
        }
      }
    }

    // Get updated tables for broadcast
    const updatedTables = await prisma.table.findMany({
      include: {
        orders: {
          where: {
            status: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
            }
          }
        }
      }
    })

    // Broadcast status update to WebSocket clients with tables
    broadcastToWebSocket({ order, tables: updatedTables }, 'order.status').catch(err => 
      console.error('Failed to broadcast order status update:', err)
    )

    revalidatePath('/live')
    revalidatePath('/cashier')
    revalidatePath('/table')
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
      include: { table: true, session: true }
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const sessionId = order.sessionId

    // Complete order(s) - if has session, complete all in session
    if (sessionId) {
      await prisma.order.updateMany({
        where: {
          sessionId,
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
        },
        data: { status: OrderStatus.COMPLETED, isPaid: true }
      })

      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false }
      })
    } else {
      await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.COMPLETED, isPaid: true }
      })
    }

    // Check if table should be set to AVAILABLE
    const activeOrders = await prisma.order.count({
      where: {
        tableId: order.tableId,
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      }
    })

    if (activeOrders === 0) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: TableStatus.AVAILABLE }
      })
    }

    // Broadcast with sessionId - let frontend handle filtering
    const updatedTables = await prisma.table.findMany({
      include: {
        orders: {
          where: {
            status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
          }
        }
      }
    })

    broadcastToWebSocket({ 
      sessionId: sessionId || null, 
      orderId: id,
      tables: updatedTables 
    }, 'order.completed').catch(err => 
      console.error('Failed to broadcast order completion:', err)
    )

    revalidatePath('/live')
    revalidatePath('/cashier')
    revalidatePath('/table')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error completing order:', error)
    return { success: false, error: 'Failed to complete order' }
  }
}
