import { useEffect, useRef, useState } from 'react'
import { getTranslation, TranslationError, type TranslationResult } from '../services/translationService'

type State = { status: 'idle' | 'loading' | 'success' | 'empty' | 'error'; result?: TranslationResult; message?: string }
export function useTranslation(initial: string) {
  const [query, setQuery] = useState(initial)
  const [state, setState] = useState<State>({ status: 'idle' })
  const customized = useRef(false)
  const active = useRef<{ id: number; controller?: AbortController; query?: string }>({ id: 0 })
  const invalidate = () => {
    active.current.controller?.abort()
    active.current = { id: active.current.id + 1 }
    setState({ status: 'idle' })
  }
  useEffect(() => () => { active.current.id++; active.current.controller?.abort() }, [])
  return {
    query, state,
    changeQuery(value: string) { customized.current = true; invalidate(); setQuery(value) },
    changeWord(value: string) { invalidate(); if (!customized.current) setQuery(value) },
    reset() { invalidate(); customized.current = false; setQuery('') },
    cancel: invalidate,
    async request() {
      const actual = query.trim()
      if (active.current.controller && active.current.query === actual) return
      invalidate()
      const id = active.current.id
      const controller = new AbortController()
      active.current = { id, controller, query: actual }
      setState({ status: 'loading' })
      try {
        const result = await getTranslation(actual, controller.signal)
        if (active.current.id === id) setState({ status: 'success', result })
      } catch (error) {
        if (active.current.id === id && !controller.signal.aborted) setState({ status: error instanceof TranslationError && error.code === 'no_results' ? 'empty' : 'error',
          message: error instanceof Error ? error.message : '翻译服务暂不可用，可手动添加。' })
      } finally { if (active.current.id === id) active.current = { id } }
    },
  }
}
