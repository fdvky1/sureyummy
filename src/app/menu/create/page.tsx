'use client'

import { createMenuItem } from "@/actions/menu.actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createMenuItemSchema } from "@/lib/validations"
import { z } from "zod"

export default function Page() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const price = parseFloat(formData.get('price') as string)
        const image = formData.get('image') as string

        try {
            // Validate with Zod
            const validated = createMenuItemSchema.parse({
                name,
                description: description || undefined,
                price,
                image: image || undefined
            })

            const result = await createMenuItem(validated)

            if (result.success) {
                router.push('/menu')
            } else {
                setErrors({ general: result.error || 'Gagal membuat menu' })
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {}
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0].toString()] = err.message
                    }
                })
                setErrors(fieldErrors)
            } else {
                setErrors({ general: 'Terjadi kesalahan' })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-base-200 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Tambah Menu Baru</h1>
                    <button 
                        onClick={() => router.push('/menu')}
                        className="btn btn-ghost"
                    >
                        Kembali
                    </button>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Nama Menu</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="name"
                                    placeholder="Contoh: Rendang" 
                                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                                    required
                                />
                                {errors.name && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.name}</span>
                                    </label>
                                )}
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Deskripsi</span>
                                </label>
                                <textarea 
                                    name="description"
                                    placeholder="Deskripsi menu (opsional)" 
                                    className={`textarea textarea-bordered w-full ${errors.description ? 'textarea-error' : ''}`}
                                    rows={3}
                                />
                                {errors.description && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.description}</span>
                                    </label>
                                )}
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Harga (Rp)</span>
                                </label>
                                <input 
                                    type="number" 
                                    name="price"
                                    placeholder="Contoh: 25000" 
                                    className={`input input-bordered w-full ${errors.price ? 'input-error' : ''}`}
                                    required
                                    min="0"
                                    step="1000"
                                />
                                {errors.price && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.price}</span>
                                    </label>
                                )}
                            </div>

                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text font-semibold">URL Gambar</span>
                                </label>
                                <input 
                                    type="url" 
                                    name="image"
                                    placeholder="https://example.com/image.jpg (opsional)" 
                                    className={`input input-bordered w-full ${errors.image ? 'input-error' : ''}`}
                                />
                                {errors.image && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.image}</span>
                                    </label>
                                )}
                                {!errors.image && (
                                    <label className="label">
                                        <span className="label-text-alt">Masukkan URL gambar untuk menu</span>
                                    </label>
                                )}
                            </div>

                            {errors.general && (
                                <div className="alert alert-error mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{errors.general}</span>
                                </div>
                            )}

                            <div className="card-actions justify-end">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            Menyimpan...
                                        </>
                                    ) : 'Simpan Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}