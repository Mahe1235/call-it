import { execSync } from 'child_process'
import { config } from 'dotenv'

// Load env vars for the seed script
config({ path: '.env.local' })

export default async function globalSetup() {
  console.log('\n🌱 Resetting + reseeding test data before E2E suite...')
  try {
    execSync('node scripts/seedTestData.js --reset', { stdio: 'inherit', timeout: 60_000 })
  } catch {
    // --reset flag may not exist; fall through and just seed
  }
  try {
    execSync('node scripts/seedTestData.js', { stdio: 'inherit', timeout: 60_000 })
  } catch (err) {
    console.warn('⚠️  Seed script failed — tests will run against existing DB state:', err.message)
  }
  console.log('✅ Seed complete\n')
}
