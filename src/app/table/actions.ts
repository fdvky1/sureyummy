'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TableStatus } from "@/generated/prisma/client"
import { validateDemoOperation } from "@/lib/demo"

export async function getTables() {
  try {
    const tables = await prisma.table.findMany({
      where: {
        deletedAt: null
      },
      orderBy: { name: 'asc' },
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
    // Check demo mode
    validateDemoOperation('delete', id, 'Table')
    
    // Soft delete
    await prisma.table.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    revalidatePath('/table')
    revalidatePath('/cashier')
    return { success: true }
  } catch (error) {
    console.error('Error deleting table:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete table'
    return { success: false, error: message }
  }
}

export async function getTableById(id: string) {
  try {
    const table = await prisma.table.findUnique({
      where: { id }
    })
    return { success: true, data: table }
  } catch (error) {
    console.error('Error fetching table:', error)
    return { success: false, error: 'Failed to fetch table' }
  }
}

export async function updateTable(id: string, data: { name: string; slug: string }) {
  try {
    // Check demo mode
    validateDemoOperation('update', id, 'Table')
    
    const table = await prisma.table.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug
      }
    })
    revalidatePath('/table')
    revalidatePath('/cashier')
    return { success: true, data: table }
  } catch (error) {
    console.error('Error updating table:', error)
    const message = error instanceof Error ? error.message : 'Failed to update table'
    return { success: false, error: message }
  }
}
