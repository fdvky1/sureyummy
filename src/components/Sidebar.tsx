"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSidebarStore } from "@/stores/sidebar"
import { useEffect } from "react"
import { 
  RiDashboardLine, 
  RiHistoryLine, 
  RiBarChartBoxLine,
  RiRestaurantLine,
  RiTableLine,
  RiMoneyDollarCircleLine,
  RiKnifeLine,
  RiLogoutBoxRLine,
  RiArrowLeftWideLine
} from '@remixicon/react'

export default function Sidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { isOpen, close } = useSidebarStore()

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      close()
    }
  }, [pathname, close])

  // Don't show sidebar on auth pages or kiosk pages
  if (pathname.startsWith('/signin') || (pathname !== '/table/create' && pathname.startsWith('/table/'))) {
    return null
  }

  // Don't show if not authenticated
  if (status === 'unauthenticated') {
    return null
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

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      close()
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 lg:z-auto
          bg-base-100 w-64 h-screen shadow-xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 lg:sticky' : '-translate-x-full lg:fixed'}
        `}
      >
      {/* Logo & Brand */}
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RiRestaurantLine className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-primary">SureYummy</h1>
          </div>
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
        <ul className="menu menu-sm gap-1 w-full">
          {menu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={'w-full py-2 ' + (isActive ? 'active' : '')}
                  onClick={handleLinkClick}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li className="flex w-full items-center justify-center mt-4">
            <button
            onClick={close}
            className="btn btn-primary btn-circle rounded-full mx-auto"
            aria-label="Close sidebar"
          >
            <RiArrowLeftWideLine className="w-12 h-12" />
          </button>
          </li>
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
    </aside>
    </>
  )
}