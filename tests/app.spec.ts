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

test('添加、重复检测、编辑、状态切换和删除确认', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '＋ 添加词条' }).click()
  await page.getByLabel('英文词汇 / 短语').fill(' substrate ')
  await page.getByLabel('中文释义').fill('衬底')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  const card = page.getByRole('article', { name: 'substrate', exact: true })
  await expect(card).toBeVisible()
  await page.reload()
  await expect(card).toBeVisible()
  await page.getByRole('button', { name: '＋ 添加词条' }).click()
  await page.getByLabel('英文词汇 / 短语').fill('Substrate')
  await page.getByLabel('中文释义').fill('重复词')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('已经存在')
  await page.getByRole('button', { name: '查看已有词条' }).click()
  await page.getByLabel('中文释义').fill('衬底；基板')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(card).toContainText('衬底；基板')
  await card.getByRole('button', { name: '标记已掌握' }).click()
  await expect(card.getByText('已掌握', { exact: true })).toBeVisible()
  await card.getByRole('button', { name: '删除', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('此操作不可撤销')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: '删除', exact: true }).click()
  await page.getByRole('button', { name: '永久删除', exact: true }).click()
  await expect(card).toHaveCount(0)
})
