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
        const menuItem = await prisma.menuItem.findFirst({
          where: { 
            id: item.menuItemId,
            deletedAt: null 
          },
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

// ========== HELPER FUNCTIONS FOR ANALYTICS ==========

interface AnalyticsData {
  currentMonthOrders: any[]
  lastMonthOrders: any[]
  last7DaysOrders: any[]
  last30DaysOrders: any[]
  currentRevenue: number
  lastRevenue: number
  revenueGrowth: number
  hasInsufficientData: boolean
  totalDaysWithData: number
  peakHourInfo: {
    hour: number
    orderCount: number
    timeRange: string
  } | null
  categoryPerformance: Record<string, { revenue: number, quantity: number, orderCount: number }>
  topCategory: [string, { revenue: number, quantity: number, orderCount: number }] | undefined
  itemTrends: Record<string, { name: string, quantity: number, revenue: number, orderCount: number }>
  topPerformer: { name: string, quantity: number, revenue: number, orderCount: number } | null
  slowMoving: { name: string, quantity: number, revenue: number, orderCount: number }[]
  avgOrderValue: number
  lastAvgOrderValue: number
  avgOrderGrowth: number
  trend: 'increasing' | 'decreasing' | 'stable'
  avgDailyRevenue: number
}

async function fetchOrdersData() {
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const startOfLastMonth = startOfMonth(subMonths(now, 1))
  const endOfLastMonth = endOfMonth(subMonths(now, 1))

  return await Promise.all([
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
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
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
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: OrderStatus.COMPLETED
      },
      select: {
        createdAt: true,
        totalPrice: true
      }
    })
  ])
}

function calculateAnalyticsData(
  currentMonthOrders: any[],
  lastMonthOrders: any[],
  last7DaysOrders: any[],
  last30DaysOrders: any[]
): AnalyticsData {
  const now = new Date()
  
  // Calculate revenue metrics
  const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalPrice, 0)
  const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + o.totalPrice, 0)
  
  // Check data sufficiency
  const totalDaysWithData = last30DaysOrders.length > 0 
    ? Math.ceil((now.getTime() - new Date(Math.min(...last30DaysOrders.map(o => o.createdAt.getTime()))).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const hasInsufficientData = totalDaysWithData < 7 || lastRevenue === 0
  
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
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]
  
  const peakHourInfo = peakHour ? {
    hour: parseInt(peakHour[0]),
    orderCount: peakHour[1] as number,
    timeRange: `${String(peakHour[0]).padStart(2, '0')}:00 - ${String(parseInt(peakHour[0]) + 1).padStart(2, '0')}:00`
  } : null

  // Category performance
  const categoryPerformance = currentMonthOrders.reduce((acc, order) => {
    order.orderItems.forEach((item: any) => {
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
    .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)[0] as [string, { revenue: number, quantity: number, orderCount: number }] | undefined

  // Item performance trends
  const itemTrends = currentMonthOrders.reduce((acc, order) => {
    if (order.status === OrderStatus.COMPLETED) {
      order.orderItems.forEach((item: any) => {
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

  const sortedItems = Object.values(itemTrends).sort((a, b) => (b as any).revenue - (a as any).revenue) as Array<{ name: string, quantity: number, revenue: number, orderCount: number }>
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

  // Trend prediction
  const recentDays = last7DaysOrders.reduce((acc, order) => {
    const date = format(order.createdAt, 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = 0
    acc[date] += order.totalPrice
    return acc
  }, {} as Record<string, number>)

  const dailyRevenues = Object.values(recentDays) as number[]
  const avgDailyRevenue = dailyRevenues.length > 0 
    ? dailyRevenues.reduce((a, b) => a + b, 0) / dailyRevenues.length 
    : 0

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (dailyRevenues.length >= 3) {
    const firstHalf = dailyRevenues.slice(0, Math.ceil(dailyRevenues.length / 2))
    const secondHalf = dailyRevenues.slice(Math.ceil(dailyRevenues.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    if (secondAvg > firstAvg * 1.1) {
      trend = 'increasing'
    } else if (secondAvg < firstAvg * 0.9) {
      trend = 'decreasing'
    }
  }

  return {
    currentMonthOrders,
    lastMonthOrders,
    last7DaysOrders,
    last30DaysOrders,
    currentRevenue,
    lastRevenue,
    revenueGrowth,
    hasInsufficientData,
    totalDaysWithData,
    peakHourInfo,
    categoryPerformance,
    topCategory,
    itemTrends,
    topPerformer,
    slowMoving,
    avgOrderValue,
    lastAvgOrderValue,
    avgOrderGrowth,
    trend,
    avgDailyRevenue
  }
}

function generateRuleBasedRecommendations(data: AnalyticsData) {
  const recommendations: Array<{
    type: 'success' | 'warning' | 'info' | 'error'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    action: string
  }> = []

  if (data.hasInsufficientData) {
    recommendations.push({
      type: 'info',
      priority: 'low',
      title: 'Data Masih Dikumpulkan',
      description: `Sistem baru berjalan ${data.totalDaysWithData} hari. Trend dan insight akan lebih akurat setelah minimal 7 hari operasional.`,
      action: 'Lanjutkan operasional normal, data sedang dikumpulkan'
    })
  } else if (data.revenueGrowth < 0) {
    recommendations.push({
      type: 'warning',
      priority: 'high',
      title: 'Pendapatan Menurun',
      description: `Revenue turun ${Math.abs(data.revenueGrowth).toFixed(1)}% dari bulan lalu. Pertimbangkan promosi atau menu baru.`,
      action: 'Buat promosi spesial untuk menu terlaris'
    })
  }

  if (data.slowMoving.length > 0) {
    recommendations.push({
      type: 'info',
      priority: 'medium',
      title: 'Menu Slow-Moving Detected',
      description: `${data.slowMoving.length} menu dengan penjualan rendah: ${data.slowMoving.map(i => i.name).join(', ')}.`,
      action: 'Evaluasi menu atau buat paket bundling'
    })
  }

  if (data.peakHourInfo && data.peakHourInfo.orderCount > 10) {
    recommendations.push({
      type: 'success',
      priority: 'low',
      title: 'Peak Hour Teridentifikasi',
      description: `Jam sibuk di ${data.peakHourInfo.timeRange} dengan ${data.peakHourInfo.orderCount} pesanan.`,
      action: 'Siapkan staff ekstra pada jam peak'
    })
  }

  if (data.topCategory) {
    const categoryGrowthPotential = data.categoryPerformance[data.topCategory[0]].revenue > data.currentRevenue * 0.4
    if (categoryGrowthPotential) {
      recommendations.push({
        type: 'success',
        priority: 'medium',
        title: 'Kategori Top Performer',
        description: `Kategori ${data.topCategory[0]} berkontribusi signifikan dengan revenue ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.topCategory[1].revenue)}.`,
        action: 'Expand menu di kategori ini'
      })
    }
  }

  if (data.avgOrderGrowth > 10) {
    recommendations.push({
      type: 'success',
      priority: 'low',
      title: 'Average Order Value Meningkat',
      description: `AOV naik ${data.avgOrderGrowth.toFixed(1)}% menjadi ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.avgOrderValue)}.`,
      action: 'Strategi upselling berhasil, pertahankan!'
    })
  }

  return recommendations
}

// ========== PUBLIC API FUNCTIONS ==========

// Get basic analytics without AI generation (for auto-load)
export async function getBasicAnalytics() {
  try {
    const [currentMonthOrders, lastMonthOrders, last7DaysOrders, last30DaysOrders] = await fetchOrdersData()
    const data = calculateAnalyticsData(currentMonthOrders, lastMonthOrders, last7DaysOrders, last30DaysOrders)

    return {
      success: true,
      data: {
        metrics: {
          revenueGrowth: {
            value: data.revenueGrowth,
            status: data.revenueGrowth > 0 ? 'positive' : data.revenueGrowth < 0 ? 'negative' : 'neutral'
          },
          avgOrderValue: {
            current: data.avgOrderValue,
            previous: data.lastAvgOrderValue,
            growth: data.avgOrderGrowth
          },
          orderFrequency: {
            current: data.currentMonthOrders.length,
            previous: data.lastMonthOrders.length,
            growth: data.lastMonthOrders.length > 0 
              ? ((data.currentMonthOrders.length - data.lastMonthOrders.length) / data.lastMonthOrders.length) * 100 
              : 0
          }
        },
        insights: {
          peakHour: data.peakHourInfo,
          topCategory: data.topCategory ? {
            name: data.topCategory[0],
            revenue: data.topCategory[1].revenue,
            quantity: data.topCategory[1].quantity
          } : null,
          topPerformer: data.topPerformer,
          slowMovingItems: data.slowMoving
        },
        predictions: {
          trend: data.trend,
          avgDailyRevenue: data.avgDailyRevenue,
          projectedMonthEnd: data.avgDailyRevenue * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        },
        recommendations: [],
        aiAnalysis: null
      }
    }
  } catch (error) {
    console.error('Error getting basic analytics:', error)
    return { success: false, error: 'Failed to get basic analytics' }
  }
}

// Get AI-powered insights and recommendations (for manual generation)
export async function getAIInsights() {
  try {
    const [currentMonthOrders, lastMonthOrders, last7DaysOrders, last30DaysOrders] = await fetchOrdersData()
    const data = calculateAnalyticsData(currentMonthOrders, lastMonthOrders, last7DaysOrders, last30DaysOrders)
    
    // Generate rule-based recommendations as fallback
    let recommendations = generateRuleBasedRecommendations(data)
    
    // === AI-POWERED INSIGHTS GENERATION ===
    let aiGeneratedInsights = null
    
    try {
      const now = new Date()
      // Prepare comprehensive data summary for AI
      const last30DaysRevenue = data.last30DaysOrders.reduce((sum, o) => sum + o.totalPrice, 0)
      const dailyRevenuePattern = data.last30DaysOrders.reduce((acc, order) => {
        const date = format(order.createdAt, 'yyyy-MM-dd')
        acc[date] = (acc[date] || 0) + order.totalPrice
        return acc
      }, {} as Record<string, number>)
      
      const last30Days = Object.entries(dailyRevenuePattern)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue }))

      // Calculate week-over-week growth
      const week1Revenue = last30Days.slice(0, 7).reduce((sum, d) => sum + (d.revenue as number), 0)
      const week2Revenue = last30Days.slice(7, 14).reduce((sum, d) => sum + (d.revenue as number), 0)
      const week3Revenue = last30Days.slice(14, 21).reduce((sum, d) => sum + (d.revenue as number), 0)
      const week4Revenue = last30Days.slice(21, 28).reduce((sum, d) => sum + (d.revenue as number), 0)
      
      const weeklyGrowth = [
        { week: 1, revenue: week1Revenue },
        { week: 2, revenue: week2Revenue, growth: week1Revenue > 0 ? ((week2Revenue - week1Revenue) / week1Revenue * 100) : 0 },
        { week: 3, revenue: week3Revenue, growth: week2Revenue > 0 ? ((week3Revenue - week2Revenue) / week2Revenue * 100) : 0 },
        { week: 4, revenue: week4Revenue, growth: week3Revenue > 0 ? ((week4Revenue - week3Revenue) / week3Revenue * 100) : 0 },
      ]

      // Top and bottom performers
      const allItems = Object.entries(data.itemTrends)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
      const topItems = allItems.slice(0, 5).map(([, itemData]) => ({
        name: itemData.name,
        revenue: itemData.revenue,
        quantity: itemData.quantity
      }))
      const bottomItems = allItems.slice(-5).map(([, itemData]) => ({
        name: itemData.name,
        revenue: itemData.revenue,
        quantity: itemData.quantity
      }))

      // Category mix analysis
      const categoryMix = Object.entries(data.categoryPerformance)
        .map(([cat, catData]) => ({
          category: cat,
          revenue: catData.revenue,
          percentage: (catData.revenue / data.currentRevenue * 100).toFixed(1)
        }))
        .sort((a, b) => b.revenue - a.revenue)

      // Call AI Business Insights from genkit
      const aiResult = await getAIBusinessInsights({
        currentMonthRevenue: data.currentRevenue,
        lastMonthRevenue: data.lastRevenue,
        revenueGrowth: data.hasInsufficientData ? 0 : data.revenueGrowth,
        avgOrderValue: data.avgOrderValue,
        lastAvgOrderValue: data.lastAvgOrderValue,
        avgOrderGrowth: data.hasInsufficientData ? 0 : data.avgOrderGrowth,
        currentMonthOrderCount: data.currentMonthOrders.length,
        lastMonthOrderCount: data.lastMonthOrders.length,
        weeklyGrowth,
        categoryMix,
        topItems,
        bottomItems,
        peakHour: data.peakHourInfo,
        slowMovingCount: data.slowMoving.length,
        trend: data.trend
      })

      if (aiResult.success && aiResult.data) {
        aiGeneratedInsights = aiResult.data.analysis
        // Map AI recommendations to match the expected type
        recommendations = aiResult.data.recommendations.map(rec => ({
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

    return {
      success: true,
      data: {
        metrics: {
          revenueGrowth: {
            value: data.revenueGrowth,
            status: data.revenueGrowth > 0 ? 'positive' : data.revenueGrowth < 0 ? 'negative' : 'neutral'
          },
          avgOrderValue: {
            current: data.avgOrderValue,
            previous: data.lastAvgOrderValue,
            growth: data.avgOrderGrowth
          },
          orderFrequency: {
            current: data.currentMonthOrders.length,
            previous: data.lastMonthOrders.length,
            growth: data.lastMonthOrders.length > 0 
              ? ((data.currentMonthOrders.length - data.lastMonthOrders.length) / data.lastMonthOrders.length) * 100 
              : 0
          }
        },
        insights: {
          peakHour: data.peakHourInfo,
          topCategory: data.topCategory ? {
            name: data.topCategory[0],
            revenue: data.topCategory[1].revenue,
            quantity: data.topCategory[1].quantity
          } : null,
          topPerformer: data.topPerformer,
          slowMovingItems: data.slowMoving
        },
        predictions: {
          trend: data.trend,
          avgDailyRevenue: data.avgDailyRevenue,
          projectedMonthEnd: data.avgDailyRevenue * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        },
        recommendations,
        aiAnalysis: aiGeneratedInsights
      }
    }
  } catch (error) {
    console.error('Error getting AI insights:', error)
    return { success: false, error: 'Failed to get AI insights' }
  }
}
