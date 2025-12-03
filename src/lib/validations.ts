import { z } from "zod"

// Table validations
export const createTableSchema = z.object({
  number: z.number().int().positive("Nomor meja harus angka positif"),
  code: z.string().min(1, "Kode meja wajib diisi").max(10, "Kode meja maksimal 10 karakter"),
  slug: z.string().min(1, "Slug wajib diisi")
})

export type CreateTableInput = z.infer<typeof createTableSchema>

// Menu validations
export const createMenuItemSchema = z.object({
  name: z.string().min(1, "Nama menu wajib diisi").max(100, "Nama menu maksimal 100 karakter"),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  price: z.number().positive("Harga harus lebih dari 0"),
  image: z.string().url("URL gambar tidak valid").optional().or(z.literal(""))
})

export const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Nama menu wajib diisi").max(100, "Nama menu maksimal 100 karakter").optional(),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  price: z.number().positive("Harga harus lebih dari 0").optional(),
  image: z.string().url("URL gambar tidak valid").optional().or(z.literal(""))
})

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>

// Order validations
export const orderItemSchema = z.object({
  menuItemId: z.string().uuid("ID menu tidak valid"),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
  price: z.number().positive("Harga harus lebih dari 0")
})

export const createOrderSchema = z.object({
  tableId: z.string().uuid("ID meja tidak valid"),
  items: z.array(orderItemSchema).min(1, "Minimal harus ada 1 item"),
  totalPrice: z.number().positive("Total harga harus lebih dari 0"),
  paymentMethod: z.enum(["CASH", "QRIS"]).optional()
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
