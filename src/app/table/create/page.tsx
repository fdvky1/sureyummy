'use client'

import { createTable } from "@/actions/table.actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createTableSchema } from "@/lib/validations"
import { z } from "zod"

export default function Page(){
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        const formData = new FormData(e.currentTarget)
        const number = parseInt(formData.get('number') as string)
        const code = formData.get('code') as string
        
        // Generate slug from table number
        const slug = `meja-${number}`

        try {
            // Validate with Zod
            const validated = createTableSchema.parse({
                number,
                code,
                slug
            })

            const result = await createTable(validated)

            if (result.success) {
                router.push('/table')
            } else {
                setErrors({ general: result.error || 'Gagal membuat meja' })
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
                    <h1 className="text-3xl font-bold">Tambah Meja Baru</h1>
                    <button 
                        onClick={() => router.push('/table')}
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
                                    <span className="label-text font-semibold">Nomor Meja</span>
                                </label>
                                <input 
                                    type="number" 
                                    name="number"
                                    placeholder="Contoh: 1" 
                                    className={`input input-bordered w-full ${errors.number ? 'input-error' : ''}`}
                                    required
                                    min="1"
                                />
                                {errors.number && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.number}</span>
                                    </label>
                                )}
                                {!errors.number && (
                                    <label className="label">
                                        <span className="label-text-alt">Nomor unik untuk identifikasi meja</span>
                                    </label>
                                )}
                            </div>

                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text font-semibold">Kode Meja</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="code"
                                    placeholder="Contoh: A1, B2, VIP1" 
                                    className={`input input-bordered w-full ${errors.code ? 'input-error' : ''}`}
                                    required
                                />
                                {errors.code && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.code}</span>
                                    </label>
                                )}
                                {!errors.code && (
                                    <label className="label">
                                        <span className="label-text-alt">Kode untuk ditampilkan ke customer</span>
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
                                    ) : 'Simpan Meja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}