/**
 * createTestUser.js
 * Creates the dev test user (Rahul/RCB) via Supabase Admin API.
 * Run once: node scripts/createTestUser.js
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TEST_USER_ID = 'a0000000-0000-0000-0000-000000000001'

async function main() {
  // Create via admin API (handles GoTrue setup correctly)
  const { data, error } = await supabase.auth.admin.createUser({
    id: TEST_USER_ID,
    email: 'rahul@called-it.test',
    password: 'test1234',
    email_confirm: true,
    user_metadata: { name: 'Rahul' },
  })

  if (error) {
    console.error('❌ Auth user creation failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Auth user created:', data.user.id)

  // Ensure public.users profile exists
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: TEST_USER_ID,
      display_name: 'Rahul',
      team: 'rcb',
      is_admin: true,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('❌ Profile upsert failed:', profileError.message)
    process.exit(1)
  }

  console.log('✅ Profile upserted (Rahul / RCB / admin)')
  console.log('\nTest credentials:')
  console.log('  Email:    rahul@called-it.test')
  console.log('  Password: test1234')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
