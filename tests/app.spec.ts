import { expect, test } from '@playwright/test'

test('开发服务器能够打开应用', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible()
})

test('真实 IndexedDB 在页面刷新后保留数据', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const path = '/src/services/vocabularyService.ts'
    const { vocabularyService } = await import(path)
    await vocabularyService.create({ word: 'substrate', meaning: '衬底', note: '', status: 'learning' })
  })
  await page.reload()
  const words = await page.evaluate(async () => {
    const path = '/src/services/vocabularyService.ts'
    const { vocabularyService } = await import(path)
    return vocabularyService.list()
  })
  expect(words).toEqual([expect.objectContaining({ word: 'substrate', meaning: '衬底' })])
})
