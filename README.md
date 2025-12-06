# 🍽️ SureYummy - Modern Restaurant POS System

<div align="center">

![SureYummy Logo](https://img.shields.io/badge/SureYummy-Restaurant%20POS-orange?style=for-the-badge&logo=restaurant)

**Platform POS all-in-one untuk restoran dan cafe modern**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-4-5A0EF8?style=flat-square&logo=daisyui)](https://daisyui.com/)

[Demo](#) • [Documentation](./IMPLEMENTATION.md) • [AI Features](./AI_FEATURES.md)

</div>

---

## 📖 Tentang Project

**SureYummy** adalah sistem Point of Sale (POS) modern yang dirancang khusus untuk restoran dan cafe. Sistem ini mengintegrasikan pemesanan digital via QR Code, manajemen dapur real-time, kasir dengan cetak struk otomatis, dan dashboard analytics dengan AI-powered insights.

### 🎯 Masalah yang Dipecahkan

- ❌ **Pesanan manual** yang rawan salah dan hilang
- ❌ **Komunikasi dapur-kasir** yang tidak efisien
- ❌ **Sulit tracking revenue** dan menu terlaris
- ❌ **Antrian pembayaran** yang lambat
- ❌ **Data penjualan** tidak terstruktur

### ✅ Solusi Kami

- ✅ QR Code ordering langsung ke sistem
- ✅ Real-time sync kasir & kitchen display
- ✅ Dashboard analytics dengan AI insights
- ✅ Cetak struk otomatis & multi payment
- ✅ Laporan lengkap harian & bulanan

---

## ✨ Fitur Utama

### 1. 📱 Digital Ordering (QR Code)

Customer scan QR code di meja untuk memesan langsung dari smartphone mereka.

**Fitur:**
- Browse menu digital dengan foto HD
- Add to cart dan customize quantity
- Real-time order submission
- Session-based ordering untuk split bill

```
Alur: Scan QR → Pilih Menu → Checkout → Order Masuk Sistem
```

![Digital Ordering](https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Digital+Ordering+%28QR+Code%29)
*Customer dapat memesan langsung dari meja tanpa panggil waiter*

---

### 2. 👨‍🍳 Kitchen Display System

Dashboard real-time untuk tim dapur mengelola pesanan.

**Fitur:**
- Live order notifications dengan visual highlight
- Status management: Pending → Confirmed → Preparing → Ready
- Order prioritization berdasarkan waktu
- Auto-refresh setiap 5 detik

```
Workflow: Terima Order → Konfirmasi → Mulai Masak → Tandai Siap
```

![Kitchen Display](https://via.placeholder.com/800x400/4ECDC4/FFFFFF?text=Kitchen+Display+System)
*Tim dapur dapat melihat dan update status pesanan real-time*

---

### 3. 💰 Cashier Dashboard

Control center untuk kasir mengelola pembayaran dan meja.

**Fitur:**
- Monitor status semua meja (Tersedia/Terisi)
- List pesanan per meja atau global
- Multi payment method (Cash, QRIS)
- Auto-print thermal receipt (80mm)
- Session-based payment untuk split bill

```
Workflow: Customer Request Payment → Review Order → Process Payment → Print Receipt
```

![Cashier Dashboard](https://via.placeholder.com/800x400/F7DC6F/000000?text=Cashier+Dashboard)
*Kasir dapat memproses pembayaran dan cetak struk dengan cepat*

---

### 4. 📊 Business Intelligence Dashboard

Analytics mendalam dengan AI-powered insights untuk owner/manager.

**Fitur:**
- **KPI Metrics**: Revenue, AOV, Order Frequency dengan growth indicators
- **Business Analytics**: Peak hours, top category, best sellers, slow-moving items
- **AI Strategic Analysis**: LLM-powered analysis dengan on-demand generation
- **Trend Prediction**: Increasing/decreasing/stable dengan proyeksi revenue
- **Smart Recommendations**: Prioritized actionable insights

```
Data → Rule-based Analytics (Auto) → AI Analysis (On-demand) → Strategic Insights
```

![Dashboard Analytics](https://via.placeholder.com/800x400/9B59B6/FFFFFF?text=AI+Business+Intelligence)
*Dashboard dengan AI insights untuk keputusan strategis bisnis*

---

### 5. 🍔 Menu Management

Kelola menu dengan mudah, lengkap dengan kategori dan gambar.

**Fitur:**
- CRUD operations untuk menu items
- Upload gambar ke Cloudflare R2
- Kategori: Menu Utama, Minuman, Lauk Pauk, Appetizer, Dessert, Sambal
- Real-time updates ke semua devices

![Menu Management](https://via.placeholder.com/800x400/3498DB/FFFFFF?text=Menu+Management)
*Kelola menu dengan interface yang intuitif*

---

### 6. 🪑 Table Management

Manajemen meja dengan QR code generation.

**Fitur:**
- Generate QR code unik per meja
- Print QR code untuk stiker meja
- Status tracking (Available/Occupied/Out of Service)
- Auto-update status based on orders

![Table Management](https://via.placeholder.com/800x400/E74C3C/FFFFFF?text=Table+Management)
*Generate dan print QR code untuk setiap meja*

---

### 7. 📜 Order History & Reports

Tracking transaksi lengkap dengan laporan bulanan.

**Fitur:**
- **History**: Filter by status, date range, payment method
- **Monthly Reports**: Revenue, orders, category breakdown, daily stats
- **Export Ready**: Data terstruktur untuk analytics
- **Receipt Reprint**: Print ulang struk dari history

![Reports](https://via.placeholder.com/800x400/16A085/FFFFFF?text=Order+History+%26+Reports)
*Laporan lengkap untuk audit dan analisis bisnis*

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Framework**: [DaisyUI](https://daisyui.com/) + [TailwindCSS](https://tailwindcss.com/)
- **Icons**: [Remix Icon](https://remixicon.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **QR Code**: [qrcode](https://www.npmjs.com/package/qrcode)
- **State Management**: Zustand

### Backend
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Validation**: [Zod](https://zod.dev/)
- **AI Framework**: [Firebase Genkit](https://firebase.google.com/docs/genkit)

### Infrastructure
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Setup Project

### Prerequisites

Pastikan sudah terinstall:
- Node.js 18+ 
- PostgreSQL 14+
- npm/yarn/pnpm

### 1. Clone Repository

```bash
git clone https://github.com/fdvky1/sureyummy.git
cd sureyummy
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Setup Environment Variables

Buat file `.env` di root project:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sureyummy"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 (untuk upload gambar menu)
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_R2_BUCKET_NAME="your-bucket-name"
CLOUDFLARE_R2_PUBLIC_URL="https://your-public-url.com"

# OpenAI Compatible API (untuk AI insights)
OPENAI_CONFIG="https://api.openai.com/v1|your-api-key|gpt-4"
# Format: baseurl|apikey|model
```

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database dengan data dummy
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 6. Default Credentials

Setelah seeding, gunakan credentials berikut:

**Admin:**
```
Email: admin@sureyummy.com
Password: admin123
```

**Cashier:**
```
Email: cashier@sureyummy.com
Password: cashier123
```

**Kitchen Staff:**
```
Email: kitchen@sureyummy.com
Password: kitchen123
```

---

## 📁 Struktur Project

```
sureyummy/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages
│   │   ├── api/              # API routes (NextAuth)
│   │   ├── cashier/          # Kasir dashboard
│   │   ├── dashboard/        # Admin analytics
│   │   ├── live/             # Kitchen display
│   │   ├── menu/             # Menu management
│   │   └── table/            # Table & kiosk
│   ├── components/           # Reusable components
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config
│   │   ├── prisma.ts         # Prisma client
│   │   ├── genkit.ts         # AI flows
│   │   └── enumHelpers.ts    # Enum translators
│   ├── stores/               # Zustand stores
│   └── types/                # TypeScript types
├── .env                      # Environment variables
├── next.config.ts            # Next.js config
└── package.json              # Dependencies
```

---

## 🎨 Role-Based Access

### 👑 Admin
- Full access ke semua fitur
- Dashboard analytics dengan AI insights
- Menu management
- Table management
- Order history & reports

### 💵 Cashier
- Cashier dashboard
- Order history
- Monthly reports
- Table management

### 👨‍🍳 Kitchen Staff
- Kitchen display (live orders)
- Update order status

### 🧑 Customer (Public)
- Kiosk mode (scan QR)
- Browse menu
- Place order

---

## 🧪 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Open Prisma Studio (GUI)
npx prisma migrate dev   # Create & apply migration
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Seed database

# Linting
npm run lint             # Run ESLint
```

---

## 📚 Documentation

- [Implementation Guide](./IMPLEMENTATION.md) - Dokumentasi lengkap flow aplikasi
- [AI Features](./AI_FEATURES.md) - Dokumentasi AI Business Intelligence

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.
