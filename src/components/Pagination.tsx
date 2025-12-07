'use client'

import { useRouter, usePathname, useSearchParams } from "next/navigation"

type PaginationProps = {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export default function Pagination({ currentPage, totalPages, hasNextPage, hasPreviousPage }: PaginationProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex justify-center mt-6">
            <div className="join">
                <button 
                    className="join-item btn btn-sm"
                    onClick={() => updatePage(currentPage - 1)}
                    disabled={!hasPreviousPage}
                >
                    «
                </button>
                
                {/* Show first page */}
                {currentPage > 2 && (
                    <>
                        <button 
                            className="join-item btn btn-sm"
                            onClick={() => updatePage(1)}
                        >
                            1
                        </button>
                        {currentPage > 3 && (
                            <button className="join-item btn btn-sm btn-disabled">...</button>
                        )}
                    </>
                )}

                {/* Show previous page */}
                {hasPreviousPage && (
                    <button 
                        className="join-item btn btn-sm"
                        onClick={() => updatePage(currentPage - 1)}
                    >
                        {currentPage - 1}
                    </button>
                )}

                {/* Current page */}
                <button className="join-item btn btn-sm btn-active">
                    {currentPage}
                </button>

                {/* Show next page */}
                {hasNextPage && (
                    <button 
                        className="join-item btn btn-sm"
                        onClick={() => updatePage(currentPage + 1)}
                    >
                        {currentPage + 1}
                    </button>
                )}

                {/* Show last page */}
                {currentPage < totalPages - 1 && (
                    <>
                        {currentPage < totalPages - 2 && (
                            <button className="join-item btn btn-sm btn-disabled">...</button>
                        )}
                        <button 
                            className="join-item btn btn-sm"
                            onClick={() => updatePage(totalPages)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button 
                    className="join-item btn btn-sm"
                    onClick={() => updatePage(currentPage + 1)}
                    disabled={!hasNextPage}
                >
                    »
                </button>
            </div>
        </div>
    )
}
