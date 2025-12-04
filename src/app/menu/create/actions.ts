'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createMenuItemSchema } from "@/lib/validations"
import { uploadImage } from "@/lib/minio"
import { z } from "zod"

export async function createMenuItem(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const imageFile = formData.get('image') as File | null

    // Upload image if provided
    let imageUrl = ''
    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadImage(imageFile)
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url
      } else {
        return { success: false, error: uploadResult.error || 'Gagal mengupload gambar' }
      }
    }

    // Validate with Zod
    const validated = createMenuItemSchema.parse({
      name,
      description: description || undefined,
      price,
      image: imageUrl || undefined
    })

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
