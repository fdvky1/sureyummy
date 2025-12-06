/**
 * Broadcast data ke semua WebSocket clients
 */
export async function broadcastToWebSocket(data: any, type: string) {
  const baseUrl = process.env.NEXT_PUBLIC_FW_BASEURL
  const apiKey = process.env.FW_API_KEY
  
  if (!baseUrl || !apiKey) return
  
  try {
    await fetch(`${baseUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { data, type } }),
    })
  } catch (error) {
    console.error('[WS Broadcast] Error:', error)
  }
}
