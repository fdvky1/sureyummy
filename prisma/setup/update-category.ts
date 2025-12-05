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

async function updateMenuCategories() {
  console.log('🏷️  Updating menu categories...')

  // Read menu.json
  const menuPath = join(__dirname, './menu.json')
  const menuData = JSON.parse(readFileSync(menuPath, 'utf-8'))

  let updated = 0
  let notFound = 0

  for (const item of menuData) {
    const existingItem = await prisma.menuItem.findFirst({
      where: { name: item.name }
    })

    if (!existingItem) {
      notFound++
      console.log(`  ⚠️  Menu not found: ${item.name}`)
      continue
    }

    // Update category if it exists in JSON
    if (item.category) {
      await prisma.menuItem.update({
        where: { id: existingItem.id },
        data: { category: item.category }
      })
      updated++
    }
  }

  console.log(`  ✅ Updated ${updated} menu items with categories`)
  if (notFound > 0) {
    console.log(`  ⚠️  ${notFound} items not found in database`)
  }
  console.log('\n✨ Category update completed!\n')
}

updateMenuCategories()
  .catch((error) => {
    console.error('❌ Error updating categories:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
