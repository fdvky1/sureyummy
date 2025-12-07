'use server'

import prisma from "@/lib/prisma"
import { OrderStatus } from "@/generated/prisma/client"

type GetOrderHistoryParams = {
    page?: number
    limit?: number
    status?: OrderStatus | 'ALL'
}

export async function getOrderHistory(params: GetOrderHistoryParams = {}) {
    try {
        const { page = 1, limit = 20, status = 'ALL' } = params
        const skip = (page - 1) * limit

        // Build where clause
        const where = status !== 'ALL' ? { status } : {}

        // Get total count
        const totalOrders = await prisma.order.count({ where })

        // Get paginated orders
        const orders = await prisma.order.findMany({
            where,
            include: {
                table: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: true
                            }
                        }
                    }
                },
                session: {
                    select: {
                        id: true,
                        sessionId: true,
                        isActive: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        })

        const totalPages = Math.ceil(totalOrders / limit)

        return {
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    totalOrders,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            }
        }
    } catch (error) {
        console.error('Error fetching order history:', error)
        return {
            success: false,
            error: 'Gagal mengambil history pesanan'
        }
    }
}
