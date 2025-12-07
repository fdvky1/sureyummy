# 🍽️ SureYummy - Sistem POS Restoran Modern

<div align="center">

**Platform Point of Sale all-in-one untuk restoran Nasi Padang**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-5-5A0EF8?style=flat-square&logo=daisyui)](https://daisyui.com/)

[Demo](https://sureyummy.vercel.app) • [Setup Guide](./SETUP.md) • [Demo Info](./DEMO.md)

</div>

---

## 📖 Tentang Project

**SureYummy** adalah sistem Point of Sale (POS) modern yang dirancang khusus untuk restoran Nasi Padang dengan fokus pada:

- 📱 **QR Code Ordering** - Customer order langsung dari meja tanpa antri
- 👨‍🍳 **Kitchen Display** - Real-time order management untuk dapur
- 💰 **Cashier System** - Payment processing dengan thermal receipt
- 📊 **AI Analytics** - Business intelligence dengan AI insights
- 🪑 **Table Management** - QR generation & status tracking

---

## ✨ Fitur Utama

### 1. 📱 QR Code Ordering
Customer scan QR code di meja untuk order langsung dari smartphone.

**Flow:**
```
Scan QR → Browse Menu → Add to Cart → Submit Order → Masuk Kitchen
```

**Session-based Ordering:**
- Satu meja = satu session aktif
- Hanya user dengan session aktif yang bisa menambah pesanan
- Mencegah konflik order dari multiple users di meja yang sama
- Session expired otomatis setelah pembayaran

---

### 2. 👨‍🍳 Kitchen Display System
Real-time dashboard untuk dapur mengelola pesanan.

**Status Workflow:**
```
PENDING → PREPARING → READY → (auto-removed)
```

**Fitur:**
- Notifikasi order baru dengan highlight
- Konfirmasi & mulai masak
- Tandai siap untuk diambil cashier
- WebSocket real-time updates

---

### 3. 💰 Cashier Dashboard
Dashboard kasir untuk payment processing.

**Fitur:**
- Monitor status semua meja
- Review order details per session
- Payment method: Cash only (QRIS in roadmap)
- Auto-print thermal receipt (80mm)
- Order completion & table reset

---

### 4. 📊 AI Business Intelligence
Analytics dengan AI-powered insights untuk decision making.

**Fitur:**
- KPI real-time: Revenue, orders, AOV
- Peak hours & best sellers analysis
- AI strategic recommendations
- Growth prediction & actionable insights

**Tech:** Firebase Genkit + OpenAI compatible LLM

---

### 5. 🍔 Menu Management
CRUD menu dengan upload image ke S3-compatible storage.

**6 Kategori:** Appetizer, Main Course, Side Dish, Dessert, Beverage, Condiment

---

### 6. 🪑 Table Management
Manajemen 24 meja dengan QR code generation.

**Fitur:**
- Generate QR per meja (A1-A8, B1-B6, C1-C6, D1-D4)
- Copy order link untuk share
- Status: Available/Occupied/Out of Service
- Soft delete dengan restore capability

---

## 🏗️ Tech Stack

**Frontend:** Next.js 16, TypeScript 5, DaisyUI 5, TailwindCSS 4  
**Backend:** PostgreSQL, Prisma 7, NextAuth.js v4  
**Real-time:** WebSocket ([ws-forwarder](https://github.com/fdvky1/ws-forwarder)) or 5s polling fallback  
**Storage:** S3-Compatible (Cloudflare R2, MinIO, AWS S3)  
**AI:** Firebase Genkit + OpenAI compatible LLM  

---

## 🚀 Quick Start

**Setup lengkap:** Lihat [SETUP.md](./SETUP.md)

```bash
git clone https://github.com/fdvky1/sureyummy.git
cd sureyummy
npm install
cp .env.example .env  # Edit dengan credentials Anda

npx prisma migrate dev
npm run setup  # Create users, menu, tables
npm run dev
```

**Demo:** [https://sureyummy.vercel.app](https://sureyummy.vercel.app) - [Demo Info](./DEMO.md)

---

## 🎨 Role-Based Access

| Role | Access |
|------|--------|
| **Admin** | Full access - Dashboard, Menu, Tables, Reports |
| **Cashier** | Cashier view, Payment, Table management |
| **Kitchen** | Kitchen display only |
| **Customer** | Public ordering via QR (no login) |

---