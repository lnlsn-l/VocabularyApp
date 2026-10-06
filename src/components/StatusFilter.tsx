import type { VocabularyEntry } from '../types/vocabulary'
import type { StatusFilterValue } from '../utils/search'

interface Props { value: StatusFilterValue; entries: VocabularyEntry[]; onChange: (value: StatusFilterValue) => void }
export function StatusFilter({ value, entries, onChange }: Props) {
  const options: [StatusFilterValue, string][] = [['all', '全部'], ['learning', '学习中'], ['mastered', '已掌握']]
  return <div className="status-filter" role="group" aria-label="学习状态筛选">
    {options.map(([status, label]) => <button key={status} aria-pressed={value === status} onClick={() => onChange(status)}>
      {label} <span className="filter-count">{status === 'all' ? entries.length : entries.filter(row => row.status === status).length}</span>
    </button>)}
  </div>
}
