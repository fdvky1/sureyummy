'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createMenuItemSchema, updateMenuItemSchema, CreateMenuItemInput, UpdateMenuItemInput } from "@/lib/validations"
import { z } from "zod"
import minioClient, { BUCKET_NAME, ensureBucketExists } from "@/lib/minio"
import { randomUUID } from "crypto"

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Format file tidak valid. Gunakan JPG, PNG, atau WEBP' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Ukuran file maksimal 5MB' }
    }

    // Ensure bucket exists
    await ensureBucketExists()

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `menu/${randomUUID()}.${ext}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to MinIO
    await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
      'Content-Type': file.type,
    })

    // Generate public URL
    const url = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${BUCKET_NAME}/${filename}`

    return { success: true, url }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Gagal mengupload gambar' }
  }
}

export async function deleteImage(imageUrl: string) {
  try {
    // Extract filename from URL
    const url = new URL(imageUrl)
    const filename = url.pathname.split(`/${BUCKET_NAME}/`)[1]
    
    if (filename) {
      await minioClient.removeObject(BUCKET_NAME, filename)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: 'Gagal menghapus gambar' }
  }
}

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
