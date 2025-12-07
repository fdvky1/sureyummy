import { getOrderHistory } from "./actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import HistoryView from "./HistoryView"
import { OrderStatus } from "@/generated/prisma/client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string, status?: string }> }) {
    const session = await getAuthSession()
    
    if (!session) {
        redirect('/signin')
    }

    // Allow ADMIN and CASHIER to access history
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER') {
        redirect('/live')
    }

    const { page, status } = await searchParams
    const currentPage = page ? parseInt(page) : 1
    const filterStatus = (status as OrderStatus | 'ALL') || 'ALL'

    const historyResult = await getOrderHistory({ 
        page: currentPage, 
        limit: 20,
        status: filterStatus
    })
    
    const orders = historyResult.success && historyResult.data ? historyResult.data.orders : []
    const pagination = historyResult.success && historyResult.data ? historyResult.data.pagination : null

    return <HistoryView orders={orders} pagination={pagination} initialStatus={filterStatus} />
}
