"use client"

import { useSession } from "next-auth/react"
import { useSidebarStore } from "@/stores/sidebar"
import { RiMenuLine, RiCloseLine, RiRestaurantLine } from '@remixicon/react'
import { usePathname } from "next/navigation"

export default function Header() {
  const { data: session, status } = useSession()
  const { isOpen, toggle } = useSidebarStore()
  const pathname = usePathname()

  // Don't show header on auth pages or kiosk pages
  if (pathname.startsWith('/signin') || (pathname !== '/table/create' && pathname.startsWith('/table/'))) {
    return null
  }

  // Don't show if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className={"sticky top-0 z-30 flex items-center gap-4 bg-base-100 border-b border-base-300 px-4 py-3 shadow-sm " + (isOpen ? 'lg:-ml-64' : '')}>
      <button
        onClick={toggle}
        className="btn btn-ghost btn-sm btn-square"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <RiCloseLine className="w-6 h-6" />
        ) : (
          <RiMenuLine className="w-6 h-6" />
        )}
      </button>
      <div className="flex items-center gap-2">
        <RiRestaurantLine className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-bold text-primary">SureYummy</h1>
      </div>
      {/* {session?.user?.name && (
        <div className="ml-auto text-sm font-medium truncate">
          {session.user.name}
        </div>
      )} */}
    </div>
  )
}
