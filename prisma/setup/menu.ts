import { prisma } from './client.js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function setupMenu() {
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
        category: item.category || null,
        image: null
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMenu()
    .catch((error) => {
      console.error('❌ Error setting up menu:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
