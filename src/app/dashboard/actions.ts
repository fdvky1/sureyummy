'use server'

import prisma from "@/lib/prisma"
import { OrderStatus } from "@/generated/prisma/client"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns"
import { id } from "date-fns/locale"
import { getAIBusinessInsights } from "@/lib/genkit"

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

export async function getAIInsights() {
  try {
    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)
    const endOfCurrentMonth = endOfMonth(now)
    const startOfLastMonth = startOfMonth(subMonths(now, 1))
    const endOfLastMonth = endOfMonth(subMonths(now, 1))
    const startOfToday = startOfDay(now)
    const endOfToday = endOfDay(now)

    // Get orders data for analysis
    const [currentMonthOrders, lastMonthOrders, last7DaysOrders, last30DaysOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          status: OrderStatus.COMPLETED
        },
        include: {
          orderItems: {
            include: {
              menuItem: {
                select: { id: true, name: true, category: true, price: true }
              }
            }
          }
        }
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: OrderStatus.COMPLETED
        },
        include: {
          orderItems: {
            include: {
              menuItem: {
                select: { id: true, name: true, category: true, price: true }
              }
            }
          }
        }
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          status: OrderStatus.COMPLETED
        },
        include: {
          orderItems: {
            include: {
              menuItem: {
                select: { id: true, name: true, category: true, price: true }
              }
            }
          }
        }
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          status: OrderStatus.COMPLETED
        },
        select: {
          createdAt: true,
          totalPrice: true
        }
      })
    ])

    // Calculate revenue metrics
    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalPrice, 0)
    const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + o.totalPrice, 0)
    
    // Check data sufficiency (detect if business just started)
    const totalDaysWithData = last30DaysOrders.length > 0 
      ? Math.ceil((now.getTime() - new Date(Math.min(...last30DaysOrders.map(o => o.createdAt.getTime()))).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const hasInsufficientData = totalDaysWithData < 7 || lastRevenue === 0
    
    // Only calculate growth if we have sufficient historical data
    const revenueGrowth = !hasInsufficientData && lastRevenue > 0 
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
      : 0

    // Analyze peak hours
    const hourlyDistribution = currentMonthOrders.reduce((acc, order) => {
      const hour = order.createdAt.getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const peakHour = Object.entries(hourlyDistribution)
      .sort(([,a], [,b]) => b - a)[0]
    
    const peakHourInfo = peakHour ? {
      hour: parseInt(peakHour[0]),
      orderCount: peakHour[1],
      timeRange: `${String(peakHour[0]).padStart(2, '0')}:00 - ${String(parseInt(peakHour[0]) + 1).padStart(2, '0')}:00`
    } : null

    // Category performance
    const categoryPerformance = currentMonthOrders.reduce((acc, order) => {
      order.orderItems.forEach(item => {
        const cat = item.menuItem.category || 'UNCATEGORIZED'
        if (!acc[cat]) {
          acc[cat] = { revenue: 0, quantity: 0, orderCount: 0 }
        }
        acc[cat].revenue += item.price * item.quantity
        acc[cat].quantity += item.quantity
        acc[cat].orderCount += 1
      })
      return acc
    }, {} as Record<string, { revenue: number, quantity: number, orderCount: number }>)

    const topCategory = Object.entries(categoryPerformance)
      .sort(([,a], [,b]) => b.revenue - a.revenue)[0]

    // Item performance trends - only from actual completed orders
    const itemTrends = currentMonthOrders.reduce((acc, order) => {
      // Only process items from orders that have actually been completed
      if (order.status === OrderStatus.COMPLETED) {
        order.orderItems.forEach(item => {
          if (!acc[item.menuItemId]) {
            acc[item.menuItemId] = {
              name: item.menuItem.name,
              quantity: 0,
              revenue: 0,
              orderCount: 0
            }
          }
          acc[item.menuItemId].quantity += item.quantity
          acc[item.menuItemId].revenue += item.price * item.quantity
          acc[item.menuItemId].orderCount += 1
        })
      }
      return acc
    }, {} as Record<string, { name: string, quantity: number, revenue: number, orderCount: number }>)

    const sortedItems = Object.values(itemTrends).sort((a, b) => b.revenue - a.revenue)
    const topPerformer = sortedItems[0] || null
    const slowMoving = sortedItems.filter(item => item.quantity < 5 && item.quantity > 0).slice(0, 3)

    // Average order value
    const avgOrderValue = currentMonthOrders.length > 0 
      ? currentRevenue / currentMonthOrders.length 
      : 0
    const lastAvgOrderValue = lastMonthOrders.length > 0 
      ? lastRevenue / lastMonthOrders.length 
      : 0
    const avgOrderGrowth = !hasInsufficientData && lastAvgOrderValue > 0 
      ? ((avgOrderValue - lastAvgOrderValue) / lastAvgOrderValue) * 100 
      : 0

    // Generate AI recommendations
    const recommendations: Array<{
      type: 'success' | 'warning' | 'info' | 'error'
      priority: 'high' | 'medium' | 'low'
      title: string
      description: string
      action: string
    }> = []

    // Show data collection notice for new businesses
    if (hasInsufficientData) {
      recommendations.push({
        type: 'info' as const,
        priority: 'low' as const,
        title: 'Data Masih Dikumpulkan',
        description: `Sistem baru berjalan ${totalDaysWithData} hari. Trend dan insight akan lebih akurat setelah minimal 7 hari operasional.`,
        action: 'Lanjutkan operasional normal, data sedang dikumpulkan'
      })
    } else if (revenueGrowth < 0) {
      recommendations.push({
        type: 'warning' as const,
        priority: 'high' as const,
        title: 'Pendapatan Menurun',
        description: `Revenue turun ${Math.abs(revenueGrowth).toFixed(1)}% dari bulan lalu. Pertimbangkan promosi atau menu baru.`,
        action: 'Buat promosi spesial untuk menu terlaris'
      })
    }

    if (slowMoving.length > 0) {
      recommendations.push({
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'Menu Slow-Moving Detected',
        description: `${slowMoving.length} menu dengan penjualan rendah: ${slowMoving.map(i => i.name).join(', ')}.`,
        action: 'Evaluasi menu atau buat paket bundling'
      })
    }

    if (peakHourInfo && peakHourInfo.orderCount > 10) {
      recommendations.push({
        type: 'success' as const,
        priority: 'low' as const,
        title: 'Peak Hour Teridentifikasi',
        description: `Jam sibuk di ${peakHourInfo.timeRange} dengan ${peakHourInfo.orderCount} pesanan.`,
        action: 'Siapkan staff ekstra pada jam peak'
      })
    }

    if (topCategory) {
      const categoryGrowthPotential = categoryPerformance[topCategory[0]].revenue > currentRevenue * 0.4
      if (categoryGrowthPotential) {
        recommendations.push({
          type: 'success' as const,
          priority: 'medium' as const,
          title: 'Kategori Top Performer',
          description: `Kategori ${topCategory[0]} berkontribusi signifikan dengan revenue ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(topCategory[1].revenue)}.`,
          action: 'Expand menu di kategori ini'
        })
      }
    }

    if (avgOrderGrowth > 10) {
      recommendations.push({
        type: 'success' as const,
        priority: 'low' as const,
        title: 'Average Order Value Meningkat',
        description: `AOV naik ${avgOrderGrowth.toFixed(1)}% menjadi ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(avgOrderValue)}.`,
        action: 'Strategi upselling berhasil, pertahankan!'
      })
    }

    // Trend prediction (simple linear regression)
    const recentDays = last7DaysOrders.reduce((acc, order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd')
      if (!acc[date]) acc[date] = 0
      acc[date] += order.totalPrice
      return acc
    }, {} as Record<string, number>)

    const dailyRevenues = Object.values(recentDays)
    const avgDailyRevenue = dailyRevenues.length > 0 
      ? dailyRevenues.reduce((a, b) => a + b, 0) / dailyRevenues.length 
      : 0

    // Calculate trend using linear regression for more accuracy
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (dailyRevenues.length >= 3) {
      // Compare last 3 days avg vs first 3 days avg
      const firstHalf = dailyRevenues.slice(0, Math.ceil(dailyRevenues.length / 2))
      const secondHalf = dailyRevenues.slice(Math.ceil(dailyRevenues.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      
      // Use 10% threshold to avoid noise
      if (secondAvg > firstAvg * 1.1) {
        trend = 'increasing'
      } else if (secondAvg < firstAvg * 0.9) {
        trend = 'decreasing'
      }
    }

    // === AI-POWERED INSIGHTS GENERATION ===
    let aiGeneratedInsights = null
    let aiRecommendations = recommendations // Fallback to rule-based
    
    try {
      // Prepare comprehensive data summary for AI
      const last30DaysRevenue = last30DaysOrders.reduce((sum, o) => sum + o.totalPrice, 0)
      const dailyRevenuePattern = last30DaysOrders.reduce((acc, order) => {
        const date = format(order.createdAt, 'yyyy-MM-dd')
        acc[date] = (acc[date] || 0) + order.totalPrice
        return acc
      }, {} as Record<string, number>)
      
      const last30Days = Object.entries(dailyRevenuePattern)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue }))

      // Calculate week-over-week growth
      const week1Revenue = last30Days.slice(0, 7).reduce((sum, d) => sum + d.revenue, 0)
      const week2Revenue = last30Days.slice(7, 14).reduce((sum, d) => sum + d.revenue, 0)
      const week3Revenue = last30Days.slice(14, 21).reduce((sum, d) => sum + d.revenue, 0)
      const week4Revenue = last30Days.slice(21, 28).reduce((sum, d) => sum + d.revenue, 0)
      
      const weeklyGrowth = [
        { week: 1, revenue: week1Revenue },
        { week: 2, revenue: week2Revenue, growth: week1Revenue > 0 ? ((week2Revenue - week1Revenue) / week1Revenue * 100) : 0 },
        { week: 3, revenue: week3Revenue, growth: week2Revenue > 0 ? ((week3Revenue - week2Revenue) / week2Revenue * 100) : 0 },
        { week: 4, revenue: week4Revenue, growth: week3Revenue > 0 ? ((week4Revenue - week3Revenue) / week3Revenue * 100) : 0 },
      ]

      // Top and bottom performers
      const allItems = Object.entries(itemTrends)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
      const topItems = allItems.slice(0, 5).map(([, data]) => ({
        name: data.name,
        revenue: data.revenue,
        quantity: data.quantity
      }))
      const bottomItems = allItems.slice(-5).map(([, data]) => ({
        name: data.name,
        revenue: data.revenue,
        quantity: data.quantity
      }))

      // Category mix analysis
      const categoryMix = Object.entries(categoryPerformance)
        .map(([cat, data]) => ({
          category: cat,
          revenue: data.revenue,
          percentage: (data.revenue / currentRevenue * 100).toFixed(1)
        }))
        .sort((a, b) => b.revenue - a.revenue)

      // Call AI Business Insights from genkit
      const aiResult = await getAIBusinessInsights({
        currentMonthRevenue: currentRevenue,
        lastMonthRevenue: lastRevenue,
        revenueGrowth: hasInsufficientData ? 0 : revenueGrowth, // Don't send misleading growth
        avgOrderValue,
        lastAvgOrderValue,
        avgOrderGrowth: hasInsufficientData ? 0 : avgOrderGrowth,
        currentMonthOrderCount: currentMonthOrders.length,
        lastMonthOrderCount: lastMonthOrders.length,
        weeklyGrowth,
        categoryMix,
        topItems,
        bottomItems,
        peakHour: peakHourInfo,
        slowMovingCount: slowMoving.length,
        trend
      })

      if (aiResult.success && aiResult.data) {
        aiGeneratedInsights = aiResult.data.analysis
        // Map AI recommendations to match the expected type
        aiRecommendations = aiResult.data.recommendations.map(rec => ({
          type: rec.type,
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          action: `${rec.action} - Impact: ${rec.expectedImpact}`
        }))
      }
    } catch (aiError) {
      console.warn('[AI Insights] Failed to generate AI insights, using rule-based fallback:', aiError)
      // Continue with rule-based recommendations
    }

    // Rule-based recommendations as fallback
    return {
      success: true,
      data: {
        metrics: {
          revenueGrowth: {
            value: revenueGrowth,
            status: revenueGrowth > 0 ? 'positive' : revenueGrowth < 0 ? 'negative' : 'neutral'
          },
          avgOrderValue: {
            current: avgOrderValue,
            previous: lastAvgOrderValue,
            growth: avgOrderGrowth
          },
          orderFrequency: {
            current: currentMonthOrders.length,
            previous: lastMonthOrders.length,
            growth: lastMonthOrders.length > 0 ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 : 0
          }
        },
        insights: {
          peakHour: peakHourInfo,
          topCategory: topCategory ? {
            name: topCategory[0],
            revenue: topCategory[1].revenue,
            quantity: topCategory[1].quantity
          } : null,
          topPerformer: topPerformer || null,
          slowMovingItems: slowMoving
        },
        predictions: {
          trend,
          avgDailyRevenue,
          projectedMonthEnd: avgDailyRevenue * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        },
        recommendations: aiRecommendations,
        aiAnalysis: aiGeneratedInsights // AI-generated strategic analysis
      }
    }
  } catch (error) {
    console.error('Error getting AI insights:', error)
    return { success: false, error: 'Failed to get AI insights' }
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
