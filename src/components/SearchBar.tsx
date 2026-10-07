import { useEffect, useRef } from 'react'
import { useCompositionGuard } from '../hooks/useCompositionGuard'

interface Props { value: string; onChange: (value: string) => void }
export function SearchBar({ value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const composition = useCompositionGuard()
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k' || event.altKey || event.shiftKey) return
      // 已识别的应用组合在弹窗/编辑中保持焦点，避免浏览器转到地址栏。
      event.preventDefault()
      if (composition.blocked(event) || document.querySelector('dialog[open]')) return
      const target = event.target
      if (target instanceof HTMLElement && target !== input.current && (target.isContentEditable || target.matches('input, textarea, select'))) return
      input.current?.focus()
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [composition])
  return <div className="search-bar"><span aria-hidden="true" className="search-symbol">⌕</span>
    <input ref={input} type="search" aria-label="搜索词库" aria-keyshortcuts="Control+K Meta+K" value={value} placeholder="搜索单词、短语、中文释义或备注…"
      onCompositionStart={composition.start} onCompositionEnd={composition.end} onChange={event => onChange(event.target.value)} />
    <span className="search-shortcut">Ctrl / ⌘ + K</span>
    {value && <button className="text-button" onClick={() => onChange('')} aria-label="清空搜索">清空</button>}
  </div>
}
