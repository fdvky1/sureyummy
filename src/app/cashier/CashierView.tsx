'use client'

import { useState, useEffect, useMemo } from "react"
import { getCashierData, completeOrder } from "./actions"
import { useRouter } from "next/navigation"
import { OrderStatus, TableStatus } from "@/generated/prisma/browser"
import useToastStore from "@/stores/toast"
import useModalStore from "@/stores/modal"
import ReceiptPrint from "@/components/ReceiptPrint"
import { getWebSocketClient } from "@/lib/ws.client"
import OrderCard from "@/components/OrderCard"
import { Order, groupOrdersBySession, calculateGrandTotal, allOrdersHaveStatus } from "@/types/order"
import { 
    getOrderStatusLabel, 
    getOrderStatusBadgeClass, 
    getTableStatusLabel, 
    getTableStatusBadgeClass 
} from "@/lib/enumHelpers"

type Table = {
    id: string
    name: string
    slug: string
    status: TableStatus
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
    const [completedSessionOrders, setCompletedSessionOrders] = useState<Order[]>([])
    const [wsStatus, setWsStatus] = useState<'connected' | 'polling' | 'connecting'>('connecting')
    const [showReceiptDialog, setShowReceiptDialog] = useState(false)
    const { setMessage } = useToastStore()
    const { setModal, resetModal } = useModalStore()

    const fetchData = async () => {
        try {
            const result = await getCashierData()
            
            if (result.success && result.data) {
                setOrders(result.data.orders)
                setTables(result.data.tables)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        }
    }

    useEffect(() => {
        fetchData()

        const ws = getWebSocketClient()
        const unsubscribe = ws.subscribe((message) => {
            const { type, data } = message || {}
            if (!type || !data) return
            
            switch (type) {
                case 'order.new':
                    if (data.order) {
                        setOrders(prev => [data.order, ...prev])
                        if (data.tables) setTables(data.tables)
                    }
                    break
                    
                case 'order.status':
                    if (data.order) {
                        setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o))
                        if (data.tables) setTables(data.tables)
                    }
                    break
                    
                case 'order.completed':
                    const { sessionId, orderId } = data
                    setOrders(prev => prev.filter(o => 
                        sessionId ? o.sessionId !== sessionId : o.id !== orderId
                    ))
                    if (data.tables) setTables(data.tables)
                    break
            }
        })

        ws.connect()

        const pollingInterval = setInterval(() => {
            if (!ws.getStatus().connected) fetchData()
        }, 5000)

        const statusInterval = setInterval(() => {
            setWsStatus(ws.getStatus().connected ? 'connected' : 'polling')
        }, 1000)

        return () => {
            clearInterval(statusInterval)
            clearInterval(pollingInterval)
            unsubscribe()
            ws.disconnect()
        }
    }, [])

    async function handleCompleteOrder(orderId: string) {
        const orderToComplete = orders.find(o => o.id === orderId)
        if (!orderToComplete) return
        
        // Get all orders in the same session for receipt
        const sessionOrders = orderToComplete.sessionId
            ? orders.filter(o => o.sessionId === orderToComplete.sessionId)
            : [orderToComplete]
        
        const grandTotal = calculateGrandTotal(sessionOrders)
        
        setModal({
            title: 'Konfirmasi Pembayaran',
            content: 'Apakah pembayaran sudah diterima?',
            cancelButton: {
                text: 'Batal',
                active: true,
                onClick: () => resetModal()
            },
            confirmButton: {
                text: 'Ya, Sudah Diterima',
                className: 'btn-success',
                active: true,
                onClick: async () => {
                    resetModal()
                    setCompletingId(orderId)
                    
                    const result = await completeOrder(orderId)
                    
                    if (result.success) {
                        setCompletedOrder({
                            ...orderToComplete,
                            totalPrice: grandTotal,
                            isPaid: true
                        })
                        setCompletedSessionOrders(sessionOrders.length > 1 ? sessionOrders : [])
                        setShowReceiptDialog(true)
                        setMessage('Pesanan berhasil diselesaikan', 'success')
                    } else {
                        setMessage('Gagal menyelesaikan pesanan', 'error')
                    }
                    
                    setCompletingId(null)
                }
            }
        })
    }

    function handleCloseReceiptDialog() {
        setShowReceiptDialog(false)
        setCompletedOrder(null)
        setCompletedSessionOrders([])
        router.refresh()
    }

    function getStatusBadge(status: OrderStatus) {
        return (
            <span className={`badge ${getOrderStatusBadgeClass(status)}`}>
                {getOrderStatusLabel(status)}
            </span>
        )
    }

    function getTableStatusBadge(status: TableStatus) {
        return (
            <span className={`badge ${getTableStatusBadgeClass(status)}`}>
                {getTableStatusLabel(status)}
            </span>
        )
    }

    // Memoized calculations for performance
    const displayOrders = useMemo(() => 
        selectedTable ? orders.filter(o => o.table?.id === selectedTable) : orders,
        [orders, selectedTable]
    )
    
    const orderGroups = useMemo(() => 
        groupOrdersBySession(displayOrders),
        [displayOrders]
    )
    
    const tableOrderCounts = useMemo(() => {
        const counts = new Map<string, number>()
        orders.forEach(o => {
            if (o.table?.id) counts.set(o.table.id, (counts.get(o.table.id) || 0) + 1)
        })
        return counts
    }, [orders])
    
    const occupiedTables = useMemo(() => 
        tables.filter(t => t.status === TableStatus.OCCUPIED),
        [tables]
    )
    
    const selectedTableData = useMemo(() => 
        selectedTable ? tables.find(t => t.id === selectedTable) : null,
        [tables, selectedTable]
    )

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="hidden sm:block">
                            <h1 className="text-3xl font-bold">Kasir Dashboard</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm opacity-90">Kelola pembayaran dan status meja</p>
                                {wsStatus === 'connected' && (
                                    <span className="badge badge-success gap-2">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        WebSocket
                                    </span>
                                )}
                                {wsStatus === 'polling' && (
                                    <span className="badge badge-warning gap-2">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        Polling
                                    </span>
                                )}
                                {wsStatus === 'connecting' && (
                                    <span className="badge badge-ghost gap-2">
                                        Connecting...
                                    </span>
                                )}
                            </div>
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
                                    {tables.map((table) => {
                                        const orderCount = tableOrderCounts.get(table.id) || 0
                                        return (
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
                                                {orderCount > 0 && (
                                                    <p className="text-xs opacity-70">
                                                        {orderCount} pesanan aktif
                                                    </p>
                                                )}
                                            </button>
                                        )
                                    })}
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
                                        {orderGroups.map(([groupKey, groupOrders]) => {
                                            if (groupOrders.length === 0) return null
                                            
                                            const isMultiBatch = groupOrders.length > 1
                                            const grandTotal = calculateGrandTotal(groupOrders)
                                            const allReady = allOrdersHaveStatus(groupOrders, OrderStatus.READY)
                                            const firstOrder = groupOrders[0]
                                            
                                            return (
                                                <div key={groupKey} className={isMultiBatch ? "border-2 border-primary rounded-lg p-4 bg-primary/5" : ""}>
                                                    {/* Header - only for multi-batch */}
                                                    {isMultiBatch && (
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h3 className="font-bold text-lg">{firstOrder.table.name}</h3>
                                                                <p className="text-xs text-base-content/70">
                                                                    {groupOrders.length} batch pesanan • Session aktif
                                                                </p>
                                                            </div>
                                                            <div className="badge badge-primary badge-lg">Multi-Batch</div>
                                                        </div>
                                                    )}

                                                    {/* Order cards */}
                                                    <div className={isMultiBatch ? "space-y-3 mb-4" : ""}>
                                                        {groupOrders.map((order, idx) => (
                                                            <OrderCard
                                                                key={order.id}
                                                                order={order}
                                                                idx={isMultiBatch ? idx : undefined}
                                                                getStatusBadge={getStatusBadge}
                                                            />
                                                        ))}
                                                    </div>

                                                    {allReady && (
                                                        <div className="bg-primary/10 rounded-lg p-4 border border-primary">
                                                            <div className={"flex items-center mb-3 " + (isMultiBatch ? "justify-between" : "justify-end")}>
                                                                {isMultiBatch && (
                                                                    <div>
                                                                        <p className="text-sm text-base-content/70">Tot`al Keseluruhan:</p>
                                                                        <p className="font-bold text-2xl text-primary">
                                                                            Rp {grandTotal.toLocaleString('id-ID')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2 items-center">
                                                                    <ReceiptPrint 
                                                                        order={ isMultiBatch ?{ 
                                                                            ...firstOrder, 
                                                                            totalPrice: grandTotal,
                                                                            orderItems: groupOrders.flatMap(o => o.orderItems)
                                                                        } : firstOrder }
                                                                        orders={isMultiBatch ? groupOrders : undefined}
                                                                        className="btn btn-primary"
                                                                    />
                                                                    <button
                                                                        className="btn btn-success"
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
                                                                                Selesaikan Pesanan
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {!allReady && isMultiBatch && (
                                                                <p className="text-xs text-warning">
                                                                    ⏳ Menunggu semua batch siap untuk pembayaran
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
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
                                {completedSessionOrders.length > 0 && (
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-base-content/70">Batch:</span>
                                        <span className="font-semibold">{completedSessionOrders.length} batch pesanan</span>
                                    </div>
                                )}
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-base-content/70">Total Item:</span>
                                    <span className="font-semibold">
                                        {completedSessionOrders.length > 0 
                                            ? completedSessionOrders.reduce((sum, o) => sum + o.orderItems.length, 0)
                                            : completedOrder.orderItems.length
                                        } item
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-base-content/70">Total Bayar:</span>
                                    <span className="font-bold text-lg text-primary">
                                        Rp {completedOrder.totalPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="divider">Cetak Struk?</div>

                            <div className="flex gap-2 items-center">
                                <ReceiptPrint 
                                    order={{ ...completedOrder, isPaid: true }}
                                    orders={completedSessionOrders.length > 0 ? completedSessionOrders.map(o => ({ ...o, isPaid: true })) : undefined}
                                    className="btn btn-primary"
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
