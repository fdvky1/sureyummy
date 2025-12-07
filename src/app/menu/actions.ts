'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { validateDemoOperation } from "@/lib/demo"

export async function getMenuItems() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: menuItems }
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return { success: false, error: 'Failed to fetch menu items' }
  }
}

export async function deleteMenuItem(id: string) {
  try {
    // Check demo mode
    validateDemoOperation('delete', id, 'MenuItem')
    
    // Soft delete: set deletedAt timestamp
    await prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    revalidatePath('/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete menu item'
    return { success: false, error: message }
  }
}
