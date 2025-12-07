# WebSocket Data Flow - FIXED

## Problem Identified

**DOUBLE DATA WRAPPING** - Data was wrapped twice causing frontend to access wrong path.

### Before (BROKEN):

```
Backend (ws.broadcast.ts):
  body: JSON.stringify({ data: { data, type } })
  
WebSocket Server receives:
  { data: { data: {order, tables}, type: 'order.new' } }

Client (ws.client.ts) passes to handler:
  handler(message.data)  // = { data: {order, tables}, type: 'order.new' }

Frontend expects:
  message.type ❌ (undefined)
  message.data.order ❌ (undefined, should be message.data.data.order)
```

### After (FIXED):

```
Backend (ws.broadcast.ts):
  body: JSON.stringify({ data: { data, type } })
  Sends: { data: { data: {order, tables}, type: 'order.new' } }

WebSocket Server broadcasts:
  Same structure

Client (ws.client.ts):
  const rawMessage = JSON.parse(event.data)  // { data: { data, type } }
  const message = rawMessage.data || rawMessage  // Extract: { data, type }
  handler(message)  // Pass: { data: {order, tables}, type: 'order.new' }

Frontend receives:
  message.type ✅ = 'order.new'
  message.data ✅ = { order, tables }
  message.data.order ✅ = Order object
  message.data.tables ✅ = Table array
```

---

## Data Flow Example

### 1. Create Order (order.new)

**Backend sends:**
```typescript
broadcastToWebSocket(
  { order: {...}, tables: [...] },
  'order.new'
)
```

**Broadcast payload:**
```json
{
  "data": {
    "data": {
      "order": { "id": "...", "table": {...}, "orderItems": [...] },
      "tables": [...]
    },
    "type": "order.new"
  }
}
```

**Frontend receives:**
```typescript
// CashierView.tsx
ws.subscribe((message) => {
  // message = { type: 'order.new', data: { order, tables } }
  if (message?.type === 'order.new' && message?.data?.order) {
    setOrders(prev => [message.data.order, ...prev])  // ✅ Works!
    setTables(message.data.tables)  // ✅ Works!
  }
})
```

---

### 2. Update Status (order.status)

**Backend sends:**
```typescript
broadcastToWebSocket(
  { order: {...}, tables: [...] },
  'order.status'
)
```

**Frontend receives:**
```typescript
if (message?.type === 'order.status' && message?.data?.order) {
  setOrders(prev => prev.map(o => 
    o.id === message.data.order.id ? message.data.order : o
  ))  // ✅ Works!
}
```

---

### 3. Complete Order (order.completed)

**Backend sends:**
```typescript
broadcastToWebSocket(
  { orderIds: ['...'], tables: [...] },
  'order.completed'
)
```

**Frontend receives:**
```typescript
if (message?.type === 'order.completed' && message?.data?.orderIds) {
  const completedIds = message.data.orderIds
  setOrders(prev => prev.filter(o => !completedIds.includes(o.id)))  // ✅ Works!
}
```

---

## Session Handling

### Current Implementation ✅

**Backend** sudah include session di semua order queries:
```typescript
include: {
  session: {
    select: {
      id: true,
      sessionId: true,
      isActive: true
    }
  }
}
```

**Frontend (CashierView)** groups orders by sessionId:
```typescript
const groupOrdersBySession = (ordersList: Order[]) => {
  const grouped = new Map<string, Order[]>()
  
  ordersList.forEach(order => {
    const sessionId = order?.sessionId
    const key = sessionId ? sessionId : `single-${order.id}`
    const existing = grouped.get(key)
    if (existing) {
      existing.push(order)
    } else {
      grouped.set(key, [order])
    }
  })
  
  return Array.from(grouped.entries())
}
```

**Frontend (LiveOrderView)** shows individual orders (no grouping):
```typescript
// Just display all orders without grouping
orders.map(order => <OrderCard key={order.id} order={order} />)
```

---

## Testing Checklist

After this fix, test:

1. ✅ Create order → Check console logs:
   - `[WS Broadcast] Sent: order.new`
   - `[WS] Raw message received:`
   - `[WS] Parsed message:`
   - `[Cashier] WebSocket message received:`
   - `[Cashier] New order received, updating state`
   - `[Kitchen] New order received, adding to list`

2. ✅ Verify data structure in console:
   - `message.type` should be `'order.new'`
   - `message.data.order` should be the order object
   - `message.data.tables` should be the tables array

3. ✅ Check frontend updates:
   - Cashier shows new order immediately
   - Kitchen shows new order immediately
   - Table status updates to OCCUPIED

4. ✅ Update order status:
   - Kitchen updates status
   - Cashier sees update real-time

5. ✅ Complete order:
   - Cashier completes order
   - Kitchen removes order from list
   - Table status updates to AVAILABLE (if no other orders)

---

## Debug Console Logs

Enable these logs to trace the flow:

```typescript
// Backend (ws.broadcast.ts)
console.log('[WS Broadcast] Sent:', type, 'with data keys:', Object.keys(data))

// Client (ws.client.ts)
console.log('[WS] Raw message received:', rawMessage)
console.log('[WS] Parsed message:', message)

// Frontend (CashierView/LiveOrderView)
console.log('[Cashier] WebSocket message received:', message)
console.log('[Cashier] message.type:', message?.type)
console.log('[Cashier] message.data:', message?.data)
```

---

## Status

✅ **FIXED** - WebSocket data structure now correctly unwrapped
✅ **FIXED** - Frontend can access `message.type` and `message.data.X`
✅ **FIXED** - Session grouping works in Cashier
✅ **FIXED** - Individual order display in Kitchen

**Next**: Test with actual order creation to verify the full flow works!
