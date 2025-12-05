import { getDashboardStats } from "./actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardView from "./DashboardView"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
    const session = await getAuthSession()
    
    if (!session) {
        redirect('/signin')
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/cashier')
    }

    const statsResult = await getDashboardStats()
    const stats = statsResult.success && statsResult.data ? statsResult.data : null

    return (
        <DashboardView 
            stats={stats}
            userName={session.user.name}
        />
    )
}