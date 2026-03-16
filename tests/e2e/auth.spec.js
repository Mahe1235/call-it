import { test, expect } from '@playwright/test'
import { signIn, signOut } from '../helpers/auth-helpers.js'

test.describe('Auth', () => {
  test('unauthenticated user sees sign-in screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Called It.')
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible()
  })

  test('sign in as Rahul → Home page loads', async ({ page }) => {
    await signIn(page, 'rahul')
    // Bottom nav confirms app shell loaded
    await expect(page.locator('nav.bottom-nav')).toBeVisible()
    // Dark mode toggle confirms AppShell rendered
    await expect(page.getByRole('button', { name: /Toggle dark mode/i })).toBeVisible()
  })

  test('sign out returns to sign-in screen', async ({ page }) => {
    await signIn(page, 'rahul')
    await signOut(page)
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible()
  })

  test('non-admin (Priya) navigating to /admin is redirected', async ({ page }) => {
    await signIn(page, 'priya')
    await page.goto('/admin')
    // Should redirect away from /admin
    await page.waitForURL(url => !url.pathname.includes('/admin'), { timeout: 5000 })
    await expect(page.locator('nav.bottom-nav')).toBeVisible()
  })

  test('admin (Rahul) can access /admin scoring panel', async ({ page }) => {
    await signIn(page, 'rahul')
    await page.goto('/admin')
    await expect(page.getByText(/Scoring Panel/i)).toBeVisible()
  })

  test('navigating to /league without auth shows sign-in screen', async ({ page }) => {
    await page.goto('/league')
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible()
  })
})
