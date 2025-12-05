import { getMonthlyReport } from "../actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import ReportsView from "./ReportsView"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({
    searchParams
}: {
    searchParams: Promise<{ year?: string, month?: string }>
}) {
    const session = await getAuthSession()
    
    if (!session) {
        redirect('/signin')
    }

    // Allow ADMIN and CASHIER to access reports
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER') {
        redirect('/live')
    }

    const params = await searchParams
    const now = new Date()
    const year = params.year ? parseInt(params.year) : now.getFullYear()
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1

    const reportResult = await getMonthlyReport(year, month)
    const report = reportResult.success && reportResult.data ? reportResult.data : null

    return (
        <div className="flex">
            <Sidebar role={session.user.role} userName={session.user.name} />
            <div className="flex-1">
                <ReportsView 
                    report={report}
                    currentYear={year}
                    currentMonth={month}
                />
            </div>
        </div>
    )
}
