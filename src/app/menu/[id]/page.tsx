'use client'

import { getMenuItemById, updateMenuItem } from "./actions"
import { uploadImage, deleteImage } from "@/lib/minio"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { updateMenuItemSchema } from "@/lib/validations"
import { z } from "zod"
import useToastStore from "@/stores/toast"
import Image from "next/image"

export default function EditMenuPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [imageUrl, setImageUrl] = useState<string>('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { setMessage } = useToastStore()
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0
    })

    useEffect(() => {
        async function fetchMenuItem() {
            const result = await getMenuItemById(params.id)
            if (result.success && result.data) {
                setFormData({
                    name: result.data.name,
                    description: result.data.description || '',
                    price: result.data.price
                })
                if (result.data.image) {
                    setImageUrl(result.data.image)
                    setPreviewUrl(result.data.image)
                }
            } else {
                setMessage('Menu tidak ditemukan', 'error')
                router.push('/menu')
            }
        }
        fetchMenuItem()
    }, [params.id, router, setMessage])

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

    async function handleUploadImage() {
        if (!imageFile) return imageUrl

        setUploading(true)
        try {
            const result = await uploadImage(imageFile)
            
            if (result.success && result.url) {
                setImageUrl(result.url)
                setMessage('Gambar berhasil diupload', 'success')
                return result.url
            } else {
                setMessage(result.error || 'Gagal mengupload gambar', 'error')
                return imageUrl
            }
        } catch (error) {
            setMessage('Gagal mengupload gambar', 'error')
            return imageUrl
        } finally {
            setUploading(false)
        }
    }

    async function handleRemoveImage() {
        if (!confirm('Hapus gambar ini?')) return

        if (imageUrl) {
            await deleteImage(imageUrl)
        }
        
        setImageUrl('')
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

        try {
            // Upload image if new file selected
            let finalImageUrl = imageUrl
            if (imageFile) {
                finalImageUrl = await handleUploadImage()
            }

            // Validate with Zod
            const validated = updateMenuItemSchema.parse({
                name: formData.name,
                description: formData.description || undefined,
                price: formData.price,
                image: finalImageUrl || undefined
            })

            const result = await updateMenuItem(params.id, validated)

            if (result.success) {
                setMessage('Menu berhasil diupdate', 'success')
                router.push('/menu')
            } else {
                setErrors({ general: result.error || 'Gagal mengupdate menu' })
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

    return (
        <div className="min-h-screen bg-base-200 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Edit Menu</h1>
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
                                            <p className="text-sm text-base-content/70">Tidak ada gambar</p>
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
                                    <span className="label-text-alt">Format: JPG, PNG, WEBP. Maksimal 5MB</span>
                                </label>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Nama Menu</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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

                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text font-semibold">Harga (Rp)</span>
                                </label>
                                <input 
                                    type="number" 
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
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
                                    disabled={loading || uploading}
                                >
                                    {loading || uploading ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            {uploading ? 'Mengupload...' : 'Menyimpan...'}
                                        </>
                                    ) : 'Update Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
