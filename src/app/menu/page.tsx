import { getMenuItems } from "./actions"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import MenuItemList from "./MenuItemList"

export default async function Page({ searchParams }: { searchParams: Promise<{ search?: string }> }){
    const session = await getAuthSession()
    
    if (!session) {
        redirect('/signin')
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/cashier')
    }

    const result = await getMenuItems()
    const menuItems = result.success && result.data ? result.data : []
    
    const { search } = await searchParams
    const searchQuery = search || ''

    return (
        <div className="min-h-screen bg-base-200 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Kelola Menu</h1>
                            <p className="text-base-content/70 mt-2">Atur dan kelola menu restoran</p>
                        </div>
                        <Link href="/menu/create" className="btn btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Tambah Menu
                        </Link>
                    </div>

                    {menuItems.length === 0 ? (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body items-center text-center py-16">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <h3 className="text-xl font-semibold mb-2">Belum Ada Menu</h3>
                                <p className="text-base-content/70 mb-4">Mulai dengan menambahkan menu pertama Anda</p>
                                <Link href="/menu/create" className="btn btn-primary">
                                    Tambah Menu Pertama
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <MenuItemList menuItems={menuItems} initialSearch={searchQuery} />
                    )}
                </div>
        </div>
    )
}