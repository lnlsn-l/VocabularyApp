import type { VocabularyEntry } from '../types/vocabulary'

interface Props {
  entry: VocabularyEntry
  busy: boolean
  onEdit: () => void
  onStatus: () => void
  onDelete: () => void
  onOpen: () => void
}
export function WordCard({ entry, busy, onEdit, onStatus, onDelete, onOpen }: Props) {
  return <article className="word-card" aria-label={entry.word}>
    <div className="word-main"><h3><button className="word-title" onClick={onOpen} disabled={busy}>{entry.word}</button></h3><p className="meaning">{entry.meaning}</p>
      {entry.note && <p className="note-summary">{entry.note}</p>}
    </div>
    <div className="word-side"><span className={`badge ${entry.status}`}>{entry.status === 'learning' ? '学习中' : '已掌握'}</span>
      <span className="view-count">查看 {entry.searchCount} 次</span>
      <div className="word-actions"><button onClick={onEdit} disabled={busy}>编辑</button>
        <button onClick={onStatus} disabled={busy}>{entry.status === 'learning' ? '标记已掌握' : '重新学习'}</button>
        <button className="text-danger" onClick={onDelete} disabled={busy}>删除</button>
      </div>
    </div>
  </article>
}
