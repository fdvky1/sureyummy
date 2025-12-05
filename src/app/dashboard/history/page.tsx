import { getOrderHistory } from "../actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import HistoryView from "./HistoryView"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
    const session = await getAuthSession()
    
    if (!session) {
        redirect('/signin')
    }

    // Allow ADMIN and CASHIER to access history
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER') {
        redirect('/live')
    }

    const historyResult = await getOrderHistory({ limit: 100 })
    const orders = historyResult.success && historyResult.data ? historyResult.data.orders : []

    return <HistoryView orders={orders} />
}
