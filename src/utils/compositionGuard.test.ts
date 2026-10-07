import { expect, it } from 'vitest'
import { createCompositionGuard } from './compositionGuard'

it('保护组合状态、原生标记、229 与 compositionend 附近 Enter，然后恢复', () => {
  let now = 1000
  const guard = createCompositionGuard(() => now)
  expect(guard.blocked()).toBe(false)
  expect(guard.blocked({ isComposing: true })).toBe(true)
  expect(guard.blocked({ keyCode: 229 })).toBe(true)
  guard.start(); expect(guard.blocked()).toBe(true)
  guard.end(); expect(guard.blocked()).toBe(true)
  now += 99; expect(guard.blocked()).toBe(true)
  now++; expect(guard.blocked()).toBe(false)
})
