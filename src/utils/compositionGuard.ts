// compositionend 与选词 Enter 在部分浏览器中相邻；短暂保护尾部事件。
export function createCompositionGuard(now = () => performance.now()) {
  let composing = false
  let endedAt = -Infinity
  return {
    start: () => { composing = true },
    end: () => { composing = false; endedAt = now() },
    blocked: (event?: { isComposing?: boolean; keyCode?: number }) => composing
      || !!event?.isComposing || event?.keyCode === 229 || now() - endedAt < 100,
  }
}
