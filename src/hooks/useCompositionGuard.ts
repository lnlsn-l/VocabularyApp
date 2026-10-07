import { useState } from 'react'
import { createCompositionGuard } from '../utils/compositionGuard'

export function useCompositionGuard() {
  const [guard] = useState(() => createCompositionGuard())
  return guard
}
