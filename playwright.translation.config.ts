import { defineConfig } from '@playwright/test'
const preview = process.env.VOCABULARY_PREVIEW_TEST === '1'
export default defineConfig({
  testDir: './tests', testMatch: ['translation.spec.ts'], outputDir: '.tools/translation-tests', workers: 1, reporter: 'list',
  use: { baseURL: preview ? 'http://localhost:5173/VocabularyApp/' : 'http://localhost:5173/', channel: 'chrome', trace: 'retain-on-failure' },
  webServer: [
    { command: preview ? 'npm run preview' : 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: false,
      env: { VITE_TRANSLATION_API_BASE_URL: 'http://127.0.0.1:8788' } },
    { command: 'node tests/translation-proxy-fixture.mjs', url: 'http://127.0.0.1:8788', reuseExistingServer: false },
  ],
})
