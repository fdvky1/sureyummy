'use client'

import { format } from "date-fns"
import { id } from "date-fns/locale"
import { 
  RiMoneyDollarCircleLine,
  RiCalculatorLine,
  RiFileListLine,
  RiCheckboxCircleLine,
  RiTrophyLine,
  RiLineChartLine,
  RiCalendarLine,
  RiEyeLine
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

type DashboardViewProps = {
    stats: DashboardStats | null
    userName?: string | null
}

export default function DashboardView({ stats, userName }: DashboardViewProps) {
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
                                                            {item.category || 'N/A'}
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
