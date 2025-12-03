'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { updateMenuItemSchema, UpdateMenuItemInput } from "@/lib/validations"
import { z } from "zod"

export async function getMenuItemById(id: string) {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id }
    })
    return { success: true, data: menuItem }
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return { success: false, error: 'Failed to fetch menu item' }
  }
}

export async function updateMenuItem(id: string, data: UpdateMenuItemInput) {
  try {
    // Validate input
    const validated = updateMenuItemSchema.parse(data)
    
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...validated,
        image: validated.image || undefined
      }
    })
    revalidatePath('/menu')
    revalidatePath('/table')
    return { success: true, data: menuItem }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error updating menu item:', error)
    return { success: false, error: 'Gagal mengupdate menu' }
  }
}
