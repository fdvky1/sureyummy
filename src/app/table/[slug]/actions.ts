'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus, PaymentMethod, TableStatus } from "@/generated/prisma/client"
import { createOrderSchema, CreateOrderInput } from "@/lib/validations"
import { z } from "zod"

export async function getTableBySlug(slug: string) {
  try {
    const table = await prisma.table.findUnique({
      where: { slug },
      include: {
        orders: {
          where: {
            status: {
              notIn: ['COMPLETED', 'CANCELLED']
            }
          },
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    return { success: true, data: table }
  } catch (error) {
    console.error('Error fetching table:', error)
    return { success: false, error: 'Failed to fetch table' }
  }
}

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
