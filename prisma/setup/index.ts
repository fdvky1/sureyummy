import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function setupUsers() {
  console.log('👤 Setting up users...')

  const users = [
    {
      email: 'admin@sureyummy.com',
      password: 'admin123',
      name: 'Admin',
      role: 'ADMIN'
    },
    {
      email: 'kitchen@sureyummy.com',
      password: 'kitchen123',
      name: 'Kitchen Staff',
      role: 'KITCHEN_STAFF'
    },
    {
      email: 'cashier@sureyummy.com',
      password: 'cashier123',
      name: 'Kasir',
      role: 'CASHIER'
    }
  ]

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log(`  ⏭️  User ${userData.email} already exists, skipping...`)
      continue
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role as any
      }
    })

    console.log(`  ✅ Created user: ${user.email} (${user.role})`)
  }

  console.log('')
}

async function setupMenu() {
  console.log('🍽️  Setting up menu items...')

  // Read menu.json
  const menuPath = join(__dirname, '../menu.json')
  const menuData = JSON.parse(readFileSync(menuPath, 'utf-8'))

  let created = 0
  let skipped = 0

  for (const item of menuData) {
    const existingItem = await prisma.menuItem.findFirst({
      where: { name: item.name }
    })

    if (existingItem) {
      skipped++
      continue
    }

    await prisma.menuItem.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        image: null // Kosongkan dulu seperti diminta
      }
    })

    created++
  }

  console.log(`  ✅ Created ${created} menu items`)
  if (skipped > 0) {
    console.log(`  ⏭️  Skipped ${skipped} existing items`)
  }
  console.log('')
}

async function main() {
  console.log('\n🚀 Starting SureYummy Setup...\n')
  console.log('=' .repeat(50))
  console.log('')

  await setupUsers()
  await setupMenu()

  console.log('=' .repeat(50))
  console.log('\n✨ Setup completed successfully!\n')
  console.log('📝 Default Login Credentials:')
  console.log('   👤 Admin:   admin@sureyummy.com / admin123')
  console.log('   👨‍🍳 Kitchen: kitchen@sureyummy.com / kitchen123')
  console.log('   💰 Cashier: cashier@sureyummy.com / cashier123')
  console.log('')
}

main()
  .catch((error) => {
    console.error('\n❌ Error during setup:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
