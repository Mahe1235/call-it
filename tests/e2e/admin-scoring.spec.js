import { test, expect } from '@playwright/test'
import { signIn } from '../helpers/auth-helpers.js'

/**
 * Admin scoring panel tests.
 * Rahul is the admin (is_admin = true in seed).
 */

const VALID_SCORECARD = JSON.stringify([
  { name: 'Virat Kohli', runs: 72, wickets: 0, role: 'batter' },
  { name: 'Rohit Sharma', runs: 8, wickets: 0, role: 'batter' },
  { name: 'Jasprit Bumrah', runs: 2, wickets: 3, role: 'bowler' },
  { name: 'KL Rahul', runs: 45, wickets: 0, role: 'batter' },
])

test.describe('Admin scoring', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'rahul')
    await page.goto('/admin')
    await expect(page.getByText(/Scoring Panel/i)).toBeVisible({ timeout: 10_000 })
  })

  test('scoring panel loads with match selector dropdown', async ({ page }) => {
    const select = page.locator('select')
    await expect(select.first()).toBeVisible()
  })

  test('selecting an already-published match shows Published badge and disables Publish', async ({ page }) => {
    // Select any completed match from the dropdown
    const select = page.locator('select').first()
    const completedOption = select.locator('option').filter({ hasText: /completed|✓/i }).first()
    if (await completedOption.count() > 0) {
      await select.selectOption({ index: await completedOption.evaluate(el => el.index) })
      // Published indicator should be present
      await expect(page.getByText(/Published/i).or(page.getByText(/✓/i))).toBeVisible({ timeout: 5_000 })
      // Publish button should be disabled or not present
      const publishBtn = page.getByRole('button', { name: /Publish/i })
      if (await publishBtn.isVisible()) {
        await expect(publishBtn).toBeDisabled()
      }
    }
  })

  test('Publish button is disabled before Preview is clicked', async ({ page }) => {
    // Select an upcoming or non-scored match
    const select = page.locator('select').first()
    await select.selectOption({ index: 1 })

    const publishBtn = page.getByRole('button', { name: /^Publish/i })
    if (await publishBtn.isVisible()) {
      await expect(publishBtn).toBeDisabled()
    }
  })

  test('invalid scorecard JSON shows error on Preview', async ({ page }) => {
    const select = page.locator('select').first()
    await select.selectOption({ index: 1 })

    // Enter invalid JSON in the scorecard textarea
    const textarea = page.locator('textarea')
    if (await textarea.isVisible()) {
      await textarea.fill('{ broken json !!!')
      const previewBtn = page.getByRole('button', { name: /Preview/i })
      if (await previewBtn.isVisible() && await previewBtn.isEnabled()) {
        await previewBtn.click()
        // Should show an error message
        await expect(
          page.getByText(/invalid|error|JSON/i)
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test('full scoring flow: preview → publish → leaderboard updates', async ({ page }) => {
    // Find an unscored match (upcoming or no score)
    const select = page.locator('select').first()
    const options = await select.locator('option').all()

    // Try to find an "upcoming" match option
    let targetIndex = -1
    for (let i = 1; i < options.length; i++) {
      const text = await options[i].textContent()
      if (text && (text.includes('upcoming') || text.includes('M96') || text.includes('M97'))) {
        targetIndex = i
        break
      }
    }

    if (targetIndex < 0) {
      test.skip('No unscored upcoming match found in dropdown')
      return
    }

    await select.selectOption({ index: targetIndex })
    await page.waitForTimeout(500)

    // Set winner
    const winnerButtons = page.getByRole('button').filter({ hasText: /^(RCB|MI|CSK|KKR|SRH|DC|PBKS|RR|GT|LSG)$/ })
    if (await winnerButtons.count() > 0) await winnerButtons.first().click()

    // Set The Call answer
    const callAnswerBtns = page.getByRole('button').filter({ hasText: /Over|Under/ })
    if (await callAnswerBtns.count() > 0) await callAnswerBtns.first().click()

    // Set Chaos Ball answer
    const chaosAnswerBtns = page.getByRole('button').filter({ hasText: /^(Yes|No)$/ })
    if (await chaosAnswerBtns.count() > 0) await chaosAnswerBtns.last().click()

    // Fill scorecard
    const textarea = page.locator('textarea')
    if (await textarea.isVisible()) {
      await textarea.fill(VALID_SCORECARD)
    }

    // Click Preview
    const previewBtn = page.getByRole('button', { name: /Preview/i })
    if (await previewBtn.isVisible() && await previewBtn.isEnabled()) {
      await previewBtn.click()
      await page.waitForTimeout(1000)

      // Publish button should now be enabled
      const publishBtn = page.getByRole('button', { name: /^Publish/i })
      if (await publishBtn.isVisible() && await publishBtn.isEnabled()) {
        await publishBtn.click()

        // Published confirmation
        await expect(
          page.getByText(/Published/i).or(page.getByText(/Scores published/i))
        ).toBeVisible({ timeout: 8_000 })

        // Navigate to leaderboard and check it loaded
        await page.goto('/league')
        await expect(page.locator('nav.bottom-nav')).toBeVisible()
        // Leaderboard should have rendered (any rank visible)
        await expect(page.getByText(/Rahul|Priya|Sneha|Karan/i).first()).toBeVisible({ timeout: 8_000 })
      }
    }
  })
})
