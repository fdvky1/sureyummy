import { MenuCategory, OrderStatus, TableStatus, PaymentMethod, Role } from "@/generated/prisma/browser"

// Menu Category Labels
export const menuCategoryLabels: Record<MenuCategory, string> = {
  APPETIZER: 'Pembuka',
  MAIN_COURSE: 'Menu Utama',
  DESSERT: 'Penutup',
  BEVERAGE: 'Minuman',
  SIDE_DISH: 'Lauk Pauk',
  CONDIMENT: 'Sambal & Bumbu'
}

export function getMenuCategoryLabel(category: MenuCategory | null | undefined): string {
  if (!category) return 'Tanpa Kategori'
  return menuCategoryLabels[category] || category
}

// Order Status Labels
export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  PREPARING: 'Sedang Dimasak',
  READY: 'Siap Disajikan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return orderStatusLabels[status] || status
}

// Table Status Labels
export const tableStatusLabels: Record<TableStatus, string> = {
  AVAILABLE: 'Tersedia',
  OCCUPIED: 'Terisi',
  OUT_OF_SERVICE: 'Tidak Aktif'
}

export function getTableStatusLabel(status: TableStatus): string {
  return tableStatusLabels[status] || status
}

// Payment Method Labels
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Tunai',
  QRIS: 'QRIS'
}

export function getPaymentMethodLabel(method: PaymentMethod | null | undefined): string {
  if (!method) return '-'
  return paymentMethodLabels[method] || method
}

// Role Labels
export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrator',
  KITCHEN_STAFF: 'Staff Dapur',
  CASHIER: 'Kasir'
}

export function getRoleLabel(role: Role): string {
  return roleLabels[role] || role
}
