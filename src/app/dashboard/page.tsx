import { getDashboardStats } from "./actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardView from "./DashboardView"
import Sidebar from "@/components/Sidebar"

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
        <div className="flex">
            <Sidebar role={session.user.role} userName={session.user.name} />
            <div className="flex-1">
                <DashboardView 
                    stats={stats}
                    userName={session.user.name}
                />
            </div>
        </div>
    )
}