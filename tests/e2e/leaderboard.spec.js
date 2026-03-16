import { test, expect } from '@playwright/test'
import { signIn } from '../helpers/auth-helpers.js'

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'rahul')
  })

  test('leaderboard page shows seeded users ranked', async ({ page }) => {
    await page.goto('/league')
    // All 4 test users should appear
    await expect(page.getByText(/Rahul/i).first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/Priya/i).first()).toBeVisible()
    await expect(page.getByText(/Sneha/i).first()).toBeVisible()
    await expect(page.getByText(/Karan/i).first()).toBeVisible()
  })

  test('points progression chart SVG is rendered', async ({ page }) => {
    await page.goto('/league')
    // Recharts renders an SVG — wait for it
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 10_000 })
  })

  test('leaderboard snapshot is visible on Home page', async ({ page }) => {
    // Home page has a LeaderboardSnapshot showing top entries
    await page.goto('/')
    // Look for any rank indicator or point total (snapshot shows names + pts)
    const snapshot = page.locator('text=#1').or(page.getByText(/pts/i).first())
    await expect(snapshot.first()).toBeVisible({ timeout: 8_000 })
  })

  test('current user is shown on the leaderboard', async ({ page }) => {
    await page.goto('/league')
    // Rahul should appear with a highlight or just be present
    await expect(page.getByText('Rahul').first()).toBeVisible({ timeout: 8_000 })
  })
})
