'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { updateMenuItemSchema } from "@/lib/validations"
import { uploadImage, deleteImage } from "@/lib/minio"
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

export async function updateMenuItem(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const currentImageUrl = formData.get('currentImageUrl') as string
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'

    let finalImageUrl = currentImageUrl

    // Remove old image if requested
    if (removeImage && currentImageUrl) {
      await deleteImage(currentImageUrl)
      finalImageUrl = ''
    }

    // Upload new image if provided
    if (imageFile && imageFile.size > 0) {
      // Delete old image if exists
      if (currentImageUrl) {
        await deleteImage(currentImageUrl)
      }
      
      const uploadResult = await uploadImage(imageFile)
      if (uploadResult.success && uploadResult.url) {
        finalImageUrl = uploadResult.url
      } else {
        return { success: false, error: uploadResult.error || 'Gagal mengupload gambar' }
      }
    }

    // Validate with Zod
    const validated = updateMenuItemSchema.parse({
      name,
      description: description || undefined,
      price,
      image: finalImageUrl || undefined
    })

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
