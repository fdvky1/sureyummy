# WebSocket & Server Actions Standard

## WebSocket Broadcast Structure

### 1. `order.new` - New Order Created
**Backend sends:**
```typescript
{
  order: Order,      // Full order object with orderItems, table, session
  tables: Table[]    // All tables with their active orders
}
```

**Frontend handles:**
```typescript
setOrders(prev => [message.data.order, ...prev])
setTables(message.data.tables)
```

---

### 2. `order.status` - Order Status Updated
**Backend sends:**
```typescript
{
  order: Order,      // Updated order object
  tables: Table[]    // All tables with their active orders
}
```

**Frontend handles:**
```typescript
setOrders(prev => prev.map(o => 
  o.id === message.data.order.id ? message.data.order : o
))
setTables(message.data.tables)
```

---

### 3. `order.completed` - Order(s) Completed
**Backend sends:**
```typescript
{
  orderIds: string[],  // Array of completed order IDs (single or multiple for sessions)
  tables: Table[]      // All tables with their active orders
}
```

**Frontend handles:**
```typescript
const completedIds = message.data.orderIds
setOrders(prev => prev.filter(o => !completedIds.includes(o.id)))
setTables(message.data.tables)
```

---

## Server Actions Return Structure

### Standard Response Format
```typescript
// Success
{
  success: true,
  data: T  // The actual data
}

// Error
{
  success: false,
  error: string  // Error message
}
```

---

## Order Object Standard Include

All order queries should include:
```typescript
{
  orderItems: {
    include: {
      menuItem: {
        select: { id, name, price }
      }
    }
  },
  table: {
    select: { id, name, slug }
  },
  session: {
    select: { id, sessionId, isActive }
  }
}
```

---

## Tables Query Standard

All tables queries should include:
```typescript
{
  orders: {
    where: {
      status: {
        notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
      }
    }
  }
}
```

---

## File Locations

### Server Actions
- `/app/cashier/actions.ts` - Cashier operations
- `/app/live/actions.ts` - Kitchen operations

### Client Components
- `/app/cashier/CashierView.tsx` - Cashier WebSocket subscriber
- `/app/live/LiveOrderView.tsx` - Kitchen WebSocket subscriber

### Libraries
- `/lib/ws.broadcast.ts` - Server-side broadcast helper
- `/lib/ws.client.ts` - Client-side WebSocket singleton

---

## Frontend WebSocket Pattern Standard

### ✅ CORRECT Usage (Consistent Pattern)

**CRITICAL**: Always use `message.data.X` pattern across ALL components.

```typescript
const ws = getWebSocketClient()

// ✅ CORRECT - Name parameter 'message' and access as message.data.X
const unsubscribe = ws.subscribe((message) => {
    if (message?.type === 'order.new' && message?.data) {
        const order = message.data.order      // ✅ Correct
        const tables = message.data.tables    // ✅ Correct
        setOrders(prev => [order, ...prev])
        setTables(tables)
    }
})
```

### ❌ WRONG Patterns (DO NOT USE)

```typescript
// ❌ WRONG - Inconsistent parameter naming leads to data.data confusion
const unsubscribe = ws.subscribe((data) => {
    const order = data.data.order  // ❌ Wrong! Creates confusion
})

// ❌ WRONG - Direct access to message properties
if (message.order) {  // ❌ Wrong! Should be message.data.order
    // ...
}
```

**Rule**: 
1. Always name subscriber parameter `message`
2. Always access data as `message.data.X`
3. Never use `data.data.X` or `message.X` patterns

---

## Implementation Checklist

When adding new order operations:

- [ ] Include `session` in all order queries
- [ ] Fetch and send `tables` in all broadcasts
- [ ] Use consistent data structure: `{ order?, tables }`
- [ ] Handle `message.data.order` and `message.data.tables` in frontend
- [ ] Return standard format: `{ success, data?, error? }`
- [ ] Broadcast after DB updates complete
- [ ] Update table status when needed (OCCUPIED/AVAILABLE)
- [ ] Revalidate all affected paths

---

## Common Pitfalls to Avoid

❌ **Don't:**
- Send order without tables
- Use different message structures for same event type
- Access `data.data.order` (inconsistent naming)
- Access `message.order` directly (should be `message.data.order`)
- Forget to include session in order queries
- Skip table status updates
- Use different parsing patterns between components (CashierView vs LiveOrderView)
- Define unused type properties (e.g., `Table.orders` when using orders state)

✅ **Do:**
- Always send both order and tables
- Use consistent structure across all events
- Name subscriber parameter `message` and parse as `message.data.X`
- Include session in all order includes
- Update table status synchronously with order operations
- Calculate table status from orders state, never from stale DB `table.orders`
- Use optional chaining for nullable fields (`order?.sessionId`)
- Remove unused type properties to prevent confusion
