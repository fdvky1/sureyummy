'use client'

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
}

type CartProps = {
    items: CartItem[]
    onUpdateQuantity: (id: string, quantity: number) => void
    onRemove: (id: string) => void
    onCheckout: () => void
}

export default function Cart({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    if (items.length === 0) {
        return (
            <div className="card bg-base-100 shadow-xl sticky top-4">
                <div className="card-body items-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold">Keranjang Kosong</h3>
                    <p className="text-sm text-base-content/70">Pilih menu untuk mulai memesan</p>
                </div>
            </div>
        )
    }

    return (
        <div className="card bg-base-100 shadow-xl sticky top-4">
            <div className="card-body">
                <h2 className="card-title">
                    Keranjang
                    <span className="badge badge-primary">{totalItems}</span>
                </h2>

                <div className="divider my-2"></div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-xs text-base-content/70">
                                    Rp {item.price.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-xs btn-circle btn-outline"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="font-bold w-8 text-center">{item.quantity}</span>
                                <button
                                    className="btn btn-xs btn-circle btn-primary"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                    +
                                </button>
                                <button
                                    className="btn btn-xs btn-circle btn-error btn-outline"
                                    onClick={() => onRemove(item.id)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="divider my-2"></div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <button 
                    className="btn btn-primary btn-block mt-4"
                    onClick={onCheckout}
                >
                    Checkout
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    )
}