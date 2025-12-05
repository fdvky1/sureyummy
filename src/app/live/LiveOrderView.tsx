'use client'

import { useEffect, useState } from "react"
import { getActiveOrders } from "./actions"
import { updateOrderStatus } from "./actions"
import { useRouter } from "next/navigation"
import { OrderStatus } from "@/generated/prisma/browser"
import useToastStore from "@/stores/toast"

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
    table: {
        id: string
        name: string
        slug: string
    }
    orderItems: OrderItem[]
}

export default function LiveOrderView({ initialOrders }: { initialOrders: Order[] }) {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const { setMessage } = useToastStore()

    useEffect(() => {
        // Check for new orders
        const lastOrderId = localStorage.getItem('lastOrderId')
        if (orders.length > 0 && orders[0].id !== lastOrderId) {
            // New order detected
            // TODO: Play notification sound here
            // const audio = new Audio('/notification.mp3')
            // audio.play()
            
            localStorage.setItem('lastOrderId', orders[0].id)
        }

        // Poll for new orders every 5 seconds
        const interval = setInterval(async () => {
            const result = await getActiveOrders()
            if (result.success && result.data) {
                const newOrders = result.data
                
                // Check if there's a new order
                if (newOrders.length > orders.length) {
                    const latestOrder = newOrders[0]
                    const existingIds = orders.map(o => o.id)
                    
                    if (!existingIds.includes(latestOrder.id)) {
                        // New order detected
                        // TODO: Play notification sound here
                        // const audio = new Audio('/notification.mp3')
                        // audio.play()
                        
                        localStorage.setItem('lastOrderId', latestOrder.id)
                    }
                }
                
                setOrders(newOrders)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [orders])

    async function handleStatusChange(orderId: string, status: OrderStatus) {
        setUpdatingId(orderId)
        const result = await updateOrderStatus(orderId, status)
        
        if (result.success) {
            router.refresh()
            setMessage('Status pesanan berhasil diubah', 'success')
            // Refresh orders
            const ordersResult = await getActiveOrders()
            if (ordersResult.success && ordersResult.data) {
                setOrders(ordersResult.data)
            }
        } else {
            setMessage('Gagal mengubah status pesanan', 'error')
        }
        setUpdatingId(null)
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
            <span className={`badge ${badges[status]} badge-lg`}>
                {labels[status]}
            </span>
        )
    }

    function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
        const flow: Record<OrderStatus, OrderStatus | null> = {
            PENDING: OrderStatus.CONFIRMED,
            CONFIRMED: OrderStatus.PREPARING,
            PREPARING: OrderStatus.READY,
            READY: null,
            COMPLETED: null,
            CANCELLED: null
        }
        return flow[currentStatus]
    }

    function getNextStatusLabel(status: OrderStatus | null): string {
        const labels: Record<OrderStatus, string> = {
            [OrderStatus.PENDING]: '',
            [OrderStatus.CONFIRMED]: 'Konfirmasi',
            [OrderStatus.PREPARING]: 'Mulai Masak',
            [OrderStatus.READY]: 'Tandai Siap',
            [OrderStatus.COMPLETED]: '',
            [OrderStatus.CANCELLED]: ''
        }
        return status ? labels[status] || '' : ''
    }

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center sm:justify-between">
                        <div className="hidden sm:block">
                            <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
                            <p className="text-sm opacity-90 mt-1">Monitor pesanan secara real-time</p>
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

                                        {nextStatus && (
                                            <button 
                                                className={`btn ${isPending ? 'btn-warning' : 'btn-primary'} btn-block mt-4`}
                                                onClick={() => handleStatusChange(order.id, nextStatus)}
                                                disabled={updatingId === order.id}
                                            >
                                                {updatingId === order.id ? (
                                                    <>
                                                        <span className="loading loading-spinner"></span>
                                                        Memproses...
                                                    </>
                                                ) : getNextStatusLabel(nextStatus)}
                                            </button>
                                        )}
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
