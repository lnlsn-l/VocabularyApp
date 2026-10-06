import { expect, test } from '@playwright/test'

test('开发服务器能够打开应用', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible()
})

test('英文、中文和备注实时搜索', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const path = '/src/services/vocabularyService.ts'
    const { vocabularyService } = await import(path)
    await vocabularyService.create({ word: 'substrate', meaning: '衬底', note: '半导体论文', status: 'learning' })
    await vocabularyService.create({ word: 'electromagnetic interference', meaning: '电磁干扰', note: '微波', status: 'learning' })
  })
  const search = page.getByRole('searchbox', { name: '搜索词库' })
  for (const term of ['sub', 'strate', 'SUB', '衬底', '半导体']) {
    await search.fill(term)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByRole('article')).toContainText('substrate')
  }
  for (const term of ['ele', 'interference', '电磁', '干扰', '微波']) {
    await search.fill(term)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByRole('article')).toContainText('electromagnetic interference')
  }
  await search.fill('不存在')
  await expect(page.getByText('没有找到匹配的词条')).toBeVisible()
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
  await page.getByRole('button', { name: '编辑词条', exact: true }).click()
  await page.getByLabel('中文释义').fill('衬底；基板')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(card).toContainText('衬底；基板')
  await card.getByRole('button', { name: '标记已掌握' }).click()
  await expect(card).toHaveCount(0)
  await page.getByRole('group', { name: '学习状态筛选' }).getByRole('button', { name: '已掌握' }).click()
  await expect(card.getByText('已掌握', { exact: true })).toBeVisible()
  await card.getByRole('button', { name: '删除', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('此操作不可撤销')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: '删除', exact: true }).click()
  await page.getByRole('button', { name: '永久删除', exact: true }).click()
  await expect(card).toHaveCount(0)
})

test('仅真正打开详情时增加查看次数', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '＋ 添加词条' }).click()
  await page.getByLabel('英文词汇 / 短语').fill('substrate')
  await page.getByLabel('中文释义').fill('衬底')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByRole('searchbox').fill('sub')
  const card = page.getByRole('article', { name: 'substrate', exact: true })
  await expect(card).toContainText('查看 0 次')
  await card.getByRole('button', { name: 'substrate', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('1 次')
  await expect(page.getByRole('dialog')).not.toContainText('尚未查看')
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  await page.getByRole('searchbox').fill('strate')
  await expect(card).toContainText('查看 1 次')
  await page.reload()
  await expect(card).toContainText('查看 1 次')
})

test('字母、非字母和学习状态组合筛选', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const path = '/src/services/vocabularyService.ts'
    const { vocabularyService } = await import(path)
    for (const word of ['electromagnetic interference', 'electron mobility', '3D transistor']) {
      await vocabularyService.create({ word, meaning: '测试', note: '', status: 'learning' })
    }
    await vocabularyService.create({ word: 'substrate', meaning: '衬底', note: '', status: 'mastered' })
  })
  await page.getByRole('navigation', { name: '首字母筛选' }).getByRole('button', { name: 'E', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.getByRole('searchbox').fill('inter')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.getByRole('article')).toHaveCount(4)
  await page.getByRole('navigation').getByRole('button', { name: '#', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('3D transistor')
})
