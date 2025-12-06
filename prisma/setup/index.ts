import { prisma } from './client.js'
import { setupUsers } from './user.js'
import { setupMenu } from './menu.js'
import { setupTables } from './table.js'

async function main() {
  console.log('\n🚀 Starting SureYummy Setup...\n')
  console.log('=' .repeat(50))
  console.log('')

  await setupUsers()
  await setupMenu()
  await setupTables()

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
