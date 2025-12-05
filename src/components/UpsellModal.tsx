'use client'

import Image from "next/image"

type MenuItem = {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
}

type Recommendation = {
  menuItem: MenuItem
  reason: string
  confidence: number
}

type UpsellModalProps = {
  recommendations: Recommendation[]
  onAddToCart: (item: MenuItem) => void
  onSkip: () => void
  onProceedToCheckout: () => void
  loading?: boolean
}

export default function UpsellModal({
  recommendations,
  onAddToCart,
  onSkip,
  onProceedToCheckout,
  loading = false,
}: UpsellModalProps) {
  if (loading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-lg">Mencari rekomendasi menu untuk Anda...</p>
          </div>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    // No recommendations, proceed directly
    return null
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-2xl mb-2">Anda mungkin menyukai ini</h3>
        <p className="text-sm text-base-content/70 mb-6">
          Sempurnakan pesanan Anda dengan menu pilihan ini
        </p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {recommendations.map((rec, index) => (
            <div
              key={rec.menuItem.id}
              className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="shrink-0">
                    {rec.menuItem.image ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-base-300">
                        <Image
                          src={rec.menuItem.image}
                          alt={rec.menuItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-base-300 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 text-base-content/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{rec.menuItem.name}</h4>
                        {rec.menuItem.description && (
                          <p className="text-sm text-base-content/70 line-clamp-1">
                            {rec.menuItem.description}
                          </p>
                        )}
                      </div>
                      <div className="badge badge-primary badge-sm">
                        {Math.round(rec.confidence * 100)}% cocok
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-primary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm italic text-base-content/80">{rec.reason}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        Rp {rec.menuItem.price.toLocaleString('id-ID')}
                      </span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onAddToCart(rec.menuItem)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-ghost" onClick={onSkip}>
            Lewati
          </button>
          <button className="btn btn-primary" onClick={onProceedToCheckout}>
            Lanjut ke Checkout
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onSkip}></div>
    </div>
  )
}
