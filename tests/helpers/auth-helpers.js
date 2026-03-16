/**
 * Playwright sign-in helpers.
 *
 * The app's dev-account buttons are labelled "⚡ Rahul (RCB)", "⚡ Priya (MI)", etc.
 * We click the matching button and wait for the Home page to load.
 */

// Map display names to the button text rendered on the sign-in screen
const DEV_ACCOUNTS = {
  rahul:  { label: 'Rahul',  team: 'RCB' },
  priya:  { label: 'Priya',  team: 'MI'  },
  sid:    { label: 'Sid',    team: 'KKR' },
  aisha:  { label: 'Aisha',  team: 'DC'  },
  arjun:  { label: 'Arjun',  team: 'CSK' },
  vikram: { label: 'Vikram', team: 'GT'  },
}

/**
 * Sign in via the dev account quick-login button.
 * @param {import('@playwright/test').Page} page
 * @param {'rahul'|'priya'|'sid'|'aisha'|'arjun'|'vikram'} user
 */
export async function signIn(page, user) {
  const account = DEV_ACCOUNTS[user]
  if (!account) throw new Error(`Unknown test user: ${user}`)

  await page.goto('/')
  // Wait for sign-in screen
  await page.waitForSelector('text=Called It.')

  const btnText = `⚡ ${account.label} (${account.team})`
  await page.click(`button:has-text("${account.label}")`)

  // Wait for the app shell to load (bottom nav appears once signed in)
  await page.waitForSelector('nav.bottom-nav', { timeout: 15_000 })
}

/**
 * Sign out from the profile page.
 * @param {import('@playwright/test').Page} page
 */
export async function signOut(page) {
  await page.goto('/profile')
  await page.click('button:has-text("Sign out")')
  await page.waitForSelector('text=Called It.')
}
