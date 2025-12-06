'use client'

import { useEffect, useState } from "react"
import { getActiveOrders } from "./actions"
import { updateOrderStatus } from "./actions"
import { useRouter } from "next/navigation"
import { OrderStatus } from "@/generated/prisma/browser"
import useToastStore from "@/stores/toast"
import { getOrderStatusLabel, getOrderStatusBadgeClass } from "@/lib/enumHelpers"
import { getWebSocketClient } from "@/lib/ws.client"
import { Order } from "@/types/order"

export default function LiveOrderView({ initialOrders }: { initialOrders: Order[] }) {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [wsStatus, setWsStatus] = useState({ connected: false, polling: false })
    const { setMessage } = useToastStore()

    useEffect(() => {
        const wsClient = getWebSocketClient()
        
        // Function to fetch orders
        const fetchOrders = async () => {
            const result = await getActiveOrders()
            if (result.success && result.data) {
                const newOrders = result.data
                
                // Check if there's a new order for notification
                if (newOrders.length > orders.length) {
                    const latestOrder = newOrders[0]
                    const existingIds = orders.map(o => o.id)
                    
                    if (!existingIds.includes(latestOrder.id)) {
                        // New order detected
                        // TODO: Play notification sound here
                        // const audio = new Audio('/notification.mp3')
                        // audio.play()
                        
                        localStorage.setItem('lastOrderId', latestOrder.id)
                        setMessage('🔔 Pesanan baru masuk!', 'info')
                    }
                }
                
                setOrders(newOrders)
            }
        }

        // Initial fetch
        fetchOrders()

        // Subscribe to WebSocket messages
        const unsubscribe = wsClient.subscribe((message) => {
            const { type, data } = message || {}
            if (!type || !data) return
            
            switch (type) {
                case 'order.new':
                    if (data.order) {
                        setOrders(prev => [data.order, ...prev])
                        
                        const lastOrderId = localStorage.getItem('lastOrderId')
                        if (data.order.id !== lastOrderId) {
                            localStorage.setItem('lastOrderId', data.order.id)
                            setMessage('🔔 Pesanan baru masuk!', 'info')
                        }
                    }
                    break
                    
                case 'order.status':
                    if (data.order) {
                        setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o))
                    }
                    break
                    
                case 'order.completed':
                    const { sessionId, orderId } = data
                    setOrders(prev => prev.filter(o => 
                        sessionId ? o.sessionId !== sessionId : o.id !== orderId
                    ))
                    break
            }
        })

        // Connect to WebSocket
        wsClient.connect()

        // Polling fallback when disconnected
        const pollingInterval = setInterval(() => {
            if (!wsClient.getStatus().connected) fetchOrders()
        }, 5000)

        // Update status periodically
        const statusInterval = setInterval(() => {
            const status = wsClient.getStatus()
            setWsStatus({ connected: status.connected, polling: !status.connected })
        }, 1000)

        // Cleanup
        return () => {
            unsubscribe()
            clearInterval(statusInterval)
            clearInterval(pollingInterval)
            wsClient.disconnect()
        }
    }, [setMessage])

    // Check for initial new orders
    useEffect(() => {
        const lastOrderId = localStorage.getItem('lastOrderId')
        if (orders.length > 0 && orders[0].id !== lastOrderId) {
            localStorage.setItem('lastOrderId', orders[0].id)
        }
    }, [orders])

    async function handleStatusChange(orderId: string, status: OrderStatus) {
        setUpdatingId(orderId)
        const result = await updateOrderStatus(orderId, status)
        
        if (result.success) {
            setMessage('Status pesanan berhasil diubah', 'success')
            
            // If order is now READY, remove it from the list immediately
            if (status === OrderStatus.READY) {
                setOrders(prev => prev.filter(o => o.id !== orderId))
            } else {
                // For other status changes, update the order in the list
                setOrders(prev => prev.map(o => 
                    o.id === orderId ? { ...o, status } : o
                ))
            }
        } else {
            setMessage('Gagal mengubah status pesanan', 'error')
        }
        setUpdatingId(null)
    }

    function getStatusBadge(status: OrderStatus) {
        return (
            <span className={`badge ${getOrderStatusBadgeClass(status)} badge-lg`}>
                {getOrderStatusLabel(status)}
            </span>
        )
    }

    function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
        const flow: Record<OrderStatus, OrderStatus | null> = {
            PENDING: OrderStatus.PREPARING, // Skip CONFIRMED, go directly to PREPARING
            CONFIRMED: OrderStatus.PREPARING,
            PREPARING: OrderStatus.READY,
            READY: null,
            COMPLETED: null,
            CANCELLED: null
        }
        return flow[currentStatus]
    }

    function getNextStatusLabel(currentStatus: OrderStatus, nextStatus: OrderStatus | null): string {
        if (currentStatus === OrderStatus.PENDING && nextStatus === OrderStatus.PREPARING) {
            return 'Konfirmasi & Mulai Masak'
        }
        
        if (currentStatus === OrderStatus.PREPARING && nextStatus === OrderStatus.READY) {
            return 'Tandai Siap'
        }
        
        const labels: Record<OrderStatus, string> = {
            [OrderStatus.PENDING]: '',
            [OrderStatus.CONFIRMED]: 'Mulai Masak',
            [OrderStatus.PREPARING]: 'Tandai Siap',
            [OrderStatus.READY]: '',
            [OrderStatus.COMPLETED]: '',
            [OrderStatus.CANCELLED]: ''
        }
        return nextStatus ? labels[nextStatus] || '' : ''
    }

    async function handleCancelOrder(orderId: string) {
        setUpdatingId(orderId)
        const result = await updateOrderStatus(orderId, OrderStatus.CANCELLED)
        
        if (result.success) {
            setMessage('Pesanan berhasil dibatalkan', 'success')
            const ordersResult = await getActiveOrders()
            if (ordersResult.success && ordersResult.data) {
                setOrders(ordersResult.data)
            }
        } else {
            setMessage('Gagal membatalkan pesanan', 'error')
        }
        setUpdatingId(null)
    }

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center sm:justify-between">
                        <div className="hidden sm:block">
                            <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm opacity-90">Monitor pesanan secara real-time</p>
                                <div className="flex items-center gap-2">
                                    {wsStatus.connected ? (
                                        <div className="badge badge-success badge-sm gap-1">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                            WebSocket
                                        </div>
                                    ) : wsStatus.polling ? (
                                        <div className="badge badge-warning badge-sm gap-1">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                            Polling
                                        </div>
                                    ) : (
                                        <div className="badge badge-ghost badge-sm">Connecting...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="stats shadow bg-primary-content text-primary w-full sm:w-auto">
                            <div className="stat">
                                <div className="stat-title text-xs">Pesanan Aktif</div>
                                <div className="stat-value text-2xl">{orders.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders */}
            <div className="max-w-7xl mx-auto p-6">
                {orders.length === 0 ? (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body items-center text-center py-16">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold mb-2">Tidak Ada Pesanan Aktif</h3>
                            <p className="text-base-content/70">Pesanan baru akan muncul di sini</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => {
                            const nextStatus = getNextStatus(order.status)
                            const isPending = order.status === OrderStatus.PENDING
                            
                            return (
                                <div 
                                    key={order.id} 
                                    className={`card bg-base-100 shadow-xl ${isPending ? 'ring-4 ring-warning ring-offset-2' : ''}`}
                                >
                                    <div className="card-body">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="card-title text-2xl">{order.table.name}</h2>
                                                <p className="text-xs text-base-content/70">
                                                    {new Date(order.createdAt).toLocaleTimeString('id-ID')}
                                                </p>
                                            </div>
                                            {getStatusBadge(order.status)}
                                        </div>

                                        <div className="divider my-2"></div>

                                        <div className="space-y-2">
                                            {order.orderItems.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold">{item.menuItem.name}</p>
                                                        <p className="text-xs text-base-content/70">
                                                            Rp {item.price.toLocaleString('id-ID')}
                                                        </p>
                                                    </div>
                                                    <div className="badge badge-lg badge-primary">
                                                        {item.quantity}x
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="divider my-2"></div>

                                        <div className="flex justify-between items-center font-bold">
                                            <span>Total:</span>
                                            <span className="text-lg text-primary">
                                                Rp {order.totalPrice.toLocaleString('id-ID')}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mt-4">
                                            {nextStatus && (
                                                <button 
                                                    className={`btn ${isPending ? 'btn-warning' : 'btn-primary'} btn-block`}
                                                    onClick={() => handleStatusChange(order.id, nextStatus)}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {updatingId === order.id ? (
                                                        <>
                                                            <span className="loading loading-spinner"></span>
                                                            Memproses...
                                                        </>
                                                    ) : (
                                                        <>
                                                            {isPending && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                            {getNextStatusLabel(order.status, nextStatus)}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            
                                            {order.status === OrderStatus.PENDING && (
                                                <button 
                                                    className="btn btn-error btn-outline btn-block"
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {updatingId === order.id ? (
                                                        <>
                                                            <span className="loading loading-spinner"></span>
                                                            Memproses...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                            Batalkan Pesanan
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
