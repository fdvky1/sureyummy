'use client'

import { deleteMenuItem } from "./actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import useToastStore from "@/stores/toast"

type MenuItem = {
    id: string
    name: string
    description?: string | null
    price: number
    image?: string | null
}

export default function MenuItemList({ menuItems }: { menuItems: MenuItem[] }) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const { setMessage } = useToastStore()

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map((item) => (
                <div key={item.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    {item.image && (
                        <figure className="h-48 bg-base-200">
                            <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        </figure>
                    )}
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
    )
}
