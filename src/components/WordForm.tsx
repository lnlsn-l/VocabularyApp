import { useRef, useState, type SubmitEvent } from 'react'
import type { VocabularyEntry, VocabularyInput } from '../types/vocabulary'
import { errorMessage, VocabularyError } from '../utils/validation'
import { Modal } from './Modal'
import { useCompositionGuard } from '../hooks/useCompositionGuard'
import { useTranslation } from '../hooks/useTranslation'
import { TranslationReference } from './TranslationReference'

interface Props {
  entry?: VocabularyEntry
  initialWord?: string
  onClose: () => void
  onSave: (input: VocabularyInput) => Promise<void>
  onExisting: (id: string) => void
}

export function WordForm({ entry, initialWord = '', onClose, onSave, onExisting }: Props) {
  const [input, setInput] = useState<VocabularyInput>({
    word: entry?.word ?? initialWord, meaning: entry?.meaning ?? '',
    note: entry?.note ?? '', status: entry?.status ?? 'learning',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [existingId, setExistingId] = useState<string>()
  const [notice, setNotice] = useState('')
  const wordRef = useRef<HTMLInputElement>(null)
  const saving = useRef(false)
  const composition = useCompositionGuard()
  const translation = useTranslation(entry?.word ?? initialWord)
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current || composition.blocked()) return
    const keepOpen = !entry && (event.nativeEvent.submitter as HTMLButtonElement | null)?.value === 'continue'
    saving.current = true
    setBusy(true); setError(''); setExistingId(undefined); setNotice('')
    try {
      await onSave(input)
      if (keepOpen) {
        translation.reset()
        setInput({ word: '', meaning: '', note: '', status: 'learning' })
        setNotice('已保存，可以继续添加下一条。')
        requestAnimationFrame(() => wordRef.current?.focus())
      } else onClose()
    }
    catch (cause) {
      setError(errorMessage(cause))
      if (cause instanceof VocabularyError) setExistingId(cause.existingId)
    } finally { saving.current = false; setBusy(false) }
  }
  return <Modal title={entry ? '编辑词条' : '添加词条'} onClose={onClose} busy={busy}>
    <form onSubmit={submit} onCompositionStart={composition.start} onCompositionEnd={composition.end}
      onKeyDownCapture={event => { if (event.key === 'Enter' && composition.blocked(event.nativeEvent)) event.preventDefault() }}>
      <fieldset disabled={busy}>
        <label>英文词汇 / 短语 <span className="required">*</span>
          <input ref={wordRef} autoFocus required value={input.word} placeholder="例如 substrate" onChange={event => { translation.changeWord(event.target.value); setInput({ ...input, word: event.target.value }) }} />
        </label>
        <p className="translation-difference">{translation.query.trim() !== input.word.trim()
          ? '查询内容与英文词条不同；保存时仍使用英文框中的词条。'
          : '英文框用于保存词条；查询短语可独立修改，不会改写英文词条。'}</p>
        <TranslationReference translation={translation} meaning={input.meaning}
          onAdopt={meaning => setInput(current => ({ ...current, meaning }))} blocked={composition.blocked} />
        <label>中文释义 <span className="required">*</span>
          <textarea required rows={3} value={input.meaning} placeholder="输入在当前文献中的含义" onChange={event => setInput({ ...input, meaning: event.target.value })} />
        </label>
        <label>备注 <span className="optional">选填</span>
          <textarea rows={3} value={input.note} placeholder="使用语境、专业含义或阅读笔记" onChange={event => setInput({ ...input, note: event.target.value })} />
        </label>
        <label>状态
          <select value={input.status} onChange={event => setInput({ ...input, status: event.target.value as VocabularyInput['status'] })}>
            <option value="learning">学习中</option><option value="mastered">已掌握</option>
          </select>
        </label>
      </fieldset>
      {error && <div className="form-error" role="alert">{error}
        {existingId && <button type="button" className="text-button" onClick={() => onExisting(existingId)}>查看已有词条</button>}
      </div>}
      {notice && <p role="status" className="notice">{notice}</p>}
      <div className="modal-actions"><button type="button" onClick={onClose} disabled={busy}>取消</button>
        <button type="submit" className="primary" disabled={busy}>{busy ? '保存中…' : '保存'}</button>
        {!entry && <button type="submit" value="continue" disabled={busy}>保存并继续添加</button>}
      </div>
    </form>
  </Modal>
}
