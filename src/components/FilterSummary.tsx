import type { SortValue, StatusFilterValue } from '../utils/search'

interface Props {
  query: string; status: StatusFilterValue; letter: string; sort: SortValue; count: number
  onQuery: () => void; onStatus: () => void; onLetter: () => void; onClear: () => void
}
const sortRules: Record<SortValue, string> = {
  alphabet: '按英文名称排序，忽略大小写差异。', created: '创建时间从新到旧。',
  viewed: '最后打开详情时间从新到旧，未查看记录靠后。', count: '打开详情次数从多到少。',
}
export function FilterSummary({ query, status, letter, sort, count, onQuery, onStatus, onLetter, onClear }: Props) {
  const active = query.trim() || status !== 'all' || letter !== 'all'
  return <div className="filter-summary">
    <div aria-label="当前筛选" className="filter-tags"><span>当前筛选：</span>
      {status !== 'all' && <button aria-label="清除状态筛选" onClick={onStatus}>{status === 'learning' ? '学习中' : '已掌握'} ×</button>}
      {letter !== 'all' && <button aria-label="清除字母筛选" onClick={onLetter}>{letter} ×</button>}
      {query.trim() && <button aria-label="清除搜索筛选" onClick={onQuery}>{query.trim()} ×</button>}
      {active ? <button className="text-button" onClick={onClear}>清除全部</button> : <span>全部词条</span>}
    </div>
    <details className="sort-help"><summary>排序说明</summary><p>{sortRules[sort]}指标相同时按英文名称和稳定 ID 排序。</p></details>
    {count < 2 && <p className="small-results">当前结果少于 2 条，排序不会产生可见变化。</p>}
  </div>
}
