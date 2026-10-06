import { expect, test } from '@playwright/test'

test('开发服务器能够打开应用', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible()
})
