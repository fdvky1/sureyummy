'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createMenuItemSchema, updateMenuItemSchema, CreateMenuItemInput, UpdateMenuItemInput } from "@/lib/validations"
import { z } from "zod"

export async function createMenuItem(data: CreateMenuItemInput) {
  try {
    // Validate input
    const validated = createMenuItemSchema.parse(data)
    
    const menuItem = await prisma.menuItem.create({
      data: {
        name: validated.name,
        description: validated.description,
        price: validated.price,
        image: validated.image || undefined
      }
    })
    revalidatePath('/menu')
    return { success: true, data: menuItem }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error creating menu item:', error)
    return { success: false, error: 'Gagal membuat menu' }
  }
}

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
      return { success: false, error: error.errors[0].message }
    }
    console.error('Error updating menu item:', error)
    return { success: false, error: 'Gagal mengupdate menu' }
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
