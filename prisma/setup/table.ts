import { prisma } from './client.js'

export async function setupTables() {
  console.log('🪑 Setting up tables...')

  // Restoran Padang - typical layout with sections
  const tableGroups = [
    { section: 'A', count: 8, description: 'Area Depan' },      // Main dining area
    { section: 'B', count: 6, description: 'Area Tengah' },     // Middle section
    { section: 'C', count: 6, description: 'Area Belakang' },   // Back section
    { section: 'D', count: 4, description: 'Area VIP' }         // VIP/private section
  ]

  let totalCreated = 0
  
  for (const group of tableGroups) {
    console.log(`\n📍 Creating Section ${group.section} - ${group.description}...`)
    
    for (let i = 1; i <= group.count; i++) {
      const tableName = `${group.section}${i}`
      
      const existingTable = await prisma.table.findFirst({
        where: { name: tableName }
      })

      if (existingTable) {
        console.log(`  ⏭️  Table ${tableName} already exists, skipping...`)
        continue
      }

      const table = await prisma.table.create({
        data: {
          name: tableName,
          slug: tableName.toLowerCase(),
          status: 'AVAILABLE'
        }
      })

      console.log(`  ✅ Created table: ${table.name}`)
      totalCreated++
    }
  }

  const totalTables = tableGroups.reduce((sum, group) => sum + group.count, 0)
  console.log(`\n✨ Successfully set up ${totalCreated} new tables (${totalTables} total)!\n`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTables()
    .catch((e) => {
      console.error('❌ Error setting up tables:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
