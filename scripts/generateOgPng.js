/**
 * Renders public/og-image.svg to public/og-image.png via Playwright (real Chromium).
 * Requires the Vite dev server to be running on port 5175, OR pass --file to use file://.
 *
 * Usage:
 *   node scripts/generateOgPng.js
 */

import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/og-image.svg')
const outPath = resolve(__dirname, '../public/og-image.png')

if (!existsSync(svgPath)) {
  console.error('public/og-image.svg not found')
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage()

await page.setViewportSize({ width: 1200, height: 630 })

// Try dev server first, fall back to file://
let url
try {
  const res = await fetch('http://localhost:5175/og-image.svg', { signal: AbortSignal.timeout(1500) })
  if (res.ok) url = 'http://localhost:5175/og-image.svg'
} catch {}

if (!url) {
  url = `file://${svgPath.replace(/\\/g, '/')}`
}

console.log(`Rendering: ${url}`)
await page.goto(url, { waitUntil: 'networkidle' })

// Wait for feTurbulence grain to settle
await page.waitForTimeout(400)

await page.screenshot({
  path: outPath,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
  type: 'png',
})

await browser.close()
console.log(`✓ Saved: public/og-image.png`)
