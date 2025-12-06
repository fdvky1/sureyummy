import { OrderStatus, PaymentMethod } from "@/generated/prisma/browser"
import { getPaymentMethodLabel } from "@/lib/enumHelpers"
import { Order, OrderItem } from "@/types/order"

type OrderCardProps = {
    order: Order
    idx?: number
    getStatusBadge: (status: OrderStatus) => React.ReactElement
}

export default function OrderCard({ 
    order, 
    idx, 
    getStatusBadge 
}: OrderCardProps) {
    const isMultiBatch = idx !== undefined
    
    return (
        <div className={isMultiBatch ? "bg-base-100 rounded-lg p-3 border border-base-300" : "border border-base-300 rounded-lg p-4"}>
            <div className="flex items-center justify-between mb-2">
                <div className={isMultiBatch ? "flex items-center gap-2" : ""}>
                    {isMultiBatch && (<span className="font-semibold text-sm">Batch #{idx! + 1}</span>)}
                    {!isMultiBatch && (
                        <h3 className="font-bold text-lg">{order.table.name}</h3>
                    )}
                    <p className="text-xs text-base-content/70">
                        {new Date(order.createdAt).toLocaleString('id-ID')}
                    </p>
                </div>
                {getStatusBadge(order.status)}
            </div>
            
            <div className={isMultiBatch ? "space-y-1" : "space-y-2 mb-3"}>
                {order.orderItems.map((item: OrderItem) => (
                    <div key={item.id} className={`flex justify-between text-sm ${isMultiBatch ? '' : 'bg-base-200 p-2 rounded'}`}>
                        <span className={isMultiBatch ? "text-base-content/80" : ""}>{item.menuItem.name} x{item.quantity}</span>
                        <span className={isMultiBatch ? "font-medium" : "font-semibold"}>
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className={`flex justify-between items-center ${isMultiBatch ? 'mt-2 pt-2 border-t border-base-300' : 'pt-3 border-t border-base-300'}`}>
                <span className="text-sm font-semibold">{isMultiBatch ? 'Subtotal Batch:' : 'Total Pembayaran:'}</span>
                <span className="font-bold text-xl text-primary">
                    Rp {order.totalPrice.toLocaleString('id-ID')}
                </span>
            </div>
            
            {!isMultiBatch && order.paymentMethod && (
                <p className="text-xs text-base-content/70 mt-2 text-right">
                    via {getPaymentMethodLabel(order.paymentMethod as PaymentMethod)}
                </p>
            )}
        </div>
    )
}
