'use client'

import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useState, useEffect } from "react"
import { getAIInsights } from "./actions"
import { getMenuCategoryLabel } from "@/lib/enumHelpers"
import { MenuCategory } from "@/generated/prisma/browser"
import { 
  RiMoneyDollarCircleLine,
  RiCalculatorLine,
  RiFileListLine,
  RiCheckboxCircleLine,
  RiTrophyLine,
  RiLineChartLine,
  RiCalendarLine,
  RiEyeLine,
  RiBrainLine,
  RiLightbulbLine,
  RiFlashlightLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckboxCircleFill,
  RiSparklingLine,
  RiArrowUpLine,
  RiArrowDownLine
} from '@remixicon/react'

type DashboardStats = {
    currentMonthRevenue: number
    lastMonthRevenue: number
    todayRevenue: number
    revenueGrowth: number
    totalCompletedOrders: number
    activeOrdersCount: number
    currentMonthOrderCount: number
    topSellingItems: Array<{
        id?: string
        name?: string
        price?: number
        category?: string | null
        totalQuantity: number
        orderCount: number
    }>
    dailyRevenue: Array<{
        date: string
        revenue: number
    }>
}

type AIInsights = {
    metrics: {
        revenueGrowth: {
            value: number
            status: 'positive' | 'negative' | 'neutral'
        }
        avgOrderValue: {
            current: number
            previous: number
            growth: number
        }
        orderFrequency: {
            current: number
            previous: number
            growth: number
        }
    }
    insights: {
        peakHour: {
            hour: number
            orderCount: number
            timeRange: string
        } | null
        topCategory: {
            name: string
            revenue: number
            quantity: number
        } | null
        topPerformer: {
            name: string
            quantity: number
            revenue: number
            orderCount: number
        } | null
        slowMovingItems: Array<{
            name: string
            quantity: number
            revenue: number
            orderCount: number
        }>
    }
    predictions: {
        trend: 'increasing' | 'decreasing' | 'stable'
        avgDailyRevenue: number
        projectedMonthEnd: number
    }
    recommendations: Array<{
        type: 'success' | 'warning' | 'info' | 'error'
        priority: 'high' | 'medium' | 'low'
        title: string
        description: string
        action: string
    }>
    aiAnalysis?: {
        overallHealth: string
        keyFindings: string[]
        riskFactors: string[]
        opportunities: string[]
    } | null
}

type DashboardViewProps = {
    stats: DashboardStats | null
    userName?: string | null
}

export default function DashboardView({ stats, userName }: DashboardViewProps) {
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
    const [isLoadingAI, setIsLoadingAI] = useState(false)
    const [hasGeneratedAI, setHasGeneratedAI] = useState(false)
    const [isLoadingBasicAnalytics, setIsLoadingBasicAnalytics] = useState(true)

    // Load basic analytics (non-AI) on mount
    useEffect(() => {
        async function fetchBasicAnalytics() {
            try {
                const result = await getAIInsights()
                if (result.success && result.data) {
                    // Set only the basic analytics data, without AI analysis
                    setAiInsights({
                        ...result.data,
                        aiAnalysis: null // Don't load AI analysis yet
                    } as AIInsights)
                }
            } catch (error) {
                console.error('Failed to load basic analytics:', error)
            } finally {
                setIsLoadingBasicAnalytics(false)
            }
        }
        fetchBasicAnalytics()
    }, [])

    const generateAIInsights = async () => {
        setIsLoadingAI(true)
        setHasGeneratedAI(true)
        try {
            const result = await getAIInsights()
            if (result.success && result.data) {
                setAiInsights(result.data as AIInsights)
            }
        } catch (error) {
            console.error('Failed to load AI insights:', error)
        } finally {
            setIsLoadingAI(false)
        }
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-base-content/70">Gagal memuat data dashboard</p>
                </div>
            </div>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const currentMonth = format(new Date(), 'MMMM yyyy', { locale: id })

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Dashboard Analytics</h1>
                    <p className="text-base-content/70">
                        Selamat datang kembali, {userName} 👋
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Today's Revenue */}
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <RiMoneyDollarCircleLine className="w-8 h-8" />
                            </div>
                            <div className="stat-title">Pendapatan Hari Ini</div>
                            <div className="stat-value text-primary text-2xl">{formatCurrency(stats.todayRevenue)}</div>
                            <div className="stat-desc">Real-time</div>
                        </div>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <RiCalculatorLine className="w-8 h-8" />
                            </div>
                            <div className="stat-title">Pendapatan Bulan Ini</div>
                            <div className="stat-value text-secondary text-2xl">{formatCurrency(stats.currentMonthRevenue)}</div>
                            <div className="stat-desc flex items-center gap-1">
                                {stats.revenueGrowth > 0 ? (
                                    <>
                                        <span className="text-success">↗︎ {stats.revenueGrowth.toFixed(1)}%</span>
                                        <span>dari bulan lalu</span>
                                    </>
                                ) : stats.revenueGrowth < 0 ? (
                                    <>
                                        <span className="text-error">↘︎ {Math.abs(stats.revenueGrowth).toFixed(1)}%</span>
                                        <span>dari bulan lalu</span>
                                    </>
                                ) : (
                                    <span>Sama dengan bulan lalu</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Orders */}
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-warning">
                                <RiFileListLine className="w-8 h-8" />
                            </div>
                            <div className="stat-title">Pesanan Aktif</div>
                            <div className="stat-value text-warning">{stats.activeOrdersCount}</div>
                            <div className="stat-desc">Sedang diproses</div>
                        </div>
                    </div>

                    {/* Total Orders This Month */}
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-success">
                                <RiCheckboxCircleLine className="w-8 h-8" />
                            </div>
                            <div className="stat-title">Pesanan Bulan Ini</div>
                            <div className="stat-value text-success">{stats.currentMonthOrderCount}</div>
                            <div className="stat-desc">Total selesai: {stats.totalCompletedOrders}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Selling Items */}
                    <div className="lg:col-span-2 card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title flex items-center gap-2">
                                <RiTrophyLine className="w-5 h-5 text-warning" />
                                Menu Terlaris Bulan Ini
                                <div className="badge badge-secondary">{currentMonth}</div>
                            </h2>
                            <div className="divider my-2"></div>
                            
                            {stats.topSellingItems.length === 0 ? (
                                <div className="text-center py-8 text-base-content/70">
                                    Belum ada data penjualan
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Menu</th>
                                                <th>Kategori</th>
                                                <th className="text-right">Terjual</th>
                                                <th className="text-right">Transaksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topSellingItems.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td>
                                                        <div className={`badge ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-neutral' : index === 2 ? 'badge-accent' : 'badge-ghost'}`}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-semibold">{item.name || 'N/A'}</div>
                                                        <div className="text-xs text-base-content/70">{item.price ? formatCurrency(item.price) : '-'}</div>
                                                    </td>
                                                    <td>
                                                        <div className="badge badge-sm badge-outline">
                                                            {getMenuCategoryLabel(item.category as MenuCategory)}
                                                        </div>
                                                    </td>
                                                    <td className="text-right font-semibold">{item.totalQuantity} porsi</td>
                                                    <td className="text-right text-base-content/70">{item.orderCount}x</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Revenue Chart */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title flex items-center gap-2">
                                <RiLineChartLine className="w-5 h-5 text-primary" />
                                Pendapatan Harian
                            </h2>
                            <div className="divider my-2"></div>
                            
                            {stats.dailyRevenue.length === 0 ? (
                                <div className="text-center py-8 text-base-content/70">
                                    Belum ada data pendapatan
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {stats.dailyRevenue.slice(-10).reverse().map((day) => (
                                        <div key={day.date} className="flex justify-between items-center p-2 hover:bg-base-200 rounded-lg">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {format(new Date(day.date), 'dd MMM', { locale: id })}
                                                </div>
                                                <div className="text-xs text-base-content/70">
                                                    {format(new Date(day.date), 'EEEE', { locale: id })}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-primary">
                                                    {formatCurrency(day.revenue)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Business Analytics Section (Always Visible) */}
                <div className="mt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <RiCalculatorLine className="w-8 h-8 text-secondary" />
                        <div>
                            <h2 className="text-2xl font-bold">Business Analytics</h2>
                            <p className="text-sm text-base-content/70">
                                Perhitungan statistik dan insight otomatis
                            </p>
                        </div>
                    </div>

                    {/* Loading State for Basic Analytics */}
                    {isLoadingBasicAnalytics && (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center justify-center gap-3 py-8">
                                    <span className="loading loading-spinner loading-lg text-secondary"></span>
                                    <span className="text-lg">Memuat analytics...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show analytics only if we have data */}
                    {!isLoadingBasicAnalytics && aiInsights && (
                        <>
                        {/* KPI Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-base-content/70">Average Order Value</p>
                                            <p className="text-2xl font-bold">{formatCurrency(aiInsights.metrics.avgOrderValue.current)}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {aiInsights.metrics.avgOrderValue.growth > 0 ? (
                                                    <>
                                                        <RiArrowUpLine className="w-4 h-4 text-success" />
                                                        <span className="text-sm text-success">+{aiInsights.metrics.avgOrderValue.growth.toFixed(1)}%</span>
                                                    </>
                                                ) : aiInsights.metrics.avgOrderValue.growth < 0 ? (
                                                    <>
                                                        <RiArrowDownLine className="w-4 h-4 text-error" />
                                                        <span className="text-sm text-error">{aiInsights.metrics.avgOrderValue.growth.toFixed(1)}%</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-base-content/70">Stabil</span>
                                                )}
                                            </div>
                                        </div>
                                        <RiMoneyDollarCircleLine className="w-10 h-10 text-primary opacity-50" />
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-base-content/70">Order Frequency</p>
                                            <p className="text-2xl font-bold">{aiInsights.metrics.orderFrequency.current}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {aiInsights.metrics.orderFrequency.growth > 0 ? (
                                                    <>
                                                        <RiArrowUpLine className="w-4 h-4 text-success" />
                                                        <span className="text-sm text-success">+{aiInsights.metrics.orderFrequency.growth.toFixed(1)}%</span>
                                                    </>
                                                ) : aiInsights.metrics.orderFrequency.growth < 0 ? (
                                                    <>
                                                        <RiArrowDownLine className="w-4 h-4 text-error" />
                                                        <span className="text-sm text-error">{aiInsights.metrics.orderFrequency.growth.toFixed(1)}%</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-base-content/70">Stabil</span>
                                                )}
                                            </div>
                                        </div>
                                        <RiLineChartLine className="w-10 h-10 text-secondary opacity-50" />
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-base-content/70">Trend Prediction</p>
                                            <p className="text-2xl font-bold capitalize">{aiInsights.predictions.trend === 'increasing' ? 'Naik' : aiInsights.predictions.trend === 'decreasing' ? 'Turun' : 'Stabil'}</p>
                                            <p className="text-xs text-base-content/70 mt-1">
                                                Proyeksi akhir bulan: {formatCurrency(aiInsights.predictions.projectedMonthEnd)}
                                            </p>
                                        </div>
                                        {aiInsights.predictions.trend === 'increasing' ? (
                                            <RiArrowUpLine className="w-10 h-10 text-success opacity-50" />
                                        ) : aiInsights.predictions.trend === 'decreasing' ? (
                                            <RiArrowDownLine className="w-10 h-10 text-error opacity-50" />
                                        ) : (
                                            <RiLineChartLine className="w-10 h-10 text-accent opacity-50" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Smart Insights Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Business Insights */}
                            <div className="card bg-base-100 shadow-xl border border-base-300">
                                <div className="card-body">
                                    <h3 className="card-title flex items-center gap-2">
                                        <RiSparklingLine className="w-5 h-5 text-warning" />
                                        Key Insights
                                    </h3>
                                    <div className="divider my-2"></div>
                                    <div className="space-y-4">
                                        {aiInsights.insights.peakHour && (
                                            <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                                                <RiCalendarLine className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">Peak Hour: {aiInsights.insights.peakHour.timeRange}</p>
                                                    <p className="text-sm text-base-content/70">{aiInsights.insights.peakHour.orderCount} pesanan pada jam tersebut</p>
                                                </div>
                                            </div>
                                        )}
                                        {aiInsights.insights.topCategory && (
                                            <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                                                <RiTrophyLine className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">Top Category: {aiInsights.insights.topCategory.name}</p>
                                                    <p className="text-sm text-base-content/70">
                                                        {formatCurrency(aiInsights.insights.topCategory.revenue)} • {aiInsights.insights.topCategory.quantity} items terjual
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {aiInsights.insights.topPerformer && (
                                            <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                                                <RiCheckboxCircleFill className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">Best Seller: {aiInsights.insights.topPerformer.name}</p>
                                                    <p className="text-sm text-base-content/70">
                                                        {formatCurrency(aiInsights.insights.topPerformer.revenue)} dari {aiInsights.insights.topPerformer.quantity} porsi
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {aiInsights.insights.slowMovingItems.length > 0 && (
                                            <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                                                <RiAlertLine className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">Slow-Moving Items</p>
                                                    <p className="text-sm text-base-content/70">
                                                        {aiInsights.insights.slowMovingItems.map(item => item.name).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            <div className="card bg-base-100 shadow-xl border border-base-300">
                                <div className="card-body">
                                    <h3 className="card-title flex items-center gap-2">
                                        <RiLightbulbLine className="w-5 h-5 text-accent" />
                                        AI Recommendations
                                    </h3>
                                    <div className="divider my-2"></div>
                                    {aiInsights.recommendations.length === 0 ? (
                                        <div className="text-center py-8 text-base-content/70">
                                            <RiCheckboxCircleFill className="w-12 h-12 mx-auto mb-2 text-success" />
                                            <p>Semua berjalan baik! Tidak ada rekomendasi khusus.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                            {aiInsights.recommendations
                                                .sort((a, b) => {
                                                    const priority = { high: 3, medium: 2, low: 1 }
                                                    return priority[b.priority] - priority[a.priority]
                                                })
                                                .map((rec, index) => (
                                                <div key={index} className={`alert ${
                                                    rec.type === 'success' ? 'alert-success' :
                                                    rec.type === 'warning' ? 'alert-warning' :
                                                    rec.type === 'error' ? 'alert-error' :
                                                    'alert-info'
                                                } shadow-sm`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold">{rec.title}</span>
                                                            <span className={`badge badge-sm ${
                                                                rec.priority === 'high' ? 'badge-error' :
                                                                rec.priority === 'medium' ? 'badge-warning' :
                                                                'badge-ghost'
                                                            }`}>
                                                                {rec.priority}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm opacity-90 mb-1">{rec.description}</p>
                                                        <p className="text-xs font-semibold flex items-center gap-1">
                                                            {rec.action}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        </>
                    )}
                </div>

                {/* AI Strategic Analysis Section (On-Demand) */}
                <div className="mt-8">
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <RiBrainLine className="w-8 h-8 text-primary" />
                            <div>
                                <h2 className="text-2xl font-bold">AI Strategic Analysis</h2>
                                <p className="text-sm text-base-content/70">
                                    {aiInsights?.aiAnalysis ? 'Powered by LLM - Deep strategic insights' : 'Analisis mendalam menggunakan AI LLM'}
                                </p>
                            </div>
                            {aiInsights?.aiAnalysis && (
                                <div className="badge badge-success gap-2">
                                    <RiSparklingLine className="w-3 h-3" />
                                    AI Powered
                                </div>
                            )}
                        </div>
                        
                        {/* Generate Button */}
                        {!hasGeneratedAI && !isLoadingAI && (
                            <button 
                                onClick={generateAIInsights}
                                className="btn btn-primary gap-2"
                            >
                                <RiSparklingLine className="w-5 h-5" />
                                Generate AI Analysis
                            </button>
                        )}
                        
                        {hasGeneratedAI && !isLoadingAI && (
                            <button 
                                onClick={generateAIInsights}
                                className="btn btn-outline btn-sm gap-2"
                            >
                                <RiBrainLine className="w-4 h-4" />
                                Regenerate
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoadingAI && (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center justify-center gap-3 py-8">
                                    <span className="loading loading-spinner loading-lg text-primary"></span>
                                    <span className="text-lg">Generating AI Strategic Analysis... (menggunakan LLM)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show placeholder when not generated yet */}
                    {!hasGeneratedAI && !isLoadingAI && (
                        <div className="card bg-base-100 shadow-xl border-2 border-dashed border-primary/30">
                            <div className="card-body text-center py-12">
                                <RiBrainLine className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">AI Strategic Analysis Belum Di-generate</h3>
                                <p className="text-base-content/70 mb-4">
                                    Klik tombol "Generate AI Analysis" untuk mendapatkan analisis strategis mendalam berbasis LLM
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center text-sm text-base-content/60">
                                    <span className="badge badge-ghost">✓ Overall Business Health</span>
                                    <span className="badge badge-ghost">✓ Key Strategic Findings</span>
                                    <span className="badge badge-ghost">✓ Risk Factors</span>
                                    <span className="badge badge-ghost">✓ Growth Opportunities</span>
                                    <span className="badge badge-ghost">✓ AI-Powered Recommendations</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Strategic Analysis Content (if available) */}
                    {aiInsights?.aiAnalysis && hasGeneratedAI && !isLoadingAI && (
                        <div className="card bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title flex items-center gap-2">
                                    <RiCheckboxCircleFill className="w-6 h-6 text-primary" />
                                    Strategic Business Analysis
                                </h3>
                                <div className="divider my-2"></div>
                                
                                {/* Overall Health */}
                                <div className="mb-4">
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <RiCheckboxCircleFill className="w-5 h-5 text-success" />
                                        Overall Business Health
                                    </h4>
                                    <p className="text-base-content/80 leading-relaxed">{aiInsights.aiAnalysis.overallHealth}</p>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    {/* Key Findings */}
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2 text-primary">
                                            <RiLightbulbLine className="w-4 h-4" />
                                            Key Findings
                                        </h4>
                                        <ul className="space-y-2">
                                            {aiInsights.aiAnalysis.keyFindings.map((finding, i) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span>{finding}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Risk Factors */}
                                    {aiInsights.aiAnalysis.riskFactors.length > 0 && (
                                        <div>
                                            <h4 className="font-bold mb-2 flex items-center gap-2 text-warning">
                                                <RiAlertLine className="w-4 h-4" />
                                                Risk Factors
                                            </h4>
                                            <ul className="space-y-2">
                                                {aiInsights.aiAnalysis.riskFactors.map((risk, i) => (
                                                    <li key={i} className="text-sm flex items-start gap-2">
                                                        <span className="text-warning mt-1">⚠</span>
                                                        <span>{risk}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Opportunities */}
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2 text-success">
                                            <RiSparklingLine className="w-4 h-4" />
                                            Opportunities
                                        </h4>
                                        <ul className="space-y-2">
                                            {aiInsights.aiAnalysis.opportunities.map((opp, i) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <span className="text-success mt-1">✓</span>
                                                    <span>{opp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="/dashboard/history" className="btn btn-lg btn-outline">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Lihat History Pesanan
                    </a>
                    <a href="/dashboard/reports" className="btn btn-lg btn-outline">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Laporan Bulanan
                    </a>
                    <a href="/live" className="btn btn-lg btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Monitor Pesanan Live
                    </a>
                </div>
            </div>
        </div>
    )
}
