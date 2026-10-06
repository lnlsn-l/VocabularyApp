import { useState, type SubmitEvent } from 'react'
import type { VocabularyEntry, VocabularyInput } from '../types/vocabulary'
import { errorMessage, VocabularyError } from '../utils/validation'
import { Modal } from './Modal'

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
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setExistingId(undefined)
    try { await onSave(input); onClose() }
    catch (cause) {
      setError(errorMessage(cause))
      if (cause instanceof VocabularyError) setExistingId(cause.existingId)
    } finally { setBusy(false) }
  }
  return <Modal title={entry ? '编辑词条' : '添加词条'} onClose={onClose} busy={busy}>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>英文词汇 / 短语 <span className="required">*</span>
          <input autoFocus required value={input.word} placeholder="例如 substrate" onChange={event => setInput({ ...input, word: event.target.value })} />
        </label>
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
      <div className="modal-actions"><button type="button" onClick={onClose} disabled={busy}>取消</button>
        <button type="submit" className="primary" disabled={busy}>{busy ? '保存中…' : '保存'}</button>
      </div>
    </form>
  </Modal>
}
