/**
 * WebSocket Client untuk real-time updates
 * Dengan fallback ke polling jika koneksi gagal
 */

type MessageHandler = (data: any) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private pollingTimer: NodeJS.Timeout | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000 // 3 seconds
  private pollingInterval = 5000 // 5 seconds
  private wsUrl: string
  private shouldConnect = false

  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_FW_BASEURL || 'https://sureyummy-ws-forward.zeabur.app'
    // Convert HTTP(S) to WS(S)
    this.wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws'
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (typeof window === 'undefined') return // Only run on client
    
    this.shouldConnect = true
    this.stopPolling() // Stop polling when trying to connect

    try {
      console.log('[WS] Attempting to connect to:', this.wsUrl)
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('[WS] Connected successfully')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.stopPolling() // Ensure polling is stopped
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('[WS] Message received:', message)
          
          // Notify all handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message.data)
            } catch (err) {
              console.error('[WS] Error in message handler:', err)
            }
          })
        } catch (err) {
          console.error('[WS] Error parsing message:', err)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WS] Connection error:', error)
        this.isConnected = false
      }

      this.ws.onclose = () => {
        console.log('[WS] Connection closed')
        this.isConnected = false
        this.ws = null

        if (this.shouldConnect) {
          // Start polling as fallback
          this.startPolling()
          
          // Attempt to reconnect
          this.scheduleReconnect()
        }
      }
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err)
      this.isConnected = false
      
      if (this.shouldConnect) {
        this.startPolling()
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * this.reconnectAttempts
      
      console.log(`[WS] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
      
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null
        if (this.shouldConnect && !this.isConnected) {
          this.connect()
        }
      }, delay)
    } else {
      console.log('[WS] Max reconnect attempts reached, relying on polling')
    }
  }

  /**
   * Start polling as fallback
   */
  private startPolling() {
    if (this.pollingTimer || this.isConnected) return

    console.log('[WS] Starting polling fallback every', this.pollingInterval, 'ms')
    
    this.pollingTimer = setInterval(() => {
      if (!this.isConnected) {
        console.log('[WS] Polling for updates...')
        // Notify handlers to fetch data
        this.messageHandlers.forEach(handler => {
          try {
            handler({ type: 'polling' })
          } catch (err) {
            console.error('[WS] Error in polling handler:', err)
          }
        })
      }
    }, this.pollingInterval)
  }

  /**
   * Stop polling
   */
  private stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
      console.log('[WS] Polling stopped')
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    console.log('[WS] Disconnecting...')
    this.shouldConnect = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopPolling()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.isConnected = false
    this.reconnectAttempts = 0
  }

  /**
   * Subscribe to messages
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; reconnectAttempts: number; polling: boolean } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      polling: this.pollingTimer !== null
    }
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null

export function getWebSocketClient(): WebSocketClient {
  if (typeof window === 'undefined') {
    throw new Error('WebSocket client can only be used on client side')
  }
  
  if (!wsClient) {
    wsClient = new WebSocketClient()
  }
  
  return wsClient
}

export type { MessageHandler }
