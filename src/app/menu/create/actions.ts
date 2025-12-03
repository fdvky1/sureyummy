'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createMenuItemSchema, CreateMenuItemInput } from "@/lib/validations"
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
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error creating menu item:', error)
    return { success: false, error: 'Gagal membuat menu' }
  }
}
