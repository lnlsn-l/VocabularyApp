import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // 开发保持原 Origin；生产构建与预览使用 Pages 项目子路径。
  base: command === 'build' || isPreview ? '/VocabularyApp/' : '/',
  server: { host: 'localhost', port: 5173, strictPort: true },
  preview: { host: 'localhost', port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts', 'proxy/**/*.test.mjs'], environment: 'node' },
}))
