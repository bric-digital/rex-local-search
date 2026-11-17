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

  const layouts = [
    { name: 'local pack in the results column', fileName: 'google-results-people-also-ask-first.html', copySelector: '#local-pack-wrapper > :first-child' },
    { name: 'full-width local pack', fileName: 'google-results-full-width-local-pack.html', copySelector: '#rso > :first-child' },
  ]

  for (const layout of layouts) {
    test(`Collapse shows the local pack's map as the thumbnail and a map pin as the site icon (${layout.name}).`, async ({ page, serviceWorker }) => {
      await loadResultsPage(page, serviceWorker, layout.fileName)

      await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

      const mapSource = await page.locator('img[alt="Map"]').getAttribute('src')
      const copy = page.locator(layout.copySelector)

      await expect(copy.locator('img[alt="Thumbnail"]')).toHaveAttribute('src', mapSource)
      await expect(copy.locator('img[alt="Site icon"]')).toHaveAttribute('src', /^data:image\/svg\+xml/)

      await expect(page.locator('img[alt="Thumbnail"]').last()).not.toHaveAttribute('src', mapSource)
      await expect(page.locator('img[alt="Site icon"]').last()).not.toHaveAttribute('src', /^data:image\/svg\+xml/)
    })

    test(`Collapse replaces the copied site's name (${layout.name}).`, async ({ page, serviceWorker }) => {
      await loadResultsPage(page, serviceWorker, layout.fileName)

      await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

      const siteName = page.locator(layout.copySelector).locator('.notranslate > div').first()

      await expect(siteName).not.toContainText('Example Site')
      await expect(siteName).not.toHaveText('')
      await expect(page.getByText('Example Site')).toHaveCount(1)
    })

    test(`Collapse replaces the copied URL line and keeps its path styling (${layout.name}).`, async ({ page, serviceWorker }) => {
      await loadResultsPage(page, serviceWorker, layout.fileName)

      await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

      const copiedCite = page.locator(layout.copySelector).locator('cite')

      await expect(copiedCite).not.toContainText('example.com')
      await expect(copiedCite).not.toContainText('Pizza')
      await expect(copiedCite.locator('span')).not.toHaveText('')
      await expect(page.locator('cite').filter({ hasText: 'example.com' })).toHaveCount(1)
    })

    test(`Collapse describes the local pack's organic places (${layout.name}).`, async ({ page, serviceWorker }) => {
      await loadResultsPage(page, serviceWorker, layout.fileName)

      await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

      const description = page.locator(layout.copySelector).locator('[data-sncf="1"]')

      await expect(description).toContainText(/Example Pizzeria.*4\.5.*27K.*130 E Example St.*Another Pizzeria.*4\.7.*21K.*162 E Example St/)
      await expect(description).not.toContainText('Sponsored')
      await expect(description).not.toContainText('Great crust')
    })
  }

  test('Collapse describes a service business by its city, without its years in business.', async ({ page, serviceWorker }) => {
    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    const description = page.locator('#rso > :first-child').locator('[data-sncf="1"]')

    await expect(description).toContainText(/Example Plumbing.*5\.0.*476.*Chicago, IL/)
    await expect(description).not.toContainText('years in business')
  })
})
