import path from 'path'
import { fileURLToPath } from 'url'

import { test, expect } from './fixtures.js'

// Each results page is a hand-built stand-in for Google's markup, served at
// Google's search URL so the module treats it as a search page without any
// request reaching Google.
const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/express/static')

const CONFIGURED_ICON = 'data:image/gif;base64,R0lGODlhAQABAIAAAP8A/wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='

// The page script reads the configuration once, so a search loaded before
// rex-core has stored it is never processed.
async function waitForConfiguration(serviceWorker) {
  await expect.poll(() => serviceWorker.evaluate(() => self.rexCorePlugin.fetchConfiguration().then((configuration) => configuration?.local_search !== undefined)), { timeout: 15000 }).toBe(true)
}

async function setCollapseSettings(serviceWorker, settings) {
  await waitForConfiguration(serviceWorker)

  await serviceWorker.evaluate(async (newSettings) => {
    const configuration = await self.rexCorePlugin.fetchConfiguration()

    Object.assign(configuration.local_search.sites.google.manipulations['rex-local-search-widget'], newSettings)

    await self.rexCorePlugin.updateConfiguration(configuration)
  }, settings)
}

async function loadResultsPage(page, serviceWorker, fileName, query = 'pizza') {
  await waitForConfiguration(serviceWorker)

  await page.route('https://www.google.com/search?**', (route) => route.fulfill({ path: path.join(staticDir, fileName) }))

  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
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
      await expect(copy.locator(`img[src="${mapSource}"]`)).toHaveCount(1)
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

  test('Collapse fills the configured title template with the search query.', async ({ page, serviceWorker }) => {
    // A template unlike the module's default, so only a title read from the
    // configuration can pass.
    await setCollapseSettings(serviceWorker, { title: 'Configured {{query}} title' })

    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html', 'calzone')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    await expect(page.locator('#rso > :first-child h3')).toHaveText('Configured calzone title')
  })

  test('Collapse fills the configured description template, limiting the place list.', async ({ page, serviceWorker }) => {
    await setCollapseSettings(serviceWorker, { descriptions: 'Configured {{query}}: {{placelist:1}}' })

    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html', 'calzone')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    const description = page.locator('#rso > :first-child [data-sncf="1"]')

    await expect(description).toHaveText(/^Configured calzone: 1\. Example Pizzeria\./)
    await expect(description).not.toContainText('Another Pizzeria')
  })

  test('Collapse uses the first configured icon source that exists.', async ({ page, serviceWorker }) => {
    await setCollapseSettings(serviceWorker, { icon: `extension:not-built-in|${CONFIGURED_ICON}` })

    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    await expect(page.locator('#rso > :first-child img[alt="Site icon"]')).toHaveAttribute('src', CONFIGURED_ICON)
  })

  test('Collapse falls back to the default images when no configured source exists.', async ({ page, serviceWorker }) => {
    await setCollapseSettings(serviceWorker, { icon: 'extension:google-logo', preview: 'extension:google-static-map' })

    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    const mapSource = await page.locator('img[alt="Map"]').getAttribute('src')
    const copy = page.locator('#rso > :first-child')

    await expect(copy.locator('img[alt="Site icon"]')).toHaveAttribute('src', /^data:image\/svg\+xml/)
    await expect(copy.locator('img[alt="Site icon"]')).toBeVisible()
    await expect(copy.locator('img[alt="Thumbnail"]')).toHaveAttribute('src', mapSource)
    await expect(copy.locator('img[alt="Thumbnail"]')).toBeVisible()
  })

  test('Collapse can preview a place\'s own photo, counting organic places only.', async ({ page, serviceWorker }) => {
    await setCollapseSettings(serviceWorker, { preview: 'results.1.preview|pack:map' })

    await loadResultsPage(page, serviceWorker, 'google-results-full-width-local-pack.html')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    const placePhoto = await page.locator('img[alt="Place photo"]').getAttribute('src')

    await expect(page.locator('#rso > :first-child img[alt="Thumbnail"]')).toHaveAttribute('src', placePhoto)
  })

  test('Collapse adds the local pack\'s map as a thumbnail when the copied result has none.', async ({ page, serviceWorker }) => {
    await loadResultsPage(page, serviceWorker, 'google-results-no-thumbnail.html')

    await expect(page.locator('img[alt="Map"]')).toBeHidden({ timeout: 15000 })

    const mapSource = await page.locator('img[alt="Map"]').getAttribute('src')
    const copy = page.locator('#rso > :first-child')

    await expect(copy.locator(`img[src="${mapSource}"]`)).toBeVisible()
    await expect(page.locator('#rso > :nth-child(2) img')).toHaveCount(1)
  })
})
