'use server'

import prisma from "@/lib/prisma"
import { OrderStatus } from "@/generated/prisma/client"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns"
import { id } from "date-fns/locale"

export async function getDashboardStats() {
  try {
    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)
    const endOfCurrentMonth = endOfMonth(now)
    const startOfLastMonth = startOfMonth(subMonths(now, 1))
    const endOfLastMonth = endOfMonth(subMonths(now, 1))
    const startOfToday = startOfDay(now)
    const endOfToday = endOfDay(now)

    // Get current month stats
    const currentMonthOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        },
        status: OrderStatus.COMPLETED
      },
      select: {
        totalPrice: true,
        createdAt: true
      }
    })

    // Get last month stats
    const lastMonthOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        status: OrderStatus.COMPLETED
      },
      select: {
        totalPrice: true
      }
    })

    // Get today's stats
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: OrderStatus.COMPLETED
      },
      select: {
        totalPrice: true
      }
    })

    // Calculate totals
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalPrice, 0)

    // Calculate growth percentage
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0

    // Get total completed orders
    const totalCompletedOrders = await prisma.order.count({
      where: { status: OrderStatus.COMPLETED }
    })

    // Get active orders
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: {
          notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        }
      }
    })

    // Get top selling items this month
    const topSellingItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth
          },
          status: OrderStatus.COMPLETED
        }
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    // Get menu item details
    const topSellingWithDetails = await Promise.all(
      topSellingItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: {
            id: true,
            name: true,
            price: true,
            category: true
          }
        })
        return {
          ...menuItem,
          totalQuantity: item._sum.quantity || 0,
          orderCount: item._count.id
        }
      })
    )

    // Daily revenue for current month (for chart)
    const dailyRevenue = currentMonthOrders.reduce((acc, order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += order.totalPrice
      return acc
    }, {} as Record<string, number>)

    const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date))

    return {
      success: true,
      data: {
        currentMonthRevenue,
        lastMonthRevenue,
        todayRevenue,
        revenueGrowth,
        totalCompletedOrders,
        activeOrdersCount,
        currentMonthOrderCount: currentMonthOrders.length,
        topSellingItems: topSellingWithDetails,
        dailyRevenue: dailyRevenueArray
      }
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return { success: false, error: 'Failed to get dashboard stats' }
  }
}

export async function getOrderHistory(options?: {
  startDate?: Date
  endDate?: Date
  status?: OrderStatus
  limit?: number
  offset?: number
}) {
  try {
    const { startDate, endDate, status, limit = 50, offset = 0 } = options || {}

    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }
    
    if (status) {
      where.status = status
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          table: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          orderItems: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true
                }
              }
            }
          },
          session: {
            select: {
              id: true,
              sessionId: true,
              isActive: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.order.count({ where })
    ])

    return {
      success: true,
      data: {
        orders,
        totalCount,
        hasMore: (offset + limit) < totalCount
      }
    }
  } catch (error) {
    console.error('Error getting order history:', error)
    return { success: false, error: 'Failed to get order history' }
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
