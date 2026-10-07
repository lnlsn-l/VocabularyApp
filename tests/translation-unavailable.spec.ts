import { expect, test } from '@playwright/test'
test('翻译代理未配置仍可手动保存，不发送请求或改变 revision', async ({ page }) => {
  const external: string[] = []; const errors: string[] = []
  page.on('request', request => { if (new URL(request.url()).hostname !== 'localhost') external.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('./')
  await page.getByRole('button', { name: '＋ 添加词条' }).click()
  await page.getByLabel('英文词汇 / 短语').fill('manual fixture')
  await page.getByRole('button', { name: '获取翻译参考', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('翻译服务暂不可用，可手动添加。')
  await page.getByLabel('中文释义').fill('手动释义')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('article')).toContainText('手动释义')
  expect(external).toEqual([]); expect(errors).toEqual([])
})
