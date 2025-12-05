'use client'

import { useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { OrderStatus } from "@/generated/prisma/browser"

type Order = {
    id: string
    totalPrice: number
    status: OrderStatus
    createdAt: Date | string
    paymentMethod?: string | null
    isPaid: boolean
    table: {
        id: string
        name: string
        slug: string
    }
    orderItems: Array<{
        id: string
        quantity: number
        price: number
        menuItem: {
            id: string
            name: string
            price: number
            category: string | null
        }
    }>
    session?: {
        id: string
        sessionId: string
        isActive: boolean
    } | null
}

type HistoryViewProps = {
    orders: Order[]
}

export default function HistoryView({ orders }: HistoryViewProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL')

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getStatusBadge = (status: OrderStatus) => {
        const badges = {
            PENDING: 'badge-warning',
            CONFIRMED: 'badge-info',
            PREPARING: 'badge-primary',
            READY: 'badge-success',
            COMPLETED: 'badge-neutral',
            CANCELLED: 'badge-error'
        }
        
        const labels = {
            PENDING: 'Menunggu',
            CONFIRMED: 'Dikonfirmasi',
            PREPARING: 'Sedang Dimasak',
            READY: 'Siap',
            COMPLETED: 'Selesai',
            CANCELLED: 'Dibatalkan'
        }

        return (
            <span className={`badge ${badges[status]}`}>
                {labels[status]}
            </span>
        )
    }

    const filteredOrders = filterStatus === 'ALL' 
        ? orders 
        : orders.filter(order => order.status === filterStatus)

    const totalRevenue = filteredOrders
        .filter(order => order.status === OrderStatus.COMPLETED)
        .reduce((sum, order) => sum + order.totalPrice, 0)

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">History Pesanan</h1>
                    <p className="text-base-content/70">
                        Riwayat semua transaksi pesanan
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-title">Total Pesanan</div>
                            <div className="stat-value text-primary">{filteredOrders.length}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-title">Selesai</div>
                            <div className="stat-value text-success">
                                {filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).length}
                            </div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-title">Total Pendapatan</div>
                            <div className="stat-value text-secondary text-2xl">{formatCurrency(totalRevenue)}</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex flex-wrap gap-2">
                            <button 
                                className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus('ALL')}
                            >
                                Semua
                            </button>
                            <button 
                                className={`btn btn-sm ${filterStatus === OrderStatus.COMPLETED ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus(OrderStatus.COMPLETED)}
                            >
                                Selesai
                            </button>
                            <button 
                                className={`btn btn-sm ${filterStatus === OrderStatus.PENDING ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus(OrderStatus.PENDING)}
                            >
                                Menunggu
                            </button>
                            <button 
                                className={`btn btn-sm ${filterStatus === OrderStatus.PREPARING ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus(OrderStatus.PREPARING)}
                            >
                                Sedang Dimasak
                            </button>
                            <button 
                                className={`btn btn-sm ${filterStatus === OrderStatus.CANCELLED ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus(OrderStatus.CANCELLED)}
                            >
                                Dibatalkan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title mb-4">Daftar Pesanan</h2>
                        
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-lg text-base-content/70">Tidak ada pesanan ditemukan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Waktu</th>
                                            <th>Meja</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Pembayaran</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td>
                                                    <div className="font-mono text-xs">
                                                        {order.id.slice(0, 8)}...
                                                    </div>
                                                    {order.session && (
                                                        <div className="badge badge-xs badge-primary mt-1">Multi-Batch</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="text-sm">
                                                        {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
                                                    </div>
                                                    <div className="text-xs text-base-content/70">
                                                        {format(new Date(order.createdAt), 'HH:mm', { locale: id })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="font-semibold">{order.table.name}</div>
                                                </td>
                                                <td>
                                                    <div className="text-sm">
                                                        {order.orderItems.length} item
                                                        <span className="text-xs text-base-content/70">
                                                            {' '}({order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} qty)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="font-semibold text-primary">
                                                        {formatCurrency(order.totalPrice)}
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(order.status)}
                                                </td>
                                                <td>
                                                    {order.isPaid ? (
                                                        <div className="badge badge-success badge-sm">Lunas</div>
                                                    ) : (
                                                        <div className="badge badge-warning badge-sm">Belum</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={() => setSelectedOrder(order)}
                                                    >
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Detail Pesanan</h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-base-content/70">ID Pesanan</p>
                                    <p className="font-mono text-sm">{selectedOrder.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Waktu</p>
                                    <p className="font-medium">
                                        {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Meja</p>
                                    <p className="font-medium">{selectedOrder.table.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Status</p>
                                    <div className="mt-1">
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="divider">Items</div>

                            <div className="space-y-2">
                                {selectedOrder.orderItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.menuItem.name}</p>
                                            <p className="text-xs text-base-content/70">
                                                {item.menuItem.category || 'N/A'} • {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-base-content/70">x{item.quantity}</p>
                                            <p className="font-semibold text-primary">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="divider">Total</div>

                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total Pembayaran</span>
                                <span className="text-primary">{formatCurrency(selectedOrder.totalPrice)}</span>
                            </div>

                            {selectedOrder.paymentMethod && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-base-content/70">Metode Pembayaran</span>
                                    <span className="font-medium">{selectedOrder.paymentMethod}</span>
                                </div>
                            )}
                        </div>

                        <div className="modal-action">
                            <button className="btn" onClick={() => setSelectedOrder(null)}>Tutup</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}></div>
                </div>
            )}
        </div>
    )
}
