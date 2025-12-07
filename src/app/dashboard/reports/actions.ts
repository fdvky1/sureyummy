'use server'

import prisma from "@/lib/prisma"
import { OrderStatus } from "@/generated/prisma/client"
import { startOfDay, endOfDay, subDays } from "date-fns"

type DateRange = {
    startDate?: Date
    endDate?: Date
}

export async function getDailySummary(dateRange?: DateRange) {
    try {
        const startDate = dateRange?.startDate || startOfDay(new Date())
        const endDate = dateRange?.endDate || endOfDay(new Date())

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: OrderStatus.COMPLETED
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            }
        })

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
        const totalOrders = orders.length
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        return {
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                orders
            }
        }
    } catch (error) {
        console.error('Error fetching daily summary:', error)
        return {
            success: false,
            error: 'Gagal mengambil ringkasan harian'
        }
    }
}

export async function getTopSellingItems(params: { limit?: number, dateRange?: DateRange } = {}) {
    try {
        const { limit = 10, dateRange } = params
        const startDate = dateRange?.startDate || subDays(new Date(), 30)
        const endDate = dateRange?.endDate || new Date()

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: OrderStatus.COMPLETED
                }
            },
            include: {
                menuItem: true
            }
        })

        // Aggregate by menu item
        const itemMap = new Map<string, {
            menuItem: any
            totalQuantity: number
            totalRevenue: number
            orderCount: number
        }>()

        orderItems.forEach(item => {
            const existing = itemMap.get(item.menuItemId)
            if (existing) {
                existing.totalQuantity += item.quantity
                existing.totalRevenue += item.price * item.quantity
                existing.orderCount += 1
            } else {
                itemMap.set(item.menuItemId, {
                    menuItem: item.menuItem,
                    totalQuantity: item.quantity,
                    totalRevenue: item.price * item.quantity,
                    orderCount: 1
                })
            }
        })

        // Convert to array and sort
        const topItems = Array.from(itemMap.values())
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, limit)

        return {
            success: true,
            data: topItems
        }
    } catch (error) {
        console.error('Error fetching top selling items:', error)
        return {
            success: false,
            error: 'Gagal mengambil data menu terlaris'
        }
    }
}

export async function getRevenueByPeriod(params: { days?: number } = {}) {
    try {
        const { days = 7 } = params
        const startDate = subDays(new Date(), days)

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate
                },
                status: OrderStatus.COMPLETED
            },
            select: {
                createdAt: true,
                totalPrice: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Group by date
        const revenueByDate = new Map<string, number>()
        
        orders.forEach(order => {
            const dateKey = startOfDay(new Date(order.createdAt)).toISOString()
            const existing = revenueByDate.get(dateKey) || 0
            revenueByDate.set(dateKey, existing + order.totalPrice)
        })

        const chartData = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
            date: new Date(date),
            revenue
        }))

        return {
            success: true,
            data: chartData
        }
    } catch (error) {
        console.error('Error fetching revenue by period:', error)
        return {
            success: false,
            error: 'Gagal mengambil data pendapatan'
        }
    }
}
