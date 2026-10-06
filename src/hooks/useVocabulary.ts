import { useEffect, useState } from 'react'
import { vocabularyService } from '../services/vocabularyService'
import type { VocabularyEntry } from '../types/vocabulary'

export function useVocabulary() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => vocabularyService.subscribe(rows => {
    setEntries(rows)
    setLoading(false)
    setError('')
  }, message => { setError(message); setLoading(false) }), [attempt])

  function retry() { setLoading(true); setError(''); setAttempt(value => value + 1) }
  return { entries, loading, error, retry }
}
