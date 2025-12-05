"use client"

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
  RiLogoutBoxRLine
} from '@remixicon/react'

type SidebarProps = {
  role: 'ADMIN' | 'CASHIER' | 'KITCHEN_STAFF'
  userName?: string | null
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()

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

  return (
    <aside className="bg-base-100 w-64 min-h-screen shadow-xl flex flex-col">
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
          <div className="avatar placeholder">
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
      <nav className="flex-1 p-4">
        <ul className="menu menu-sm gap-1">
          {menu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={isActive ? 'active' : ''}
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
    </aside>
  )
}