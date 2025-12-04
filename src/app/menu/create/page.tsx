'use client'

import { createMenuItem } from "./actions"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import useToastStore from "@/stores/toast"
import Image from "next/image"

export default function Page() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { setMessage } = useToastStore()

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
        if (!validTypes.includes(file.type)) {
            setMessage('Format file tidak valid. Gunakan JPG, PNG, atau WEBP', 'error')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage('Ukuran file maksimal 5MB', 'error')
            return
        }

        setImageFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    function handleRemoveImage() {
        setImageFile(null)
        setPreviewUrl('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        const formData = new FormData(e.currentTarget)
        
        // Add image file if selected
        if (imageFile) {
            formData.set('image', imageFile)
        }

        try {
            const result = await createMenuItem(formData)

            if (result.success) {
                setMessage('Menu berhasil dibuat', 'success')
                router.push('/menu')
            } else {
                setErrors({ general: result.error || 'Gagal membuat menu' })
            }
        } catch (error) {
            setErrors({ general: 'Terjadi kesalahan' })
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
                            {/* Image Upload */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Gambar Menu</span>
                                </label>
                                
                                {previewUrl ? (
                                    <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden bg-base-200">
                                        <Image 
                                            src={previewUrl} 
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 btn btn-error btn-sm btn-circle"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-64 mb-4 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center bg-base-200">
                                        <div className="text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-base-content/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm text-base-content/70">Pilih gambar</p>
                                        </div>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/jpg"
                                    onChange={handleImageSelect}
                                    className="file-input file-input-bordered w-full"
                                />
                                <label className="label">
                                    <span className="label-text-alt">Format: JPG, PNG, WEBP. Maksimal 5MB (opsional)</span>
                                </label>
                            </div>

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