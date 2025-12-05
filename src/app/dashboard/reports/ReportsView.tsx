'use client'

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { RiTrophyLine, RiBarChartBoxLine, RiCalendarLine } from '@remixicon/react'

type MonthlyReport = {
    period: {
        year: number
        month: number
        monthName: string
    }
    summary: {
        totalRevenue: number
        totalOrders: number
        averageOrderValue: number
    }
    categoryStats: Record<string, { revenue: number, quantity: number }>
    topItems: Array<{
        name: string
        quantity: number
        revenue: number
    }>
    dailyStats: Array<{
        date: string
        revenue: number
        orderCount: number
    }>
}

type ReportsViewProps = {
    report: MonthlyReport | null
    currentYear: number
    currentMonth: number
}

export default function ReportsView({ report, currentYear, currentMonth }: ReportsViewProps) {
    const router = useRouter()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handleMonthChange = (year: number, month: number) => {
        router.push(`/dashboard/reports?year=${year}&month=${month}`)
    }

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

    if (!report) {
        return (
            <div className="min-h-screen bg-base-200 p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Laporan Bulanan</h1>
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body items-center text-center py-16">
                            <p className="text-lg text-base-content/70">Tidak ada data untuk periode ini</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Laporan Bulanan</h1>
                    <p className="text-base-content/70">
                        Analisis lengkap pendapatan dan penjualan per bulan
                    </p>
                </div>

                {/* Period Selector */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="form-control w-full sm:w-auto">
                                <label className="label">
                                    <span className="label-text">Bulan</span>
                                </label>
                                <select 
                                    className="select select-bordered"
                                    value={currentMonth}
                                    onChange={(e) => handleMonthChange(currentYear, parseInt(e.target.value))}
                                >
                                    {months.map((month, index) => (
                                        <option key={index} value={index + 1}>{month}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-control w-full sm:w-auto">
                                <label className="label">
                                    <span className="label-text">Tahun</span>
                                </label>
                                <select 
                                    className="select select-bordered"
                                    value={currentYear}
                                    onChange={(e) => handleMonthChange(parseInt(e.target.value), currentMonth)}
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1"></div>
                            <div className="badge badge-lg badge-primary">{report.period.monthName}</div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="stat-title">Total Pendapatan</div>
                            <div className="stat-value text-primary text-2xl">
                                {formatCurrency(report.summary.totalRevenue)}
                            </div>
                            <div className="stat-desc">Periode: {report.period.monthName}</div>
                        </div>
                    </div>

                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="stat-title">Total Pesanan</div>
                            <div className="stat-value text-secondary">{report.summary.totalOrders}</div>
                            <div className="stat-desc">Transaksi selesai</div>
                        </div>
                    </div>

                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-accent">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="stat-title">Rata-rata per Pesanan</div>
                            <div className="stat-value text-accent text-2xl">
                                {formatCurrency(report.summary.averageOrderValue)}
                            </div>
                            <div className="stat-desc">Average Order Value</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Items */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title flex items-center gap-2">
                                <RiTrophyLine className="w-5 h-5 text-warning" />
                                Top 10 Menu Terlaris
                            </h2>
                            <div className="divider my-2"></div>
                            
                            {report.topItems.length === 0 ? (
                                <div className="text-center py-8 text-base-content/70">
                                    Tidak ada data penjualan
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Menu</th>
                                                <th className="text-right">Terjual</th>
                                                <th className="text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.topItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className={`badge badge-sm ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-neutral' : index === 2 ? 'badge-accent' : 'badge-ghost'}`}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="font-medium">{item.name}</td>
                                                    <td className="text-right">{item.quantity}</td>
                                                    <td className="text-right font-semibold text-primary">
                                                        {formatCurrency(item.revenue)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Stats */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title flex items-center gap-2">
                                <RiBarChartBoxLine className="w-5 h-5 text-info" />
                                Penjualan per Kategori
                            </h2>
                            <div className="divider my-2"></div>
                            
                            {Object.keys(report.categoryStats).length === 0 ? (
                                <div className="text-center py-8 text-base-content/70">
                                    Tidak ada data kategori
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(report.categoryStats)
                                        .sort(([, a], [, b]) => b.revenue - a.revenue)
                                        .map(([category, stats]) => (
                                            <div key={category} className="p-3 bg-base-200 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold">{category}</span>
                                                    <span className="badge badge-primary">{stats.quantity} items</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-base-content/70">Revenue</span>
                                                    <span className="font-bold text-primary">
                                                        {formatCurrency(stats.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Daily Breakdown */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title flex items-center gap-2">
                            <RiCalendarLine className="w-5 h-5 text-secondary" />
                            Breakdown Harian
                        </h2>
                        <div className="divider my-2"></div>
                        
                        {report.dailyStats.length === 0 ? (
                            <div className="text-center py-8 text-base-content/70">
                                Tidak ada transaksi
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th className="text-right">Pesanan</th>
                                            <th className="text-right">Pendapatan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.dailyStats.map((day) => (
                                            <tr key={day.date}>
                                                <td>
                                                    <div className="font-medium">
                                                        {format(new Date(day.date), 'dd MMMM yyyy', { locale: id })}
                                                    </div>
                                                    <div className="text-xs text-base-content/70">
                                                        {format(new Date(day.date), 'EEEE', { locale: id })}
                                                    </div>
                                                </td>
                                                <td className="text-right font-semibold">{day.orderCount}</td>
                                                <td className="text-right font-bold text-primary">
                                                    {formatCurrency(day.revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-base-200 font-bold">
                                            <td>TOTAL</td>
                                            <td className="text-right">{report.summary.totalOrders}</td>
                                            <td className="text-right text-primary">
                                                {formatCurrency(report.summary.totalRevenue)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
