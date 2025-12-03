import { getActiveOrders } from "@/actions/order.actions"
import { getTables } from "@/actions/table.actions"
import CashierView from "./CashierView"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page(){
    const [ordersResult, tablesResult] = await Promise.all([
        getActiveOrders(),
        getTables()
    ])
    
    const orders = ordersResult.success && ordersResult.data ? ordersResult.data : []
    const tables = tablesResult.success && tablesResult.data ? tablesResult.data : []

    return <CashierView initialOrders={orders} initialTables={tables} />
}