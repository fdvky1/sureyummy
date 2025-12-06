'use client'

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { RiTrophyLine, RiBarChartBoxLine, RiCalendarLine, RiPrinterLine } from '@remixicon/react'
import { MenuCategory } from "@/generated/prisma/browser"
import { getMenuCategoryLabel } from "@/lib/enumHelpers"

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

    const handlePrint = () => {
        if (!report) return

        const printWindow = window.open('', '_blank', 'width=800,height=600')
        if (!printWindow) {
            alert('Popup diblokir! Izinkan popup untuk mencetak laporan.')
            return
        }

        const printContent = generatePrintHTML(report)
        printWindow.document.write(printContent)
        printWindow.document.close()

        printWindow.onload = () => {
            printWindow.focus()
            printWindow.print()
            setTimeout(() => {
                printWindow.close()
            }, 100)
        }
    }

    const generatePrintHTML = (report: MonthlyReport) => {
        const categoryEntries = Object.entries(report.categoryStats)
            .sort(([, a], [, b]) => b.revenue - a.revenue)

        return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Bulanan - ${report.period.monthName} ${report.period.year}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #FF6B6B;
        }
        
        .header h1 {
            font-size: 28px;
            color: #FF6B6B;
            margin-bottom: 5px;
        }
        
        .header h2 {
            font-size: 20px;
            color: #666;
            font-weight: normal;
        }
        
        .header .period {
            font-size: 18px;
            color: #333;
            margin-top: 10px;
            font-weight: bold;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #FF6B6B;
        }
        
        .summary-card h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .font-bold {
            font-weight: bold;
        }
        
        .category-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .category-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #FF6B6B;
        }
        
        .category-item .name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .category-item .stats {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #666;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        @media print {
            body {
                padding: 10px;
            }
            
            .summary {
                page-break-inside: avoid;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            @page {
                margin: 1cm;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🍽️ SureYummy Restaurant</h1>
        <h2>Laporan Bulanan</h2>
        <div class="period">${report.period.monthName} ${report.period.year}</div>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Pendapatan</h3>
            <div class="value">${formatCurrency(report.summary.totalRevenue)}</div>
        </div>
        <div class="summary-card">
            <h3>Total Pesanan</h3>
            <div class="value">${report.summary.totalOrders.toLocaleString('id-ID')}</div>
        </div>
        <div class="summary-card">
            <h3>Rata-rata per Pesanan</h3>
            <div class="value">${formatCurrency(report.summary.averageOrderValue)}</div>
        </div>
    </div>

    <div class="section">
        <h3>📊 Top 10 Menu Terlaris</h3>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Nama Menu</th>
                    <th class="text-center">Terjual</th>
                    <th class="text-right">Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${report.topItems.slice(0, 10).map((item, index) => `
                    <tr>
                        <td class="font-bold">#${index + 1}</td>
                        <td>${item.name}</td>
                        <td class="text-center">${item.quantity} porsi</td>
                        <td class="text-right font-bold">${formatCurrency(item.revenue)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>🏷️ Performa per Kategori</h3>
        <div class="category-grid">
            ${categoryEntries.map(([category, stats]) => `
                <div class="category-item">
                    <div class="name">${getMenuCategoryLabel(category as MenuCategory)}</div>
                    <div class="stats">
                        <span>${stats.quantity} items</span>
                        <span class="font-bold">${formatCurrency(stats.revenue)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h3>📅 Breakdown Harian</h3>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th class="text-center">Jumlah Pesanan</th>
                    <th class="text-right">Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${report.dailyStats.map(day => `
                    <tr>
                        <td>${format(new Date(day.date), 'EEEE, dd MMMM yyyy', { locale: id })}</td>
                        <td class="text-center">${day.orderCount} pesanan</td>
                        <td class="text-right font-bold">${formatCurrency(day.revenue)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Dicetak pada: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
        <p style="margin-top: 5px;">© ${new Date().getFullYear()} SureYummy Restaurant - Laporan ini bersifat rahasia</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
        `
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
                            <div className="flex items-center gap-2">
                                <div className="badge badge-lg badge-primary">{report.period.monthName}</div>
                                <button 
                                    onClick={handlePrint}
                                    className="btn btn-primary gap-2"
                                >
                                    <RiPrinterLine className="w-5 h-5" />
                                    Print Laporan
                                </button>
                            </div>
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
                                                    <span className="font-semibold">{getMenuCategoryLabel(category as MenuCategory)}</span>
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
