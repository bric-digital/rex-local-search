import { test, expect } from './fixtures.js';

test.describe('REX Local Search', () => {
  test('Validate extension loaded.', async ({ context, extensionId }) => {
    const isExtensionPage = (page) => page.url() === `chrome-extension://${extensionId}/index.html`;
    const page = context.pages().find(isExtensionPage) ?? await context.waitForEvent('page', isExtensionPage);
    await expect(page).toHaveTitle(/REX Local Search Testing Extension/);
  });
});
