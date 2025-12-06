'use client'

import { useState } from "react"
import { createOrder, getAIUpsellRecommendations } from "./actions"
import { useRouter } from "next/navigation"
import MenuCard from "@/components/MenuCard"
import Cart from "@/components/Cart"
import UpsellModal from "@/components/UpsellModal"
import { PaymentMethod } from "@/generated/prisma/browser"
import { createOrderSchema } from "@/lib/validations"
import { z } from "zod"
import useToastStore from "@/stores/toast"

type MenuItem = {
    id: string
    name: string
    description?: string | null
    price: number
    image?: string | null
}

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
}

type Table = {
    id: string
    name: string
    slug: string
    status: string
}

type KioskViewProps = {
    table: Table
    menuItems: MenuItem[]
    activeOrder: any | null
    isOccupied: boolean
    hasValidSession: boolean
}

export default function KioskView({ table, menuItems, activeOrder, isOccupied, hasValidSession }: KioskViewProps) {
    const router = useRouter()
    const [cart, setCart] = useState<CartItem[]>([])
    const [showCart, setShowCart] = useState(false)
    const [showCheckout, setShowCheckout] = useState(false)
    const [showUpsell, setShowUpsell] = useState(false)
    const [upsellLoading, setUpsellLoading] = useState(false)
    const [recommendations, setRecommendations] = useState<Array<{
        menuItem: MenuItem
        reason: string
        confidence: number
    }>>([])
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)
    const [loading, setLoading] = useState(false)
    const { setMessage } = useToastStore()

    function handleAddToCart(item: MenuItem) {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id)
            if (existing) {
                return prev.map(i => 
                    i.id === item.id 
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            }
            return [...prev, { 
                id: item.id, 
                name: item.name, 
                price: item.price, 
                quantity: 1 
            }]
        })
    }

    function handleUpdateQuantity(id: string, quantity: number) {
        if (quantity < 1) return
        setCart(prev => prev.map(item => 
            item.id === id ? { ...item, quantity } : item
        ))
    }

    function handleRemove(id: string) {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    async function handleCheckout() {
        if (cart.length === 0) return
        setShowCart(false)
        
        // Get AI recommendations
        setShowUpsell(true)
        setUpsellLoading(true)
        
        try {
            const result = await getAIUpsellRecommendations(cart, menuItems)
            
            if (result.success && result.recommendations.length > 0) {
                setRecommendations(result.recommendations)
                setUpsellLoading(false)
            } else {
                // No recommendations, go directly to checkout
                setShowUpsell(false)
                setShowCheckout(true)
            }
        } catch (error) {
            console.error('Error getting recommendations:', error)
            // On error, proceed to checkout
            setShowUpsell(false)
            setShowCheckout(true)
        }
    }

    function handleAddFromUpsell(item: MenuItem) {
        handleAddToCart(item)
        setMessage(`${item.name} ditambahkan ke keranjang`, 'success')
    }

    function handleSkipUpsell() {
        setShowUpsell(false)
        setShowCheckout(true)
    }

    function handleProceedFromUpsell() {
        setShowUpsell(false)
        setShowCheckout(true)
    }

    async function handleConfirmOrder() {
        if (cart.length === 0) return
        
        setLoading(true)
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        try {
            // Validate with Zod
            const validated = createOrderSchema.parse({
                tableId: table.id,
                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalPrice: total,
                paymentMethod
            })

            const result = await createOrder(validated)

            if (result.success) {
                setCart([])
                setShowCart(false)
                setShowCheckout(false)
                router.refresh()
                
                // Show success message
                setMessage('Pesanan berhasil dibuat! Silakan tunggu pesanan Anda.', 'success')
            } else {
                setMessage(result.error || 'Gagal membuat pesanan. Silakan coba lagi.', 'error')
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                setMessage(error.issues[0].message, 'error')
            } else {
                setMessage('Terjadi kesalahan. Silakan coba lagi.', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Restoran Nasi Padang</h1>
                            <p className="text-sm opacity-90 mt-1">Silakan pilih menu Anda</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-90">Meja</p>
                            <p className="text-2xl font-bold">{table.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Occupied Alert */}
            {isOccupied && !hasValidSession && (
                <div className="max-w-7xl mx-auto px-6 mt-6">
                    <div className="alert alert-warning shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="font-bold">Meja Sedang Digunakan</h3>
                            <div className="text-sm">Meja ini sedang digunakan oleh customer lain. Silakan tunggu sampai mereka selesai atau pilih meja lain.</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Order Alert */}
            {activeOrder && hasValidSession && (
                <div className="max-w-7xl mx-auto px-6 mt-6">
                    <div className="alert alert-info">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Anda memiliki pesanan aktif. Pesanan baru akan ditambahkan ke bill yang sama.</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 pb-32 lg:pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Menu Grid */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Menu</h2>
                        {isOccupied && !hasValidSession ? (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body items-center text-center py-16">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-warning mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p className="text-lg font-semibold">Meja Sedang Digunakan</p>
                                    <p className="text-sm text-base-content/70">Menu tidak dapat diakses saat meja sedang digunakan</p>
                                </div>
                            </div>
                        ) : menuItems.length === 0 ? (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body items-center text-center py-16">
                                    <p className="text-lg">Belum ada menu tersedia</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {menuItems.map(item => (
                                    <MenuCard 
                                        key={item.id} 
                                        item={item} 
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart - Desktop Only */}
                    {!isOccupied || hasValidSession ? (
                        <div className="hidden lg:block lg:col-span-1">
                            <Cart 
                                items={cart}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemove}
                                onCheckout={handleCheckout}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Floating Cart Button - Mobile Only */}
            {cart.length > 0 && (!isOccupied || hasValidSession) && (
                <div className="fixed bottom-6 left-0 right-0 px-6 lg:hidden z-50">
                    <button 
                        className="btn btn-primary w-full shadow-2xl"
                        onClick={() => setShowCart(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="flex-1 text-left">
                            Lihat Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)} item)
                        </span>
                        <span className="font-bold">
                            Rp {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}
                        </span>
                    </button>
                </div>
            )}

            {/* Cart Drawer - Mobile Only (Bottom Sheet) */}
            {showCart && (
                <div className="lg:hidden">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                        onClick={() => setShowCart(false)}
                    ></div>
                    
                    {/* Bottom Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl shadow-2xl z-50 animate-slide-up" style={{ height: '50vh', maxHeight: '600px' }}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-base-300 rounded-full"></div>
                        </div>
                        
                        {/* Header */}
                        <div className="px-6 pb-4 border-b border-base-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xl">Keranjang</h3>
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost"
                                    onClick={() => setShowCart(false)}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="px-6 py-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
                            <Cart 
                                items={cart}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemove}
                                onCheckout={handleCheckout}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Upsell Modal */}
            {showUpsell && (
                <UpsellModal
                    recommendations={recommendations}
                    onAddToCart={handleAddFromUpsell}
                    onSkip={handleSkipUpsell}
                    onProceedToCheckout={handleProceedFromUpsell}
                    loading={upsellLoading}
                />
            )}

            {/* Checkout Modal */}
            {showCheckout && !showUpsell && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-2xl mb-4">Konfirmasi Pesanan</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="bg-base-200 p-4 rounded-lg">
                                <p className="text-sm text-base-content/70 mb-2">Meja:</p>
                                <p className="font-bold text-lg">{table.name}</p>
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <p className="text-sm text-base-content/70 mb-2">Pesanan:</p>
                                <div className="space-y-1">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-primary/10 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">Total:</span>
                                    <span className="font-bold text-xl text-primary">
                                        Rp {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Metode Pembayaran:</span>
                                </label>
                                <div className="space-y-2">
                                    <label className="label cursor-pointer bg-base-200 p-4 rounded-lg">
                                        <span className="label-text">Cash</span> 
                                        <input 
                                            type="radio" 
                                            name="payment" 
                                            className="radio radio-primary" 
                                            checked={paymentMethod === PaymentMethod.CASH}
                                            onChange={() => setPaymentMethod(PaymentMethod.CASH)}
                                        />
                                    </label>
                                    <label className="label cursor-pointer bg-base-200 p-4 rounded-lg opacity-50">
                                        <div>
                                            <span className="label-text">QRIS</span>
                                            <span className="badge badge-sm ml-2">Segera Hadir</span>
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="payment" 
                                            className="radio radio-primary" 
                                            disabled
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost"
                                onClick={() => setShowCheckout(false)}
                                disabled={loading}
                            >
                                Batal
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleConfirmOrder}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Memproses...
                                    </>
                                ) : 'Konfirmasi Pesanan'}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => !loading && setShowCheckout(false)}>
                    </div>
                </div>
            )}
        </div>
    )
}
