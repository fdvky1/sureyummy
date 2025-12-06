'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus, PaymentMethod, TableStatus } from "@/generated/prisma/client"
import { createOrderSchema, CreateOrderInput } from "@/lib/validations"
import { broadcastNewOrder, broadcastOrderStatusUpdate, broadcastOrderCompleted } from "@/lib/ws.broadcast"
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

    // Broadcast to WebSocket clients
    broadcastNewOrder(order.id, order.table.slug).catch(err => 
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
          notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        table: true
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

    // Broadcast status update to WebSocket clients
    broadcastOrderStatusUpdate(id, status).catch(err => 
      console.error('Failed to broadcast order status update:', err)
    )

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
    const order = await prisma.order.update({
      where: { id },
      data: { 
        status: OrderStatus.COMPLETED,
        isPaid: true
      },
      include: {
        table: true
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

    // Broadcast order completion to WebSocket clients
    broadcastOrderCompleted(id, order.table.slug).catch(err => 
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
