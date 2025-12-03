'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getMenuItems() {
  try {
    const menuItems = await prisma.menuItem.findMany({
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
    await prisma.menuItem.delete({
      where: { id }
    })
    revalidatePath('/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return { success: false, error: 'Failed to delete menu item' }
  }
}
