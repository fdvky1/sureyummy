import { getActiveOrders } from "./actions"
import { getTables } from "@/app/table/actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import CashierView from "./CashierView"
import Sidebar from "@/components/Sidebar"

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

    return (
        <div className="flex">
            <Sidebar role={session.user.role} userName={session.user.name} />
            <div className="flex-1">
                <CashierView initialOrders={orders} initialTables={tables} />
            </div>
        </div>
    )
}