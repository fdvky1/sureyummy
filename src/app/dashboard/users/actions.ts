'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@/generated/prisma/client"
import { z } from "zod"
import bcrypt from "bcrypt"
import { validateDemoOperation } from "@/lib/demo"

const createUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.nativeEnum(Role)
})

const updateUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").optional(),
  email: z.string().email("Email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.nativeEnum(Role).optional()
})

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: users }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { success: false, error: 'Gagal mengambil data user' }
  }
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    const validated = createUserSchema.parse(data)
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })
    
    if (existingUser) {
      return { success: false, error: 'Email sudah terdaftar' }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)
    
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    revalidatePath('/dashboard/users')
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error creating user:', error)
    return { success: false, error: 'Gagal membuat user' }
  }
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  try {
    // Check demo mode
    validateDemoOperation('update', id, 'User')
    
    const validated = updateUserSchema.parse(data)
    
    // Check if email already exists (exclude current user)
    if (validated.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validated.email,
          NOT: { id }
        }
      })
      
      if (existingUser) {
        return { success: false, error: 'Email sudah terdaftar' }
      }
    }
    
    const updateData: any = {}
    if (validated.name) updateData.name = validated.name
    if (validated.email) updateData.email = validated.email
    if (validated.role) updateData.role = validated.role
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 10)
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    revalidatePath('/dashboard/users')
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error updating user:', error)
    const message = error instanceof Error ? error.message : 'Gagal mengubah user'
    return { success: false, error: message }
  }
}

export async function deleteUser(id: string) {
  try {
    // Check demo mode
    validateDemoOperation('delete', id, 'User')
    
    const deleted = await prisma.user.deleteMany({
      where: { 
        id,
        role: { not: Role.ADMIN }
      }
    })
    
    if (deleted.count === 0) {
      return { success: false, error: 'User tidak ditemukan atau akun admin tidak bisa dihapus' }
    }
    
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    const message = error instanceof Error ? error.message : 'Gagal menghapus user'
    return { success: false, error: message }
  }
}
