import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function setupUsers() {
  console.log('🔧 Setting up users...')

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

  console.log('\n✨ Users setup completed!\n')
  console.log('📝 Login credentials:')
  console.log('   Admin: admin@sureyummy.com / admin123')
  console.log('   Kitchen: kitchen@sureyummy.com / kitchen123')
  console.log('   Cashier: cashier@sureyummy.com / cashier123\n')
}

setupUsers()
  .catch((error) => {
    console.error('❌ Error setting up users:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
