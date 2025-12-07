'use client'

import { useState } from 'react'
import Image from 'next/image'

type MenuItem = {
    id: string
    name: string
    description?: string | null
    price: number
    image?: string | null
}

type MenuCardProps = {
    item: MenuItem
    onAddToCart: (item: MenuItem) => void
}

export default function MenuCard({ item, onAddToCart }: MenuCardProps) {
    const [imageError, setImageError] = useState(false)

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            {item.image && !imageError && (
                <figure className="h-48 bg-base-200 relative overflow-hidden">
                    <Image 
                        src={item.image} 
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                </figure>
            )}
            {(!item.image || imageError) && (
                <figure className="h-48 bg-base-200">
                    <div className="flex flex-col items-center justify-center h-full text-base-content/40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Gambar tidak tersedia</span>
                    </div>
                </figure>
            )}
            <div className="card-body">
                <h3 className="card-title text-lg">{item.name}</h3>
                {item.description && (
                    <p className="text-sm text-base-content/70 line-clamp-2">
                        {item.description}
                    </p>
                )}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xl font-bold text-primary">
                        Rp {item.price.toLocaleString('id-ID')}
                    </span>
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onAddToCart(item)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        Tambah
                    </button>
                </div>
            </div>
        </div>
    )
}