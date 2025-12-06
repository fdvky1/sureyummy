'use client'

import { updateTable, getTableById } from "../../actions"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { createTableSchema } from "@/lib/validations"
import { z } from "zod"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const {id: tableId} = use(params);
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [tableName, setTableName] = useState('')

    useEffect(() => {
        async function fetchTable() {
            const result = await getTableById(tableId)
            if (result.success && result.data) {
                setTableName(result.data.name)
            } else {
                setErrors({ general: 'Meja tidak ditemukan' })
            }
            setFetchLoading(false)
        }
        fetchTable()
    }, [tableId])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        
        // Generate slug from table name
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

        try {
            // Validate with Zod
            const validated = createTableSchema.parse({
                name,
                slug
            })

            const result = await updateTable(tableId, validated)

            if (result.success) {
                router.push('/table')
            } else {
                setErrors({ general: result.error || 'Gagal mengubah meja' })
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {}
                error.issues.forEach(err => {
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

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-base-200 p-8 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-base-200 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Edit Meja</h1>
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
                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text font-semibold">Nama Meja</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    placeholder="Contoh: Meja 1, VIP 1, Outdoor A" 
                                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                                    required
                                />
                                {errors.name && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.name}</span>
                                    </label>
                                )}
                                {!errors.name && (
                                    <label className="label">
                                        <span className="label-text-alt">Nama unik untuk identifikasi meja</span>
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
                                    ) : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
