'use client'

import { deleteMenuItem } from "./actions"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import useToastStore from "@/stores/toast"
import SearchBar from "@/components/SearchBar"
import { debounce } from "lodash"

type MenuItem = {
    id: string
    name: string
    description?: string | null
    price: number
    image?: string | null
}

export default function MenuItemList({ menuItems, initialSearch = '' }: { menuItems: MenuItem[], initialSearch?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
    const { setMessage } = useToastStore()
    
    // Search state
    const [searchInput, setSearchInput] = useState(initialSearch)

    // Debounced URL update
    const updateSearchUrl = useCallback(
        debounce((value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set('search', value)
            } else {
                params.delete('search')
            }
            const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
            router.replace(newUrl, { scroll: false })
        }, 300),
        [pathname, router]
    )

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchInput(value)
        updateSearchUrl(value)
    }

    // Filter menu items based on search
    const filteredMenuItems = useMemo(() => {
        if (!searchInput) return menuItems
        
        const searchLower = searchInput.toLowerCase()
        return menuItems.filter(item => 
            item.name.toLowerCase().includes(searchLower) ||
            (item.description?.toLowerCase().includes(searchLower) ?? false)
        )
    }, [menuItems, searchInput])

    async function handleDelete(id: string) {
        if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) return
        
        setDeletingId(id)
        const result = await deleteMenuItem(id)
        
        if (result.success) {
            router.refresh()
            setMessage('Menu berhasil dihapus', 'success')
        } else {
            setMessage(result.error || 'Gagal menghapus menu', 'error')
        }
        setDeletingId(null)
    }

    function handleImageError(id: string) {
        setImageErrors(prev => new Set(prev).add(id))
    }

    return (
        <>
            {/* Search Bar */}
            <div className="mb-6">
                <SearchBar
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="Cari menu..."
                />
            </div>

            {/* Results count */}
            {searchInput && (
                <div className="mb-4">
                    <p className="text-sm text-base-content/70">
                        Ditemukan {filteredMenuItems.length} menu
                    </p>
                </div>
            )}

            {/* Menu Grid */}
            {filteredMenuItems.length === 0 ? (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-semibold">Menu tidak ditemukan</p>
                        <p className="text-sm text-base-content/70">Coba kata kunci lain untuk mencari menu</p>
                        {searchInput && (
                            <button 
                                className="btn btn-sm btn-primary mt-4"
                                onClick={() => handleSearchChange('')}
                            >
                                Hapus Pencarian
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMenuItems.map((item) => (
                <div key={item.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    {item.image && !imageErrors.has(item.id) ? (
                        <figure className="h-48 bg-base-200 relative overflow-hidden">
                            <Image 
                                src={item.image} 
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                className="object-cover"
                                loading="lazy"
                                onError={() => handleImageError(item.id)}
                            />
                        </figure>
                    ) : item.image && imageErrors.has(item.id) ? (
                        <figure className="h-48 bg-base-200">
                            <div className="flex flex-col items-center justify-center h-full text-base-content/40">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs">Gambar tidak tersedia</span>
                            </div>
                        </figure>
                    ) : null}
                    <div className="card-body">
                        <h2 className="card-title">{item.name}</h2>
                        {item.description && (
                            <p className="text-sm text-base-content/70 line-clamp-2">
                                {item.description}
                            </p>
                        )}
                        <div className="mt-2">
                            <span className="text-2xl font-bold text-primary">
                                Rp {item.price.toLocaleString('id-ID')}
                            </span>
                        </div>
                        
                        <div className="divider my-2"></div>
                        
                        <div className="card-actions justify-end">
                            <button 
                                className="btn btn-sm btn-primary btn-outline"
                                onClick={() => router.push(`/menu/${item.id}`)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                            </button>
                            <button 
                                className="btn btn-sm btn-error btn-outline"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                            >
                                {deletingId === item.id ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
                </div>
            )}
        </>
    )
}
