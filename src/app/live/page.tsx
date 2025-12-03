import { getActiveOrders } from "./actions"
import LiveOrderView from "./LiveOrderView"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page(){
    const result = await getActiveOrders()
    const orders = result.success && result.data ? result.data : []

    return <LiveOrderView initialOrders={orders} />
}