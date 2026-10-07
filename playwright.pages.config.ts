import { defineConfig } from '@playwright/test'

// 线上验收复用同一套 UI 测试；只使用 Playwright 的隔离配置文件。
const deployedURL = process.env.VOCABULARY_PAGES_URL

export default defineConfig({
  testDir: './tests',
  testMatch: ['pages.spec.ts', 'stage2.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: deployedURL ?? 'http://localhost:5174/VocabularyApp/',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev', url: 'http://localhost:5173/',
      reuseExistingServer: false, timeout: 30000,
    },
    ...(!deployedURL ? [{
      command: 'npm run preview -- --port 5174', url: 'http://localhost:5174/VocabularyApp/',
      reuseExistingServer: false, timeout: 30000,
    }] : []),
  ],
})
