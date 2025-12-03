'use client'

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
    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
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