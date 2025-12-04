import { getTableBySlug } from "./actions"
import { getMenuItems } from "@/app/menu/actions"
import { redirect } from "next/navigation"
import KioskView from "./KioskView"

export default async function Menu({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [tableResult, menuResult] = await Promise.all([
        getTableBySlug(slug),
        getMenuItems()
    ])

    if (!tableResult.success || !tableResult.data) {
        redirect('/table')
    }

    const table = tableResult.data
    const menuItems = menuResult.success && menuResult.data ? menuResult.data : []

    // Check if table has active order
    const activeOrder = table.orders.find(order => 
        order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
    )

    return (
        <KioskView 
            table={table} 
            menuItems={menuItems}
            activeOrder={activeOrder || null}
        />
    )
}