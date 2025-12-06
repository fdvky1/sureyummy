/**
 * WebSocket Broadcast Helper
 * Untuk mengirim notifikasi ke semua connected clients via WebSocket server
 */

interface BroadcastData {
  message: string
  type: string
  [key: string]: any
}

interface BroadcastResponse {
  success: boolean
  clients_reached?: number
  total_clients?: number
  error?: string
}

/**
 * Broadcast message ke semua WebSocket clients
 */
export async function broadcastToWebSocket(data: BroadcastData): Promise<BroadcastResponse> {
  try {
    const baseUrl = process.env.FW_BASEURL!
    const apiKey = process.env.FW_API_KEY!
    
    const response = await fetch(`${baseUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      console.error('[WS Broadcast] Failed:', response.status, response.statusText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const result = await response.json()
    console.log('[WS Broadcast] Success:', result)
    
    return {
      success: true,
      clients_reached: result.clients_reached,
      total_clients: result.total_clients,
    }
  } catch (error) {
    console.error('[WS Broadcast] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Broadcast notifikasi order baru
 */
export async function broadcastNewOrder(orderId: string, tableSlug: string) {
  return broadcastToWebSocket({
    type: 'order.new',
    message: `Pesanan baru dari ${tableSlug}`,
    orderId,
    tableSlug,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Broadcast update status order
 */
export async function broadcastOrderStatusUpdate(orderId: string, status: string) {
  return broadcastToWebSocket({
    type: 'order.status',
    message: `Status pesanan diubah ke ${status}`,
    orderId,
    status,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Broadcast order selesai/dibayar
 */
export async function broadcastOrderCompleted(orderId: string, tableSlug: string) {
  return broadcastToWebSocket({
    type: 'order.completed',
    message: `Pesanan ${tableSlug} telah dibayar`,
    orderId,
    tableSlug,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Broadcast generic notification
 */
export async function broadcastNotification(message: string, type: string = 'notification') {
  return broadcastToWebSocket({
    type,
    message,
    timestamp: new Date().toISOString(),
  })
}
