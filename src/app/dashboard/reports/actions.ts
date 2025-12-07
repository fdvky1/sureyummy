'use server'

import prisma from "@/lib/prisma"
import { OrderStatus } from "@/generated/prisma/client"
import { startOfDay, endOfDay, subDays, endOfMonth, format } from "date-fns"
import { id } from "date-fns/locale"

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

export async function getMonthlyReport(year: number, month: number) {
    try {
        const startDate = new Date(year, month - 1, 1)
        const endDate = endOfMonth(startDate)

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: OrderStatus.COMPLETED
            },
            include: {
                table: {
                    select: {
                        name: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                name: true,
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
        const totalOrders = orders.length

        // Group by category
        const categoryStats = orders.reduce((acc, order) => {
            order.orderItems.forEach(item => {
                const category = item.menuItem.category || 'UNCATEGORIZED'
                if (!acc[category]) {
                    acc[category] = {
                        revenue: 0,
                        quantity: 0
                    }
                }
                acc[category].revenue += item.price * item.quantity
                acc[category].quantity += item.quantity
            })
            return acc
        }, {} as Record<string, { revenue: number, quantity: number }>)

        // Top items
        const itemStats = orders.reduce((acc, order) => {
            order.orderItems.forEach(item => {
                const name = item.menuItem.name
                if (!acc[name]) {
                    acc[name] = {
                        name,
                        quantity: 0,
                        revenue: 0
                    }
                }
                acc[name].quantity += item.quantity
                acc[name].revenue += item.price * item.quantity
            })
            return acc
        }, {} as Record<string, { name: string, quantity: number, revenue: number }>)

        const topItems = Object.values(itemStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)

        // Daily breakdown
        const dailyStats = orders.reduce((acc, order) => {
            const date = format(order.createdAt, 'yyyy-MM-dd', { locale: id })
            if (!acc[date]) {
                acc[date] = {
                    date,
                    revenue: 0,
                    orderCount: 0
                }
            }
            acc[date].revenue += order.totalPrice
            acc[date].orderCount += 1
            return acc
        }, {} as Record<string, { date: string, revenue: number, orderCount: number }>)

        return {
            success: true,
            data: {
                period: {
                    year,
                    month,
                    monthName: format(startDate, 'MMMM yyyy', { locale: id })
                },
                summary: {
                    totalRevenue,
                    totalOrders,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                categoryStats,
                topItems,
                dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
            }
        }
    } catch (error) {
        console.error('Error getting monthly report:', error)
        return { success: false, error: 'Failed to get monthly report' }
    }
}
