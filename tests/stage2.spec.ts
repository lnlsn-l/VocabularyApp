import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function add(page: Page, word = 'substrate', meaning = '衬底') {
  await page.getByRole('button', { name: '＋ 添加词条', exact: true }).click()
  await page.getByLabel('英文词汇 / 短语').fill(word)
  await page.getByLabel('中文释义').fill(meaning)
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

async function state(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('VocabularyDB')
    const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    try {
      const transaction = db.transaction(['vocabulary', 'vocabularyAppMetadata'], 'readonly')
      const read = (store: string) => new Promise<unknown[]>((resolve, reject) => {
        const result = transaction.objectStore(store).getAll()
        result.onsuccess = () => resolve(result.result); result.onerror = () => reject(result.error)
      })
      const [entries, metadata] = await Promise.all([read('vocabulary'), read('vocabularyAppMetadata')])
      return { entries, metadata }
    } finally { db.close() }
  })
}

async function backup(page: Page) {
  const waiting = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出词库', exact: true }).click()
  const download = await waiting
  const buffer = await readFile((await download.path())!)
  return JSON.parse(buffer.toString()) as { version: number; app: string; exportedAt: string; entries: Record<string, unknown>[] }
}
async function select(page: Page, value: unknown) {
  await page.getByLabel('选择 JSON 备份').setInputFiles({ name: 'stage2-test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) })
  await expect(page.getByRole('dialog', { name: '导入预览' })).toBeVisible()
}

test('第二阶段备份状态、刷新和多标签页一致性，导出覆盖全库', async ({ page, context, baseURL }) => {
  await page.goto('./')
  const status = page.getByLabel('备份状态')
  await expect(status).toContainText('尚未发起导出')
  await expect(status).toContainText('当前词库为空')
  await expect(page.getByText('稍后提醒（7 天）', { exact: true })).toHaveCount(0)
  await add(page)
  await expect(status).toContainText('存在未导出变化')
  const second = await context.newPage()
  await second.goto(baseURL!)
  await add(second, 'impedance', '阻抗')
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.getByRole('searchbox').fill('sub')
  const exported = await backup(page)
  expect(exported.entries).toHaveLength(2)
  expect(JSON.stringify(exported)).not.toMatch(/dataRevision|lastExportRequestedAt|VocabularyApp.backupState/)
  await expect(status).toContainText('自上次发起导出后无新增变化')
  await expect(second.getByLabel('备份状态')).toContainText('自上次发起导出后无新增变化')
  await page.reload()
  await expect(status).not.toContainText('尚未发起导出')
  await expect(page.getByRole('searchbox')).toHaveValue('')
  await second.getByRole('article', { name: 'impedance', exact: true }).getByRole('button', { name: '删除', exact: true }).click()
  await second.getByRole('button', { name: '永久删除', exact: true }).click()
  await expect(status).toContainText('存在未导出变化')
})

test('第二阶段导入预览取消只读、差异和并发重新确认', async ({ page, context, baseURL }) => {
  await page.goto('./'); await add(page)
  const exported = await backup(page)
  const existing = exported.entries[0]
  const value = { ...exported, entries: [
    { ...existing, meaning: '旧释义', note: '旧备注', status: 'mastered' },
    { ...existing, id: 'new', word: 'impedance', meaning: '阻抗' },
    { ...existing, id: 'file-duplicate', word: ' IMPEDANCE ', meaning: '文件内差异' },
    { ...existing, word: ' ' },
  ] }
  const before = await state(page)
  await select(page, value)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('预计新增')
  await expect(dialog).toContainText('重复中存在差异 2 条')
  await dialog.getByText('查看重复词差异（2）', { exact: true }).click()
  await expect(dialog).toContainText('当前词库：衬底')
  await expect(dialog).toContainText('备份文件：旧释义')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await state(page)).toEqual(before)
  await select(page, value)
  const second = await context.newPage()
  await second.goto(baseURL!); await add(second, 'impedance', '当前新释义')
  const afterOther = await state(second)
  await dialog.getByRole('button', { name: '确认合并', exact: true }).click()
  await expect(dialog).toContainText('已更新预览，本次未写入')
  expect(await state(page)).toEqual(afterOther)
  await dialog.getByRole('button', { name: '确认合并', exact: true }).click()
  await expect(page.getByText('成功导入：0；重复跳过：3；无效数据：1。', { exact: true })).toBeVisible()
  expect(await state(page)).toEqual(afterOther)
  await expect(page.getByRole('article', { name: 'impedance', exact: true })).toContainText('当前新释义')
})
