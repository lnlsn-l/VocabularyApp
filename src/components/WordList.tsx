import type { VocabularyEntry } from '../types/vocabulary'
import { WordCard } from './WordCard'

interface Props {
  entries: VocabularyEntry[]; busy: boolean
  onEdit: (entry: VocabularyEntry) => void
  onStatus: (entry: VocabularyEntry) => void
  onDelete: (entry: VocabularyEntry) => void
  onOpen: (entry: VocabularyEntry) => void
}
export function WordList({ entries, busy, onEdit, onStatus, onDelete, onOpen }: Props) {
  return <div className="word-list">{entries.map(entry => <WordCard key={entry.id} entry={entry} busy={busy}
    onEdit={() => onEdit(entry)} onStatus={() => onStatus(entry)} onDelete={() => onDelete(entry)} onOpen={() => onOpen(entry)} />)}</div>
}
