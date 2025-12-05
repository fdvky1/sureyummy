"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

type SidebarProps = {
  role: 'ADMIN' | 'CASHIER' | 'KITCHEN_STAFF'
  userName?: string | null
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()

  const adminMenu = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/dashboard/history', icon: '📜', label: 'History Pesanan' },
    { href: '/dashboard/reports', icon: '📈', label: 'Laporan Bulanan' },
    { href: '/menu', icon: '🍽️', label: 'Kelola Menu' },
    { href: '/table', icon: '🪑', label: 'Kelola Meja' },
    { href: '/cashier', icon: '💰', label: 'Kasir' },
    { href: '/live', icon: '👨‍🍳', label: 'Dapur' },
  ]

  const cashierMenu = [
    { href: '/cashier', icon: '💰', label: 'Kasir' },
    { href: '/dashboard/history', icon: '📜', label: 'History Pesanan' },
    { href: '/dashboard/reports', icon: '📈', label: 'Laporan Bulanan' },
    { href: '/table', icon: '🪑', label: 'Kelola Meja' },
  ]

  const kitchenMenu = [
    { href: '/live', icon: '👨‍🍳', label: 'Pesanan Aktif' },
  ]

  const menu = role === 'ADMIN' ? adminMenu : role === 'CASHIER' ? cashierMenu : kitchenMenu

  return (
    <aside className="bg-base-100 w-64 min-h-screen shadow-xl flex flex-col">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-base-300">
        <h1 className="text-2xl font-bold text-primary">🍽️ SureYummy</h1>
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
                  <span className="text-lg">{item.icon}</span>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  )
}