import { defineConfig } from '@playwright/test'

const preview = process.env.VOCABULARY_PREVIEW_TEST === '1'

export default defineConfig({
  testDir: './tests',
  testMatch: ['app.spec.ts', 'stage2.spec.ts', 'translation-unavailable.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  grep: preview ? /开发服务器|关闭整个浏览器|移动端表单|存储初始化|写入失败|JSON 下载|添加、重复|仅真正打开|第二阶段|翻译/ : undefined,
  use: { baseURL: preview ? 'http://localhost:5173/VocabularyApp/' : 'http://localhost:5173/', channel: 'chrome', trace: 'retain-on-failure' },
  webServer: {
    command: preview ? 'npm run preview' : 'npm run dev',
    url: preview ? 'http://localhost:5173/VocabularyApp/' : 'http://localhost:5173/',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
