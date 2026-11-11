import path from 'path'
import { fileURLToPath } from 'url'

import { test, expect } from './fixtures.js'

// Each results page is a hand-built stand-in for Google's markup, served at
// Google's search URL so the module treats it as a search page without any
// request reaching Google.
const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/express/static')

async function loadResultsPage(page, serviceWorker, fileName) {
  // The page script reads the configuration once, so a search loaded before
  // rex-core has stored it is never processed.
  await expect.poll(() => serviceWorker.evaluate(() => self.rexCorePlugin.fetchConfiguration().then((configuration) => configuration?.local_search !== undefined)), { timeout: 15000 }).toBe(true)

  await page.route('https://www.google.com/search?**', (route) => route.fulfill({ path: path.join(staticDir, fileName) }))

  await page.goto('https://www.google.com/search?q=pizza')
}

test.describe('REX Local Search', () => {
  // "People also ask" is the first result block after a local pack that sits
  // inside the results column.
  test('Collapse puts a copy of the first web result where the local pack was.', async ({ page, serviceWorker }) => {
    await loadResultsPage(page, serviceWorker, 'google-results-people-also-ask-first.html')

    const localPack = page.locator('[data-rpos="0"]')

    await expect(localPack).toBeHidden({ timeout: 15000 })

    const blockBeforePack = await localPack.evaluate((pack) => pack.previousElementSibling?.querySelector('[data-rpos]')?.getAttribute('data-rpos'))

    expect(blockBeforePack).toBe('2')
    await expect(page.locator('[data-rpos="1"]')).toHaveCount(1)
  })

  // The local pack sits in a full-width band above the results column.
  test('Collapse puts the copy at the top of the results column when the local pack is outside it.', async ({ page, serviceWorker }) => {
    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html')

    await expect(page.locator('#local-pack')).toBeHidden({ timeout: 15000 })

    const blocksInColumn = await page.locator('#rso > *').evaluateAll((blocks) => blocks.map((block) => block.querySelector('[data-rpos]')?.getAttribute('data-rpos')))

    expect(blocksInColumn).toEqual(['0', '0', '1'])
  })
})
