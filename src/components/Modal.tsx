import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useCompositionGuard } from '../hooks/useCompositionGuard'

interface Props { title: string; onClose: () => void; children: ReactNode; busy?: boolean }

export function Modal({ title, onClose, children, busy = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const composition = useCompositionGuard()
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    dialog.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type="hidden"]), textarea')?.focus()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} aria-labelledby={titleId} onCompositionStart={composition.start} onCompositionEnd={composition.end}
    onKeyDownCapture={event => { if (event.key === 'Escape' && composition.blocked(event.nativeEvent)) event.preventDefault() }} onCancel={event => {
    event.preventDefault()
    if (!busy && !composition.blocked()) onClose()
  }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className="modal-header"><h2 id={titleId}>{title}</h2>
      <button type="button" className="icon-button" aria-label="关闭弹窗" onClick={onClose} disabled={busy}>×</button>
    </div>
    {children}
  </dialog>
}
