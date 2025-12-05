'use client'

import { format } from "date-fns"
import { id } from "date-fns/locale"
import { RiPrinterLine } from '@remixicon/react'
import { PaymentMethod } from "@/generated/prisma/browser"
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
    status: string
    createdAt: string | Date
    paymentMethod?: string | null
    isPaid?: boolean
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

type ReceiptPrintProps = {
    order: Order
    className?: string
    onAfterPrint?: () => void
}

export default function ReceiptPrint({ order, className = '', onAfterPrint }: ReceiptPrintProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=300,height=600')
        if (!printWindow) {
            alert('Popup diblokir! Izinkan popup untuk mencetak struk.')
            return
        }

        const receiptContent = generateReceiptHTML(order)
        
        printWindow.document.write(receiptContent)
        printWindow.document.close()
        
        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.focus()
            printWindow.print()
            // Close after print or cancel
            setTimeout(() => {
                printWindow.close()
                // Call callback after print dialog closes
                if (onAfterPrint) {
                    onAfterPrint()
                }
            }, 100)
        }
    }

    const generateReceiptHTML = (order: Order) => {
        const createdDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : new Date(order.createdAt)

        return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk - ${order.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 10px;
            margin: 2px 0;
        }
        
        .info {
            margin-bottom: 15px;
            font-size: 11px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        
        .items {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }
        
        .item {
            margin: 8px 0;
        }
        
        .item-name {
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .item-detail {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
        }
        
        .total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-weight: bold;
            font-size: 14px;
        }
        
        .payment-info {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            font-size: 11px;
        }
        
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            border-top: 2px dashed #000;
            padding-top: 10px;
        }
        
        @media print {
            body {
                width: 80mm;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SureYummy</h1>
        <p>Restaurant System</p>
        <p>Jl. Contoh No. 123, Jakarta</p>
        <p>Telp: (021) 12345678</p>
    </div>
    
    <div class="info">
        <div class="info-row">
            <span>No. Order:</span>
            <span><strong>#${order.id.substring(0, 8).toUpperCase()}</strong></span>
        </div>
        <div class="info-row">
            <span>Meja:</span>
            <span><strong>${order.table.name}</strong></span>
        </div>
        <div class="info-row">
            <span>Tanggal:</span>
            <span>${format(createdDate, 'dd MMM yyyy, HH:mm', { locale: id })}</span>
        </div>
        ${order.session ? `
        <div class="info-row">
            <span>Session:</span>
            <span>#${order.session.sessionId.substring(0, 8).toUpperCase()}</span>
        </div>
        ` : ''}
    </div>
    
    <div class="items">
        ${order.orderItems.map(item => `
            <div class="item">
                <div class="item-name">${item.menuItem.name}</div>
                <div class="item-detail">
                    <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                    <span><strong>${formatCurrency(item.quantity * item.price)}</strong></span>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="total">
        <div class="total-row">
            <span>TOTAL</span>
            <span>${formatCurrency(order.totalPrice)}</span>
        </div>
    </div>
    
    <div class="payment-info">
        <div class="info-row">
            <span>Metode Bayar:</span>
            <span><strong>${order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod as PaymentMethod) : 'Tunai'}</strong></span>
        </div>
        <div class="info-row">
            <span>Status:</span>
            <span><strong>${order.isPaid ? 'LUNAS' : 'BELUM BAYAR'}</strong></span>
        </div>
    </div>
    
    <div class="footer">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Selamat menikmati hidangan Anda</p>
        <p style="margin-top: 10px;">- SureYummy Team -</p>
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

    return (
        <button
            onClick={handlePrint}
            className={`btn btn-sm btn-ghost ${className}`}
            title="Print Struk"
        >
            <RiPrinterLine className="w-4 h-4" />
            Print
        </button>
    )
}
