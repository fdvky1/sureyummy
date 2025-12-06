import { OrderStatus, PaymentMethod } from "@/generated/prisma/browser"

export type OrderItem = {
  id: string
  quantity: number
  price: number
  menuItem: {
    id: string
    name: string
    price: number
  }
}

export type Order = {
  id: string
  totalPrice: number
  status: OrderStatus
  createdAt: string | Date
  paymentMethod?: string | null
  sessionId?: string | null
  isPaid?: boolean
  table: {
    id: string
    name: string
    slug: string
  }
  orderItems: OrderItem[]
  session?: {
    id: string
    sessionId: string
    isActive: boolean
  } | null
}

export type OrderGroup = [string, Order[]]

/**
 * Group orders by session (single orders treated as session with 1 order)
 */
export function groupOrdersBySession(orders: Order[]): OrderGroup[] {
  const grouped = new Map<string, Order[]>()

  orders.forEach(order => {
    const key = order.sessionId || `single-${order.id}`
    const existing = grouped.get(key)
    if (existing) {
      existing.push(order)
    } else {
      grouped.set(key, [order])
    }
  })

  return Array.from(grouped.entries())
}

/**
 * Calculate total price for multiple orders
 */
export function calculateGrandTotal(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + order.totalPrice, 0)
}

/**
 * Check if all orders have specific status
 */
export function allOrdersHaveStatus(orders: Order[], status: OrderStatus): boolean {
  return orders.every(order => order.status === status)
}
