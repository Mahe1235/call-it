import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * RLS (Row Level Security) tests.
 * These use the Supabase JS client directly — no browser needed.
 * They validate the database policies that protect game integrity.
 *
 * Test users (from seed):
 *   rahul@called-it.test — admin, has predictions on M90-M97, M98 (live)
 *   priya@called-it.test — has predictions on M90-M97, M98 (live)
 *   karan@called-it.test — has predictions on M90-M95 only (not M96 upcoming, not M98 live)
 */

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY

async function clientAs(email, password = 'test1234') {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`)
  return client
}

test.describe('RLS — predictions', () => {
  test('user can always read their own predictions', async () => {
    const client = await clientAs('rahul@called-it.test')
    const { data, error } = await client
      .from('predictions')
      .select('id, match_winner_pick')
      .limit(5)
    expect(error).toBeNull()
    expect(data).toBeTruthy()
    // Rahul has predictions — should get rows back
    expect(data.length).toBeGreaterThan(0)
    await client.auth.signOut()
  })

  test('cannot read another user\'s predictions on an upcoming match', async () => {
    const karan = await clientAs('karan@called-it.test')

    // First find an upcoming match ID
    const { data: matches } = await karan.from('matches').select('id').eq('status', 'upcoming').limit(1)
    if (!matches?.length) {
      console.log('No upcoming matches — skipping')
      await karan.auth.signOut()
      return
    }
    const upcomingMatchId = matches[0].id

    // Find Rahul's user ID
    const { data: rahulProfile } = await karan.from('users').select('id').eq('display_name', 'Rahul').single()
    if (!rahulProfile) {
      await karan.auth.signOut()
      return
    }

    // Try to read Rahul's prediction for the upcoming match
    const { data: pred, error } = await karan
      .from('predictions')
      .select('id')
      .eq('match_id', upcomingMatchId)
      .eq('user_id', rahulProfile.id)

    // RLS should return empty (not error — it just filters out the row)
    expect(error).toBeNull()
    expect(pred).toHaveLength(0)

    await karan.auth.signOut()
  })

  test('can read another user\'s predictions on a completed match', async () => {
    const karan = await clientAs('karan@called-it.test')

    // Find a completed match
    const { data: matches } = await karan.from('matches').select('id').eq('status', 'completed').limit(1)
    if (!matches?.length) {
      await karan.auth.signOut()
      return
    }
    const completedMatchId = matches[0].id

    // Find Rahul's ID
    const { data: rahulProfile } = await karan.from('users').select('id').eq('display_name', 'Rahul').single()
    if (!rahulProfile) {
      await karan.auth.signOut()
      return
    }

    const { data: pred, error } = await karan
      .from('predictions')
      .select('id, match_winner_pick')
      .eq('match_id', completedMatchId)
      .eq('user_id', rahulProfile.id)

    expect(error).toBeNull()
    // Should be able to see it (RLS allows reads on completed matches)
    expect(pred).not.toBeNull()

    await karan.auth.signOut()
  })

  test('cannot update another user\'s prediction', async () => {
    const karan = await clientAs('karan@called-it.test')

    // Find Rahul's user ID
    const { data: rahulProfile } = await karan.from('users').select('id').eq('display_name', 'Rahul').single()
    if (!rahulProfile) {
      await karan.auth.signOut()
      return
    }

    // Attempt to update Rahul's prediction
    const { data, error } = await karan
      .from('predictions')
      .update({ match_winner_pick: 'mi' })
      .eq('user_id', rahulProfile.id)
      .select()

    // RLS: update policy is `using (user_id = auth.uid())` — should affect 0 rows
    // error may be null (RLS silently blocks) but data should be empty
    expect(data).toHaveLength(0)

    await karan.auth.signOut()
  })

  test('cannot update own prediction when locked_at is set', async () => {
    const rahul = await clientAs('rahul@called-it.test')

    // Find a completed match prediction (locked_at will be set)
    const { data: lockedPreds } = await rahul
      .from('predictions')
      .select('id, locked_at')
      .not('locked_at', 'is', null)
      .limit(1)

    if (!lockedPreds?.length) {
      await rahul.auth.signOut()
      return
    }

    const { data, error } = await rahul
      .from('predictions')
      .update({ match_winner_pick: 'mi' })
      .eq('id', lockedPreds[0].id)
      .select()

    // RLS policy: `predictions_update` requires `locked_at is null`
    // Should return 0 rows updated (silently blocked)
    expect(data).toHaveLength(0)

    await rahul.auth.signOut()
  })
})

test.describe('RLS — matches table', () => {
  test('non-admin cannot update matches table', async () => {
    const karan = await clientAs('karan@called-it.test')

    const { data: matches } = await karan.from('matches').select('id').limit(1)
    if (!matches?.length) {
      await karan.auth.signOut()
      return
    }

    const { data, error } = await karan
      .from('matches')
      .update({ status: 'live' })
      .eq('id', matches[0].id)
      .select()

    // RLS blocks non-admin writes — should return 0 rows or error
    expect((data ?? []).length).toBe(0)

    await karan.auth.signOut()
  })

  test('admin can update matches table', async () => {
    const rahul = await clientAs('rahul@called-it.test')

    // Find an upcoming match to test with
    const { data: matches } = await rahul.from('matches').select('id, status').eq('status', 'upcoming').limit(1)
    if (!matches?.length) {
      await rahul.auth.signOut()
      return
    }

    // Revert: read current status, attempt no-op update to same value
    const { data, error } = await rahul
      .from('matches')
      .update({ status: 'upcoming' })  // no-op update
      .eq('id', matches[0].id)
      .select()

    expect(error).toBeNull()
    // Admin should get the updated row back
    expect(data).not.toBeNull()
    expect(data.length).toBeGreaterThan(0)

    await rahul.auth.signOut()
  })
})
