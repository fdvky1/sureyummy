# Data Structure Consistency Fixes

**Date**: Fixed comprehensive data structure inconsistencies across the codebase

## Issues Identified

### 1. WebSocket Parsing Inconsistency ❌

**Problem**: Different components used different patterns to access WebSocket message data

- **CashierView.tsx**: Used `message.data.order` (CORRECT)
- **LiveOrderView.tsx**: Used `data.data.order` (WRONG)

**Root Cause**: Parameter naming confusion - when parameter is named `data`, accessing `data.data.X` is confusing and error-prone

### 2. Type Definition Mismatch ❌

**Problem**: Type definitions included unused properties that caused confusion

```typescript
// BEFORE (CashierView.tsx)
type Table = {
    id: string
    name: string
    slug: string
    status: TableStatus
    orders: any[]  // ❌ Never used, causes confusion
}
```

**Root Cause**: Leftover from when table status was calculated from `table.orders` instead of orders state

### 3. Backend Include Inconsistency ❌

**Problem**: Different server actions returned different data structures

- **cashier/actions.ts**: `createOrder` included full menuItem details
- **live/actions.ts**: `createOrder` included entire menuItem object (not just select fields)
- **live/actions.ts**: `completeOrder` only included table, missing orderItems and session

**Root Cause**: Files evolved separately without standardization

## Fixes Applied

### Fix 1: Standardized WebSocket Parsing Pattern ✅

**File**: `src/app/live/LiveOrderView.tsx`

**Change**: Updated subscriber to use consistent `message.data.X` pattern

```typescript
// BEFORE ❌
const unsubscribe = wsClient.subscribe((data) => {
    if (data?.type === 'order.new' && data?.data) {
        setOrders(prevOrders => [data.data.order, ...prevOrders])
    }
})

// AFTER ✅
const unsubscribe = wsClient.subscribe((message) => {
    if (message?.type === 'order.new' && message?.data) {
        setOrders(prevOrders => [message.data.order, ...prevOrders])
    }
})
```

**Impact**: Consistent parsing pattern across all components prevents confusion and bugs

---

### Fix 2: Cleaned Up Type Definitions ✅

**File**: `src/app/cashier/CashierView.tsx`

**Change**: Removed unused `orders` property from Table type

```typescript
// BEFORE ❌
type Table = {
    id: string
    name: string
    slug: string
    status: TableStatus
    orders: any[]  // Never used, misleading
}

// AFTER ✅
type Table = {
    id: string
    name: string
    slug: string
    status: TableStatus
}
```

**Impact**: Prevents confusion about data sources - table status is always calculated from orders state

---

### Fix 3: Standardized Backend Includes ✅

**File**: `src/app/live/actions.ts`

**Changes**:

#### 3a. Fixed `createOrder` menuItem include

```typescript
// BEFORE ❌
include: {
    menuItem: true  // Returns entire object
}

// AFTER ✅
include: {
    menuItem: {
        select: {
            id: true,
            name: true,
            price: true
        }
    }
}
```

#### 3b. Fixed `createOrder` table include

```typescript
// BEFORE ❌
table: true  // Returns entire object

// AFTER ✅
table: {
    select: {
        id: true,
        name: true,
        slug: true
    }
}
```

#### 3c. Fixed `completeOrder` to return full order data

```typescript
// BEFORE ❌
include: {
    table: true  // Only table, missing orderItems and session
}

// AFTER ✅
include: {
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

**Impact**: All server actions now return consistent data structures

---

### Fix 4: Updated Documentation ✅

**File**: `WEBSOCKET_STANDARD.md`

**Changes**:
- Added "Frontend WebSocket Pattern Standard" section
- Documented correct `message.data.X` pattern
- Added examples of WRONG patterns to avoid
- Updated "Common Pitfalls" with all consistency issues
- Added rules for consistent implementation

---

## Verification Checklist

After these fixes, verify the following:

### WebSocket Communication
- [ ] CashierView receives `order.new` and correctly adds to orders state
- [ ] LiveOrderView receives `order.new` and correctly adds to orders state
- [ ] Both components parse messages identically: `message.data.order`
- [ ] Table status updates correctly in both views
- [ ] Order completion removes orders from both views

### Backend Consistency
- [ ] All `createOrder` functions return same structure
- [ ] All `updateOrderStatus` functions return same structure
- [ ] All `completeOrder` functions return same structure
- [ ] All functions include session in order queries
- [ ] All broadcasts send both `order` and `tables`

### Type Safety
- [ ] No unused type properties exist
- [ ] All nullable fields use optional chaining (`order?.sessionId`)
- [ ] Type definitions match actual runtime data

### State Management
- [ ] Table status calculated from orders state only
- [ ] Never rely on stale `table.orders` from initial fetch
- [ ] `getTableOrderCount()` uses orders state filter

---

## Testing Scenarios

Test the following to ensure consistency:

1. **Create new order from table**
   - Verify both Cashier and Kitchen see the order immediately
   - Verify table status changes to OCCUPIED

2. **Update order status in Kitchen**
   - Verify Cashier sees status update in real-time
   - Verify order card updates correctly

3. **Complete single order in Cashier**
   - Verify Kitchen removes order from list
   - Verify table status changes to AVAILABLE if no other orders

4. **Complete multi-batch order in Cashier**
   - Verify all orders in session are removed from both views
   - Verify table status updates correctly
   - Verify receipt shows all batches

5. **WebSocket disconnect/reconnect**
   - Verify polling fallback works in both views
   - Verify reconnection restores real-time updates
   - Verify no duplicate orders appear

---

## Key Principles Established

1. **Single Source of Truth**: Orders state is the source of truth, never `table.orders`
2. **Consistent Parsing**: Always use `message.data.X` pattern
3. **Consistent Includes**: All server actions return same structure
4. **Type Accuracy**: Type definitions match actual runtime data
5. **Documentation**: WEBSOCKET_STANDARD.md is the reference for all implementations

---

## Files Modified

1. `/src/app/cashier/CashierView.tsx` - Removed unused Table.orders property
2. `/src/app/live/LiveOrderView.tsx` - Fixed WebSocket parsing pattern
3. `/src/app/live/actions.ts` - Standardized createOrder and completeOrder includes
4. `/WEBSOCKET_STANDARD.md` - Added frontend pattern documentation
5. `/CONSISTENCY_FIXES.md` - This document

---

## Maintenance Notes

**For Future Developers:**

- Always refer to `WEBSOCKET_STANDARD.md` before implementing WebSocket features
- Use `cashier/actions.ts` as the reference for server action structure
- Use `CashierView.tsx` as the reference for WebSocket subscriber pattern
- Never add type properties that aren't used in the component
- Always calculate derived state (like table order counts) from primary state (orders)
- Test both Cashier and Kitchen views together to ensure consistency

---

**Status**: ✅ All inconsistencies resolved. Codebase is now consistent across frontend and backend.
