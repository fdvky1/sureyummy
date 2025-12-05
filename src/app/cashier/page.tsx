import { getActiveOrders } from "./actions"
import { getTables } from "@/app/table/actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import CashierView from "./CashierView"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page(){
    const session = await getAuthSession()
    
    if (!session) {
        redirect('/signin')
    }

    const [ordersResult, tablesResult] = await Promise.all([
        getActiveOrders(),
        getTables()
    ])
    
    const orders = ordersResult.success && ordersResult.data ? ordersResult.data : []
    const tables = tablesResult.success && tablesResult.data ? tablesResult.data : []

    return <CashierView initialOrders={orders} initialTables={tables} />
}