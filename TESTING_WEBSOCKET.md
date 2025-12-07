# Testing WebSocket Real-Time Updates

## Quick Testing Steps

### 1. Buka 2 Browser Tabs

- **Tab 1**: `/cashier` (Kasir)
- **Tab 2**: `/live` (Kitchen)

### 2. Buka Console di Kedua Tab

Press `F12` atau `Right Click > Inspect > Console`

### 3. Cek WebSocket Connection

Di console harus muncul:
```
[WS] Attempting to connect to: ws://...
[WS] Connected successfully
```

Kalau tidak connect, akan muncul:
```
[WS] Connection error - components will use polling fallback
```

### 4. Test Create Order

**Cara 1: Dari Table Page**
1. Buka `/table/{slug}` (e.g., `/table/meja-1`)
2. Order makanan
3. Submit order

**Cara 2: Dari Cashier (jika ada form)**
1. Create order manually

### 5. Monitor Console Logs

#### Expected Logs (Backend):
```
[WS Broadcast] Sent: order.new with data keys: [ 'order', 'tables' ]
```

#### Expected Logs (WebSocket Client):
```
[WS] Raw message received: { data: { data: {...}, type: 'order.new' } }
[WS] Parsed message: { data: {...}, type: 'order.new' }
```

#### Expected Logs (Cashier):
```
[Cashier] WebSocket message received: { type: 'order.new', data: {...} }
[Cashier] message.type: order.new
[Cashier] message.data: { order: {...}, tables: [...] }
[Cashier] New order received: { id: '...', table: {...}, orderItems: [...] }
[Cashier] Tables update: 5 tables
```

#### Expected Logs (Kitchen):
```
[Kitchen] WebSocket message received: { type: 'order.new', data: {...} }
[Kitchen] message.type: order.new
[Kitchen] message.data: { order: {...}, tables: [...] }
[Kitchen] New order received: { id: '...', table: {...}, orderItems: [...] }
🔔 Pesanan baru masuk!
```

---

## Troubleshooting

### Problem: WebSocket tidak connect

**Cek:**
```javascript
// Console:
console.log('WS URL:', process.env.NEXT_PUBLIC_FW_BASEURL)
```

**Solusi:**
- Pastikan `NEXT_PUBLIC_FW_BASEURL` di `.env.local` benar
- Pastikan WebSocket server running
- Cek firewall/network blocking WebSocket

**Fallback:**
Jika WebSocket gagal, sistem akan otomatis polling setiap 5 detik:
```
[Cashier] Polling fallback - fetching data
[Kitchen] Polling fallback - fetching data
```

---

### Problem: Message received tapi `message.type` undefined

**Cek di console:**
```javascript
console.log('[Cashier] WebSocket message received:', message)
console.log('[Cashier] message.type:', message?.type)
console.log('[Cashier] message.data:', message?.data)
```

**Expected Structure:**
```javascript
{
  type: 'order.new',
  data: {
    order: { id: '...', table: {...}, orderItems: [...] },
    tables: [...]
  }
}
```

**Kalau structure berbeda**, cek:
1. `ws.broadcast.ts` - Pastikan send `{ data: { data, type } }`
2. `ws.client.ts` - Pastikan extract `rawMessage.data`

---

### Problem: Message received tapi UI tidak update

**Cek:**
1. Apakah `message.data.order` ada?
   ```javascript
   console.log('Has order?', !!message?.data?.order)
   ```

2. Apakah condition check passed?
   ```javascript
   console.log('Type match?', message?.type === 'order.new')
   console.log('Has data?', !!message?.data?.order)
   ```

3. Apakah state update dipanggil?
   - Tambahkan log di dalam condition:
   ```javascript
   if (message?.type === 'order.new' && message?.data?.order) {
     console.log('✅ Condition passed, updating state')
     setOrders(...)
   }
   ```

---

### Problem: Session tidak di-group di Cashier

**Cek:**
1. Apakah order punya `sessionId`?
   ```javascript
   console.log('Order sessionId:', message.data.order.sessionId)
   ```

2. Apakah `groupOrdersBySession` dipanggil?
   ```javascript
   const orderGroups = groupOrdersBySession(displayOrders)
   console.log('Order groups:', orderGroups.length)
   ```

3. Cek output grouping:
   ```javascript
   orderGroups.forEach(([key, orders]) => {
     console.log('Group:', key, 'Orders:', orders.length)
   })
   ```

---

### Problem: Kitchen menampilkan semua batch sebagai satu

**Expected Behavior:**
- Kitchen harus menampilkan **individual orders**, bukan grouped
- Setiap order = 1 card
- Tidak peduli apakah order punya sessionId atau tidak

**Cek:**
```javascript
console.log('[Kitchen] Displaying orders:', orders.length)
orders.forEach(o => console.log('Order:', o.id, 'Session:', o.sessionId))
```

---

## Success Indicators

### ✅ WebSocket Connected
```
[WS] Connected successfully
```

### ✅ Order Created
```
[WS Broadcast] Sent: order.new
[Cashier] New order received: {...}
[Kitchen] New order received: {...}
```

### ✅ UI Updated
- Cashier: Order muncul di list (grouped by session jika ada)
- Kitchen: Order muncul di grid (individual cards)
- Table status: AVAILABLE → OCCUPIED

### ✅ Real-time Updates
- Update status di Kitchen → Cashier update real-time
- Complete order di Cashier → Kitchen remove real-time
- Table status sync otomatis

---

## Debug Commands

### Check WebSocket Status
```javascript
// Di browser console:
const ws = window.__WS_CLIENT__ // Jika di-expose
console.log(ws.getStatus())
```

### Manual Trigger (for testing)
```javascript
// Simulate message
const mockMessage = {
  type: 'order.new',
  data: {
    order: { id: 'test-123', table: { name: 'Meja 1' }, orderItems: [] },
    tables: []
  }
}
// Paste ke console dan lihat apakah UI update
```

### Force Refresh State
```javascript
// Di Cashier atau Kitchen console:
window.location.reload() // Hard refresh
```

---

## Expected Timeline

**Order Creation Flow:**

1. **T+0ms**: User submit order dari table page
2. **T+100ms**: Backend create order di DB
3. **T+200ms**: Backend broadcast WebSocket
4. **T+250ms**: WebSocket client receive message
5. **T+300ms**: Frontend handler process message
6. **T+350ms**: React state update
7. **T+400ms**: UI re-render
8. **T+500ms**: User sees order muncul

**Total: ~500ms dari submit sampai tampil** 🚀

Kalau lebih dari 1 detik, cek:
- Network latency
- WebSocket connection quality
- Database query performance
- React render performance

---

## Next Steps

Setelah testing:

1. ✅ Jika semua work → Remove console.logs untuk production
2. ⚠️ Jika ada issue → Share console logs untuk debugging
3. 📊 Jika performance issue → Profile React components
4. 🔊 Tambahkan sound notification untuk order baru di Kitchen

---

**Happy Testing!** 🎉
