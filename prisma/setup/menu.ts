import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function setupMenu() {
  console.log('🍽️  Setting up menu items...')

  // Read menu.json
  const menuPath = join(__dirname, './menu.json')
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
  console.log('\n✨ Menu setup completed!\n')
}

setupMenu()
  .catch((error) => {
    console.error('❌ Error setting up menu:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
