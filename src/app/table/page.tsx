import { getTables } from "@/actions/table.actions"
import Link from "next/link"
import TableList from "./TableList"

export default async function Page(){
    const result = await getTables()
    const tables = result.success && result.data ? result.data : []

    return (
        <div className="min-h-screen bg-base-200 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Kelola Meja</h1>
                        <p className="text-base-content/70 mt-2">Atur dan kelola meja restoran</p>
                    </div>
                    <Link href="/table/create" className="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Tambah Meja
                    </Link>
                </div>

                {tables.length === 0 ? (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body items-center text-center py-16">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-xl font-semibold mb-2">Belum Ada Meja</h3>
                            <p className="text-base-content/70 mb-4">Mulai dengan menambahkan meja pertama Anda</p>
                            <Link href="/table/create" className="btn btn-primary">
                                Tambah Meja Pertama
                            </Link>
                        </div>
                    </div>
                ) : (
                    <TableList tables={tables} />
                )}
            </div>
        </div>
    )
}