'use client'

import { useState, useEffect } from "react"
import { getActiveOrders } from "./actions"
import { getTables } from "@/app/table/actions"
import { completeOrder } from "./actions"
import { useRouter } from "next/navigation"
import { OrderStatus, TableStatus, PaymentMethod } from "@/generated/prisma/browser"
import useToastStore from "@/stores/toast"
import ReceiptPrint from "@/components/ReceiptPrint"
import { getPaymentMethodLabel } from "@/lib/enumHelpers"

type OrderItem = {
    id: string
    quantity: number
    price: number
    menuItem: {
        id: string
        name: string
        price: number
    }
}

type Order = {
    id: string
    totalPrice: number
    status: OrderStatus
    createdAt: string | Date
    paymentMethod?: string | null
    sessionId?: string | null
    table: {
        id: string
        name: string
        slug: string
    }
    orderItems: OrderItem[]
    session?: {
        id: string
        sessionId: string
        isActive: boolean
    } | null
}

type Table = {
    id: string
    name: string
    slug: string
    status: TableStatus
    orders: any[]
}

export default function CashierView({ 
    initialOrders, 
    initialTables 
}: { 
    initialOrders: Order[]
    initialTables: Table[]
}) {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [tables, setTables] = useState<Table[]>(initialTables)
    const [selectedTable, setSelectedTable] = useState<string | null>(null)
    const [completingId, setCompletingId] = useState<string | null>(null)
    const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
    const [showReceiptDialog, setShowReceiptDialog] = useState(false)
    const { setMessage } = useToastStore()

    useEffect(() => {
        // Poll for updates every 5 seconds
        const interval = setInterval(async () => {
            const [ordersResult, tablesResult] = await Promise.all([
                getActiveOrders(),
                getTables()
            ])
            
            if (ordersResult.success && ordersResult.data) {
                setOrders(ordersResult.data)
            }
            if (tablesResult.success && tablesResult.data) {
                setTables(tablesResult.data)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    async function handleCompleteOrder(orderId: string) {
        if (!confirm('Apakah pembayaran sudah diterima?')) return
        
        // Find the order before completing
        const orderToComplete = orders.find(o => o.id === orderId)
        if (!orderToComplete) return
        
        setCompletingId(orderId)
        const result = await completeOrder(orderId)
        
        if (result.success) {
            // Show receipt dialog with completed order data
            setCompletedOrder(orderToComplete)
            setShowReceiptDialog(true)
            setMessage('Pesanan berhasil diselesaikan', 'success')
            
            // Refresh data
            const [ordersResult, tablesResult] = await Promise.all([
                getActiveOrders(),
                getTables()
            ])
            
            if (ordersResult.success && ordersResult.data) {
                setOrders(ordersResult.data)
            }
            if (tablesResult.success && tablesResult.data) {
                setTables(tablesResult.data)
            }
        } else {
            setMessage('Gagal menyelesaikan pesanan', 'error')
        }
        setCompletingId(null)
    }

    function handleCloseReceiptDialog() {
        setShowReceiptDialog(false)
        setCompletedOrder(null)
        router.refresh()
    }

    function getStatusBadge(status: OrderStatus) {
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

    function getTableStatusBadge(status: TableStatus) {
        const badges = {
            AVAILABLE: 'badge-success',
            OCCUPIED: 'badge-error',
            RESERVED: 'badge-warning',
            OUT_OF_SERVICE: 'badge-neutral'
        }
        
        const labels = {
            AVAILABLE: 'Tersedia',
            OCCUPIED: 'Terisi',
            RESERVED: 'Dipesan',
            OUT_OF_SERVICE: 'Tidak Tersedia'
        }

        return (
            <span className={`badge ${badges[status]}`}>
                {labels[status]}
            </span>
        )
    }

    const occupiedTables = tables.filter(t => t.status === TableStatus.OCCUPIED)
    const selectedTableData = selectedTable ? tables.find(t => t.id === selectedTable) : null
    const selectedTableOrders = selectedTableData?.orders || []

    // Group orders by session
    const groupOrdersBySession = (ordersList: Order[]) => {
        const grouped = new Map<string, Order[]>()
        const ungrouped: Order[] = []

        ordersList.forEach(order => {
            if (order.sessionId) {
                const existing = grouped.get(order.sessionId)
                if (existing) {
                    existing.push(order)
                } else {
                    grouped.set(order.sessionId, [order])
                }
            } else {
                ungrouped.push(order)
            }
        })

        return { grouped: Array.from(grouped.entries()), ungrouped }
    }

    const displayOrders = selectedTable ? selectedTableOrders : orders
    const { grouped: sessionGroups, ungrouped: singleOrders } = groupOrdersBySession(displayOrders)

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="hidden sm:block">
                            <h1 className="text-3xl font-bold">Kasir Dashboard</h1>
                            <p className="text-sm opacity-90 mt-1">Kelola pembayaran dan status meja</p>
                        </div>
                        <div className="stats shadow bg-primary-content text-primary w-full sm:w-auto">
                            <div className="stat">
                                <div className="stat-title text-xs">Meja Terisi</div>
                                <div className="stat-value text-2xl">{occupiedTables.length}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title text-xs">Pesanan Aktif</div>
                                <div className="stat-value text-2xl">{orders.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tables Status */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-xl sticky top-6">
                            <div className="card-body">
                                <h2 className="card-title">Status Meja</h2>
                                <div className="divider my-2"></div>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {tables.map((table) => (
                                        <button
                                            key={table.id}
                                            className={`w-full p-4 rounded-lg text-left transition-all ${
                                                selectedTable === table.id 
                                                    ? 'bg-primary text-primary-content' 
                                                    : 'bg-base-200 hover:bg-base-300'
                                            }`}
                                            onClick={() => setSelectedTable(table.id)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-lg">{table.name}</span>
                                                {getTableStatusBadge(table.status)}
                                            </div>
                                            {table.orders.length > 0 && (
                                                <p className="text-xs opacity-70">
                                                    {table.orders.length} pesanan aktif
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">
                                    {selectedTableData 
                                        ? `Pesanan ${selectedTableData.name}`
                                        : 'Semua Pesanan Aktif'
                                    }
                                </h2>
                                <div className="divider my-2"></div>

                                {displayOrders.length === 0 ? (
                                    <div className="text-center py-16">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg text-base-content/70">Tidak ada pesanan</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Session-grouped orders */}
                                        {sessionGroups.map(([sessionId, sessionOrders]) => {
                                            const grandTotal = sessionOrders.reduce((sum, order) => sum + order.totalPrice, 0)
                                            const allReady = sessionOrders.every(order => order.status === OrderStatus.READY)
                                            const firstOrder = sessionOrders[0]
                                            
                                            return (
                                                <div key={sessionId} className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="font-bold text-lg">{firstOrder.table.name}</h3>
                                                            <p className="text-xs text-base-content/70">
                                                                {sessionOrders.length} batch pesanan • Session aktif
                                                            </p>
                                                        </div>
                                                        <div className="badge badge-primary badge-lg">Multi-Batch</div>
                                                    </div>

                                                    {/* Individual batches */}
                                                    <div className="space-y-3 mb-4">
                                                        {sessionOrders.map((order, idx) => (
                                                            <div key={order.id} className="bg-base-100 rounded-lg p-3 border border-base-300">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-semibold text-sm">Batch #{idx + 1}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-base-content/70">
                                                                            {new Date(order.createdAt).toLocaleTimeString('id-ID')}
                                                                        </span>
                                                                        {getStatusBadge(order.status)}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="space-y-1">
                                                                    {order.orderItems.map((item: OrderItem) => (
                                                                        <div key={item.id} className="flex justify-between text-sm">
                                                                            <span className="text-base-content/80">{item.menuItem.name} x{item.quantity}</span>
                                                                            <span className="font-medium">
                                                                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                
                                                                <div className="flex justify-between mt-2 pt-2 border-t border-base-300">
                                                                    <span className="text-sm font-semibold">Subtotal Batch:</span>
                                                                    <span className="font-bold text-primary">
                                                                        Rp {order.totalPrice.toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Grand total and action */}
                                                    <div className="bg-primary/10 rounded-lg p-4 border border-primary">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div>
                                                                <p className="text-sm text-base-content/70">Total Keseluruhan:</p>
                                                                <p className="font-bold text-2xl text-primary">
                                                                    Rp {grandTotal.toLocaleString('id-ID')}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {allReady && (
                                                                    <>
                                                                        <ReceiptPrint 
                                                                            order={{ 
                                                                                ...firstOrder, 
                                                                                totalPrice: grandTotal,
                                                                                orderItems: sessionOrders.flatMap(o => o.orderItems)
                                                                            }} 
                                                                            className="btn-primary btn-lg"
                                                                        />
                                                                        <button
                                                                            className="btn btn-success btn-lg"
                                                                            onClick={() => handleCompleteOrder(firstOrder.id)}
                                                                            disabled={completingId === firstOrder.id}
                                                                        >
                                                                            {completingId === firstOrder.id ? (
                                                                                <>
                                                                                    <span className="loading loading-spinner"></span>
                                                                                    Memproses...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Bayar & Selesaikan
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!allReady && (
                                                            <p className="text-xs text-warning">
                                                                ⏳ Menunggu semua batch siap untuk pembayaran
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* Single orders (no session) */}
                                        {singleOrders.map((order) => (
                                            <div key={order.id} className="border border-base-300 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{order.table.name}</h3>
                                                        <p className="text-xs text-base-content/70">
                                                            {new Date(order.createdAt).toLocaleString('id-ID')}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(order.status)}
                                                </div>

                                                <div className="space-y-2 mb-3">
                                                    {order.orderItems.map((item: OrderItem) => (
                                                        <div key={item.id} className="flex justify-between text-sm bg-base-200 p-2 rounded">
                                                            <span>{item.menuItem.name} x{item.quantity}</span>
                                                            <span className="font-semibold">
                                                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-base-300">
                                                    <div>
                                                        <p className="text-sm text-base-content/70">Total Pembayaran:</p>
                                                        <p className="font-bold text-xl text-primary">
                                                            Rp {order.totalPrice.toLocaleString('id-ID')}
                                                        </p>
                                                        {order.paymentMethod && (
                                                            <p className="text-xs text-base-content/70 mt-1">
                                                                via {getPaymentMethodLabel(order.paymentMethod as PaymentMethod)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {order.status === OrderStatus.READY && (
                                                            <>
                                                                <ReceiptPrint order={order} className="btn-primary" />
                                                                <button
                                                                    className="btn btn-success"
                                                                    onClick={() => handleCompleteOrder(order.id)}
                                                                    disabled={completingId === order.id}
                                                                >
                                                                    {completingId === order.id ? (
                                                                        <>
                                                                            <span className="loading loading-spinner"></span>
                                                                            Memproses...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Selesaikan Pesanan
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Dialog Modal */}
            {showReceiptDialog && completedOrder && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Pesanan Selesai!
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="alert alert-success">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="font-bold">Pembayaran Diterima</h3>
                                    <div className="text-xs">Pesanan {completedOrder.table.name} telah diselesaikan</div>
                                </div>
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-base-content/70">Meja:</span>
                                    <span className="font-semibold">{completedOrder.table.name}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-base-content/70">Total Item:</span>
                                    <span className="font-semibold">{completedOrder.orderItems.length} item</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-base-content/70">Total Bayar:</span>
                                    <span className="font-bold text-lg text-primary">
                                        Rp {completedOrder.totalPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="divider">Cetak Struk?</div>

                            <div className="flex gap-2">
                                <ReceiptPrint 
                                    order={completedOrder} 
                                    className="btn-primary flex-1"
                                    onAfterPrint={handleCloseReceiptDialog}
                                />
                                <button 
                                    className="btn btn-ghost flex-1" 
                                    onClick={handleCloseReceiptDialog}
                                >
                                    Lewati
                                </button>
                            </div>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop" onClick={handleCloseReceiptDialog}>
                        <button>close</button>
                    </form>
                </dialog>
            )}
        </div>
    )
}
