'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TableStatus } from "@/generated/prisma/client"
import { createTableSchema, CreateTableInput } from "@/lib/validations"
import { z } from "zod"

export async function createTable(data: CreateTableInput) {
  try {
    // Validate input
    const validated = createTableSchema.parse(data)
    
    const table = await prisma.table.create({
      data: {
        number: validated.number,
        code: validated.code,
        slug: validated.slug,
        status: TableStatus.AVAILABLE
      }
    })
    revalidatePath('/table')
    return { success: true, data: table }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error creating table:', error)
    return { success: false, error: 'Gagal membuat meja' }
  }
}
