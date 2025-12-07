# 🚀 Setup Guide - SureYummy POS

Panduan lengkap untuk setup dan menjalankan SureYummy di local development atau production.

---

## 📋 Prerequisites

Pastikan sudah terinstall:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))

> **Note**: npm akan terinstall otomatis bersama Node.js

---

## 🛠️ Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/fdvky1/sureyummy.git
cd sureyummy
```

### 2. Install Dependencies

Pilih salah satu package manager:

```bash
# Menggunakan npm
npm install

# Atau menggunakan yarn
yarn install

# Atau menggunakan pnpm
pnpm install
```

---

## ⚙️ Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit `.env` File

Buka file `.env` dan isi dengan credentials Anda:

```env
# ==========================================
# DATABASE
# ==========================================
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@ip:port/database"

# ==========================================
# NEXTAUTH (Authentication)
# ==========================================
# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"

# Local development
NEXTAUTH_URL="http://localhost:3000"

# ==========================================
# S3 COMPATIBLE STORAGE (Image Storage)
# ==========================================

MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET_NAME="bucket-name"
MINIO_PUBLIC_URL="http://localhost:9000"

# ==========================================
# AI CONFIGURATION
# ==========================================
# Untuk Rekomendasi Menu Tambahan dan Business Intelligence
# Format: baseurl|apikey|model

OPENAI_CONFIG="OPENAI_CONFIG="https://api.kolosal.ai/v1|your-api-key-here|Llama 4 Maverick"

# ==========================================
# WEBSOCKET (Real-time Updates)
# ==========================================
# Server untuk WebSocket real-time sync antara Kitchen dan Cashier
# Repository: https://github.com/fdvky1/ws-forwarder

# IMPORTANT: Tanpa WebSocket, sistem akan fallback ke polling setiap 5 detik
# WebSocket memberikan real-time updates yang lebih responsif

# Dengan WebSocket (Recommended untuk production)
NEXT_PUBLIC_FW_BASEURL="https://your-ws-forwarder.zeabur.app"
FW_APIKEY="your-apikey-ws-forwarder"
```

---

## 🗄️ Database Setup


### 1. Run Migrations

```bash
npx prisma migrate dev
```

Jika ada prompt, beri nama migration (contoh: `init`)

### 4. Seed Database

Setup initial data (users, menu, tables):

```bash
# Full setup (recommended untuk first time)
npm run setup

# Atau setup individual:
npm run setup:users   # Create admin, cashier, kitchen users
npm run setup:menu    # Import menu items
npm run setup:tables  # Create 24 tables (A1-A8, B1-B6, C1-C6, D1-D4)
```

**Default Users yang dibuat:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sureyummy.com | admin123 |
| Cashier | cashier@sureyummy.com | cashier123 |
| Kitchen | kitchen@sureyummy.com | kitchen123 |

---

## 🚀 Run Development Server

```bash
npm run dev
```

Server akan berjalan di:
- **Local**: http://localhost:3000
- **Network**: http://192.168.x.x:3000 (untuk test dari device lain)

---

## 🏗️ Build for Production

### 1. Build Project

```bash
npm run build
```

### 2. Start Production Server

```bash
npm run start
```
