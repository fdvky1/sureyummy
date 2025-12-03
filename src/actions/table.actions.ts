'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TableStatus } from "@/generated/prisma/client"
import { createTableSchema, CreateTableInput } from "@/lib/validations"
import { z } from "zod"

export async function createTable(data: CreateTableInput) {
  try {
    // Validate input
    const validated = createTableSchema.parse(data)
    
    const table = await prisma.table.create({
      data: {
        number: validated.number,
        code: validated.code,
        slug: validated.slug,
        status: TableStatus.AVAILABLE
      }
    })
    revalidatePath('/table')
    return { success: true, data: table }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error creating table:', error)
    return { success: false, error: 'Gagal membuat meja' }
  }
}

export async function getTables() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
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
          }
        }
      }
    })
    return { success: true, data: tables }
  } catch (error) {
    console.error('Error fetching tables:', error)
    return { success: false, error: 'Failed to fetch tables' }
  }
}

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

export async function updateTableStatus(id: string, status: TableStatus) {
  try {
    const table = await prisma.table.update({
      where: { id },
      data: { status }
    })
    revalidatePath('/table')
    revalidatePath('/cashier')
    return { success: true, data: table }
  } catch (error) {
    console.error('Error updating table status:', error)
    return { success: false, error: 'Failed to update table status' }
  }
}

export async function deleteTable(id: string) {
  try {
    await prisma.table.delete({
      where: { id }
    })
    revalidatePath('/table')
    return { success: true }
  } catch (error) {
    console.error('Error deleting table:', error)
    return { success: false, error: 'Failed to delete table' }
  }
}
