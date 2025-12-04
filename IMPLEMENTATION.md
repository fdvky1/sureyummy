# Sistem POS Restoran Nasi Padang

Sistem Point of Sale untuk restoran Nasi Padang yang lengkap dengan fitur manajemen meja, menu, pesanan, kitchen staff, dan kasir.

## Fitur Utama

### 1. **Manajemen Meja** (`/table`)
- List semua meja dengan status (Tersedia, Terisi, Dipesan, Tidak Tersedia)
- Tambah meja baru di `/table/create`
- Generate dan print QR code untuk setiap meja
- Update status meja
- Hapus meja

### 2. **Kiosk Mode** (`/table/[slug]`)
- Customer/tablet di meja dapat scan QR code untuk akses menu
- Pilih menu dan tambahkan ke keranjang
- Checkout dengan pilihan metode pembayaran:
  - **Cash** (aktif)
  - **QRIS** (disabled - fitur mendatang)
- Tampilan pesanan aktif pada meja

### 3. **Kitchen Staff Dashboard** (`/live`)
- Menampilkan semua pesanan aktif secara real-time
- Notifikasi audio untuk pesanan baru (commented - Anda perlu tambahkan file audio)
- LocalStorage untuk tracking `lastOrderId` agar notifikasi tidak duplikat saat reload
- Update status pesanan:
  - Pending → Dikonfirmasi → Sedang Dimasak → Siap
- Auto-refresh setiap 5 detik

### 4. **Kasir Dashboard** (`/cashier`)
- Tampilan status semua meja
- List pesanan per meja atau semua pesanan
- Tombol "Selesaikan Pesanan" untuk menandai pesanan sudah dibayar
- Otomatis update status meja menjadi AVAILABLE setelah semua pesanan diselesaikan
- Auto-refresh setiap 5 detik

### 5. **Manajemen Menu** (`/menu`)
- List semua menu items
- Tambah menu baru di `/menu/create`
- Hapus menu
- Support gambar menu via URL

## Tech Stack

- **Framework**: Next.js 15 dengan App Router
- **Database**: PostgreSQL dengan Prisma ORM
- **UI**: DaisyUI (Tailwind CSS)
- **Auth**: NextAuth.js
- **QR Code**: qrcode library
- **Validation**: Zod untuk schema validation (client & server-side)

## Database Schema

### Models:
- **User**: Admin, Kitchen Staff, Cashier
- **Table**: Meja dengan QR code dan status
- **MenuItem**: Menu makanan/minuman
- **Order**: Pesanan dengan status dan payment method
- **OrderItem**: Detail item dalam pesanan

### Enums:
- **Role**: ADMIN, KITCHEN_STAFF, CASHIER
- **TableStatus**: AVAILABLE, OCCUPIED, RESERVED, OUT_OF_SERVICE
- **OrderStatus**: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
- **PaymentMethod**: CASH, QRIS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup database:**
   - Pastikan DATABASE_URL sudah di-set di `.env`
   - Run migrations:
     ```bash
     npx prisma migrate dev
     ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

## Validation dengan Zod

Semua input form divalidasi menggunakan Zod di client-side dan server-side untuk keamanan maksimal:

### Schema Validations (`src/lib/validations.ts`):
- **Table**: Nomor meja (integer positif), kode meja (max 10 karakter)
- **Menu**: Nama (required), deskripsi (max 500 karakter), harga (positif), URL gambar
- **Order**: Items (minimal 1), total price, payment method

### Benefits:
- **Type Safety**: TypeScript inference otomatis dari Zod schema
- **Double Validation**: Validasi di client untuk UX, validasi di server untuk security
- **Consistent Error Messages**: Pesan error yang seragam dan jelas
- **Runtime Type Checking**: Memastikan data yang masuk sesuai schema

### Contoh Penggunaan:
```typescript
// Client-side validation
try {
  const validated = createTableSchema.parse(data)
  const result = await createTable(validated)
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
  }
}
```

## Flow Aplikasi

### Customer Flow:
1. Scan QR code di meja → `/table/[slug]`
2. Pilih menu dan tambahkan ke keranjang
3. Checkout dan pilih metode pembayaran
4. Pesanan masuk ke sistem dengan status PENDING

### Kitchen Flow:
1. Kitchen staff buka `/live`
2. Pesanan baru muncul dengan notifikasi audio
3. Konfirmasi → Mulai masak → Tandai siap
4. Status berubah menjadi READY

### Kasir Flow:
1. Kasir buka `/cashier`
2. Monitor semua meja dan pesanan aktif
3. Ketika customer mau bayar, klik "Selesaikan Pesanan"
4. Status order menjadi COMPLETED
5. Jika tidak ada pesanan aktif lagi, meja otomatis menjadi AVAILABLE

## Catatan Penting

1. **Notifikasi Audio**: File audio belum ditambahkan. Uncomment kode di `/live/LiveOrderView.tsx` dan tambahkan file `notification.mp3` di folder `public/`

2. **Middleware**: Anda perlu setup sendiri untuk authentication dan role-based access:
   - Admin: akses `/table`, `/menu`
   - Kitchen Staff: akses `/live`
   - Cashier: akses `/cashier`
   - Public: akses `/table/[slug]` (kiosk mode)

3. **QRIS Integration**: Saat ini disabled. Untuk implementasi:
   - Integrate dengan payment gateway (Midtrans, Xendit, dll)
   - Update UI di KioskView.tsx
   - Tambahkan payment verification

## Server Actions

Semua operasi database menggunakan server actions dengan Zod validation (bukan API routes):

### Table Actions (`src/actions/table.actions.ts`):
- `createTable(data)` - Validasi dengan `createTableSchema`
- `getTables()` - List semua meja
- `getTableBySlug(slug)` - Get meja berdasarkan slug
- `updateTableStatus(id, status)` - Update status meja
- `deleteTable(id)` - Hapus meja

### Menu Actions (`src/actions/menu.actions.ts`):
- `createMenuItem(data)` - Validasi dengan `createMenuItemSchema`
- `getMenuItems()` - List semua menu
- `updateMenuItem(id, data)` - Validasi dengan `updateMenuItemSchema`
- `deleteMenuItem(id)` - Hapus menu

### Order Actions (`src/actions/order.actions.ts`):
- `createOrder(data)` - Validasi dengan `createOrderSchema`
- `getActiveOrders()` - List pesanan aktif
- `updateOrderStatus(id, status)` - Update status pesanan
- `completeOrder(id)` - Selesaikan pesanan & update status meja

**Semua actions include Zod validation dan error handling yang konsisten.**

## Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Struktur Folder

```
src/
├── actions/           # Server actions
├── app/
│   ├── (auth)/       # Auth pages (signin)
│   ├── cashier/      # Kasir dashboard
│   ├── components/   # Reusable components (Cart, MenuCard)
│   ├── live/         # Kitchen staff dashboard
│   ├── menu/         # Menu management
│   └── table/        # Table management & kiosk
├── generated/        # Prisma generated files
└── lib/              # Utilities (prisma, auth)
```

## Troubleshooting

### QR Code tidak ter-generate
- Pastikan package `qrcode` sudah terinstall
- Check browser console untuk error

### Notifikasi tidak muncul di /live
- Check localStorage di browser
- Clear localStorage jika perlu
- Pastikan polling interval berjalan

### Order tidak update otomatis
- Pastikan `revalidate = 0` dan `dynamic = 'force-dynamic'` ada di page
- Check network tab untuk polling requests

## Future Improvements

1. ✅ Real-time updates dengan WebSocket/Pusher
2. ✅ Upload gambar menu ke cloud storage
3. ✅ QRIS payment integration
4. ✅ Print receipt untuk kasir
5. ✅ Laporan penjualan dan analytics
6. ✅ Multi-language support
7. ✅ PWA untuk tablet mode

## License

MIT
