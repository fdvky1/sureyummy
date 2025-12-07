'use client'

import { deleteTable, updateTableStatus } from "./actions"
import { TableStatus } from "@/generated/prisma/browser"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useMemo, useCallback } from "react"
import useToastStore from "@/stores/toast"
import useModalStore from "@/stores/modal"
import { getTableStatusLabel } from "@/lib/enumHelpers"
import Link from "next/link"
import { RiFileCopy2Line } from "@remixicon/react"
import SearchBar from "@/components/SearchBar"
import { debounce } from "lodash"
import { printQR } from "@/utils/printQR"

type Table = {
    id: string
    name: string
    slug: string
    status: TableStatus
    orders: any[]
}

export default function TableList({ tables, initialSearch = '' }: { tables: Table[], initialSearch?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const { setMessage } = useToastStore()
    const { setModal, resetModal } = useModalStore()
    
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

    // Filter tables based on search
    const filteredTables = useMemo(() => {
        if (!searchInput) return tables
        
        const searchLower = searchInput.toLowerCase()
        return tables.filter(table => 
            table.name.toLowerCase().includes(searchLower) ||
            table.slug.toLowerCase().includes(searchLower)
        )
    }, [tables, searchInput])

    function handleDelete(id: string, tableName: string) {
        setModal({
            title: 'Konfirmasi Hapus Meja',
            content: `Apakah Anda yakin ingin menghapus "${tableName}"? Tindakan ini tidak dapat dibatalkan.`,
            cancelButton: {
                text: 'Batal',
                active: true,
                onClick: () => resetModal()
            },
            confirmButton: {
                text: 'Hapus',
                active: true,
                className: 'btn-error',
                onClick: async () => {
                    resetModal()
                    setDeletingId(id)
                    const result = await deleteTable(id)
                    
                    if (result.success) {
                        router.refresh()
                        setMessage('Meja berhasil dihapus', 'success')
                    } else {
                        setMessage(result.error || 'Gagal menghapus meja', 'error')
                    }
                    setDeletingId(null)
                }
            }
        })
    }

    async function handleStatusChange(id: string, status: TableStatus) {
        await updateTableStatus(id, status)
        router.refresh()
    }

    async function handleCopyOrderLink(table: Table) {
        const url = `${window.location.origin}/order/${table.slug}`
        
        try {
            await navigator.clipboard.writeText(url)
            setMessage('Link berhasil disalin ke clipboard', 'success')
        } catch (error) {
            setMessage('Gagal menyalin link', 'error')
        }
    }

    async function handlePrintQR(table: Table) {
        const url = `${window.location.origin}/order/${table.slug}`
        
        const result = await printQR({
            url,
            title: table.name,
            subtitle: 'SureYummy',
            instruction: 'Scan QR Code untuk memesan'
        })

        if (!result.success) {
            setMessage(result.error || 'Gagal mencetak QR Code', result.error?.includes('popup') ? 'warning' : 'error')
        }
    }

    function getStatusBadge(status: TableStatus) {
        const badges: Record<TableStatus, string> = {
            AVAILABLE: 'badge-success',
            OCCUPIED: 'badge-error',
            OUT_OF_SERVICE: 'badge-neutral'
        }

        return (
            <span className={`badge ${badges[status]}`}>
                {getTableStatusLabel(status)}
            </span>
        )
    }

    return (
        <>
            {/* Search Bar */}
            <div className="mb-6">
                <SearchBar
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="Cari meja..."
                />
            </div>

            {/* Results count */}
            {searchInput && (
                <div className="mb-4">
                    <p className="text-sm text-base-content/70">
                        Ditemukan {filteredTables.length} meja
                    </p>
                </div>
            )}

            {/* Tables Grid */}
            {filteredTables.length === 0 ? (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-semibold">Meja tidak ditemukan</p>
                        <p className="text-sm text-base-content/70">Coba kata kunci lain untuk mencari meja</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTables.map((table) => (
                <div key={table.id} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="card-title text-2xl">{table.name}</h2>
                            </div>
                            {getStatusBadge(table.status)}
                        </div>

                        {/* {table.orders.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-semibold">
                                    {table.orders.length} pesanan aktif
                                </p>
                            </div>
                        )} */}

                        <div className="divider my-2"></div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-xs">Ubah Status:</span>
                            </label>
                            <select 
                                className="select select-bordered select-sm w-full"
                                value={table.status}
                                onChange={(e) => handleStatusChange(table.id, e.target.value as TableStatus)}
                            >
                                <option value="AVAILABLE">Tersedia</option>
                                <option value="OCCUPIED">Terisi</option>
                                <option value="OUT_OF_SERVICE">Tidak Aktif</option>
                            </select>
                        </div>

                        <div className="card-actions justify-end mt-4 gap-2">
                            <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleCopyOrderLink(table)}
                            >
                                <RiFileCopy2Line />
                            </button>
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handlePrintQR(table)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                                    <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                                </svg>
                                Print QR
                            </button>
                            <Link 
                                className="btn btn-sm btn-ghost"
                                href={`/table/edit/${table.id}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                            </Link>
                            <button 
                                className="btn btn-sm btn-error btn-outline"
                                onClick={() => handleDelete(table.id, table.name)}
                                disabled={deletingId === table.id}
                            >
                                {deletingId === table.id ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
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
