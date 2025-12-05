"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  RiDashboardLine, 
  RiHistoryLine, 
  RiBarChartBoxLine,
  RiRestaurantLine,
  RiTableLine,
  RiMoneyDollarCircleLine,
  RiKnifeLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiCloseLine
} from '@remixicon/react'

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Don't show sidebar on auth pages
  if (pathname.startsWith('/signin') || pathname.startsWith('/table/')) {
    return <>{children}</>
  }

  // Don't show sidebar if not authenticated
  if (status === 'unauthenticated') {
    return <>{children}</>
  }

  const role = session?.user?.role as 'ADMIN' | 'CASHIER' | 'KITCHEN_STAFF' | undefined
  const userName = session?.user?.name

  const adminMenu = [
    { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
    { href: '/dashboard/history', icon: RiHistoryLine, label: 'History Pesanan' },
    { href: '/dashboard/reports', icon: RiBarChartBoxLine, label: 'Laporan Bulanan' },
    { href: '/menu', icon: RiRestaurantLine, label: 'Kelola Menu' },
    { href: '/table', icon: RiTableLine, label: 'Kelola Meja' },
    { href: '/cashier', icon: RiMoneyDollarCircleLine, label: 'Kasir' },
    { href: '/live', icon: RiKnifeLine, label: 'Dapur' },
  ]

  const cashierMenu = [
    { href: '/cashier', icon: RiMoneyDollarCircleLine, label: 'Kasir' },
    { href: '/dashboard/history', icon: RiHistoryLine, label: 'History Pesanan' },
    { href: '/dashboard/reports', icon: RiBarChartBoxLine, label: 'Laporan Bulanan' },
    { href: '/table', icon: RiTableLine, label: 'Kelola Meja' },
  ]

  const kitchenMenu = [
    { href: '/live', icon: RiKnifeLine, label: 'Pesanan Aktif' },
  ]

  const menu = role === 'ADMIN' ? adminMenu : role === 'CASHIER' ? cashierMenu : kitchenMenu

  const SidebarContent = () => (
    <>
      {/* Logo & Brand */}
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-2">
          <RiRestaurantLine className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-primary">SureYummy</h1>
        </div>
        <p className="text-sm text-base-content/70 mt-1">Restaurant System</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-base-300 bg-base-200">
        <div className="flex items-center gap-3">
          <div className="avatar avatar-placeholder">
            <div className="bg-primary text-primary-content rounded-full w-10">
              <span className="text-lg">{userName?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{userName || 'User'}</p>
            <p className="text-xs text-base-content/70">
              {role === 'ADMIN' ? 'Administrator' : role === 'CASHIER' ? 'Kasir' : 'Dapur'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="menu menu-sm gap-1">
          {menu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={isActive ? 'active' : ''}
                  onClick={() => {
                    // Close sidebar on mobile when clicking a link
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false)
                    }
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-base-300">
        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="btn btn-outline btn-error btn-block btn-sm"
        >
          <RiLogoutBoxRLine className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </>
  )

  return (
    <div className="drawer lg:drawer-open">
      <input 
        id="sidebar-drawer" 
        type="checkbox" 
        className="drawer-toggle" 
        checked={sidebarOpen}
        onChange={(e) => setSidebarOpen(e.target.checked)}
      />
      
      <div className="drawer-content flex flex-col">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2 bg-base-100 border-b border-base-300 px-4 py-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <RiCloseLine className="w-6 h-6" />
            ) : (
              <RiMenuLine className="w-6 h-6" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <RiRestaurantLine className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-primary">SureYummy</h1>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label 
          htmlFor="sidebar-drawer" 
          className="drawer-overlay"
          onClick={() => setSidebarOpen(false)}
        ></label>
        <aside className="bg-base-100 w-64 min-h-screen shadow-xl flex flex-col">
          <SidebarContent />
        </aside>
      </div>
    </div>
  )
}
