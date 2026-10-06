interface Props { value: string; onChange: (value: string) => void }
export function SearchBar({ value, onChange }: Props) {
  return <div className="search-bar"><span aria-hidden="true" className="search-symbol">⌕</span>
    <input type="search" aria-label="搜索词库" value={value} placeholder="搜索单词、短语、中文释义或备注…" onChange={event => onChange(event.target.value)} />
    {value && <button className="text-button" onClick={() => onChange('')} aria-label="清空搜索">清空</button>}
  </div>
}
