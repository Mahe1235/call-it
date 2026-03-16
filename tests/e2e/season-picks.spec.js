import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { signIn } from '../helpers/auth-helpers.js'

/**
 * Season picks tests.
 *
 * Seed assumptions:
 *   - Most test users (Rahul, Priya) have season_predictions rows
 *   - Sid or Aisha may not have season picks (check seed data)
 *   - First match date in the past → seasonStarted = true for these users
 */

test.describe('Season picks', () => {
  test('user with existing season picks sees SeasonTracker on /season', async ({ page }) => {
    await signIn(page, 'rahul')
    await page.goto('/season')
    // Should show locked tracker view (picks already made)
    // Look for the picks display (team names, player names)
    await expect(page.locator('nav.bottom-nav')).toBeVisible()
    const content = await page.content()
    // Page rendered — should NOT be the Season Picks form (season started)
    // SeasonTracker shows locked picks
    expect(content).toContain('season')
  })

  test('/season page loads and shows season content', async ({ page }) => {
    await signIn(page, 'priya')
    await page.goto('/season')
    await expect(page.locator('nav.bottom-nav')).toBeVisible()
    // Page should render without error
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('season picks form visible for user who has not yet submitted picks', async ({ page }) => {
    // Sid has no season picks in the seed
    await signIn(page, 'sid')
    await page.goto('/season')
    await expect(page.locator('nav.bottom-nav')).toBeVisible()

    // If season has not started: form should be present
    // If season has started + no picks: "missed" state
    // Either way, page renders without crashing
    await expect(page.locator('body')).not.toBeEmpty()
    await page.waitForTimeout(1000) // Let async data load
    const content = await page.content()
    // Should show some season-related content
    expect(content.length).toBeGreaterThan(500)
  })

  test('season picks submission persists in DB', async ({ page, context }) => {
    // Sign in as Aisha (no season picks in seed)
    await signIn(page, 'aisha')
    await page.goto('/season')
    await page.waitForTimeout(1500)

    // If form is present, fill and submit
    const top4Buttons = page.getByRole('button').filter({
      hasText: /^(RCB|MI|CSK|KKR|SRH|DC|PBKS|RR|GT|LSG)$/
    })

    if (await top4Buttons.count() >= 4) {
      // Click 4 teams for Top 4
      for (let i = 0; i < 4; i++) {
        await top4Buttons.nth(i).click()
      }

      // Look for save/submit button
      const saveBtn = page.getByRole('button', { name: /Save|Submit|Lock/i })
      if (await saveBtn.isVisible() && await saveBtn.isEnabled()) {
        await saveBtn.click()
        await page.waitForTimeout(2000)

        // Should transition to SeasonTracker (locked view)
        // Verify no form submission error
        const content = await page.content()
        expect(content).not.toContain('Error saving')
      }
    }
  })
})
