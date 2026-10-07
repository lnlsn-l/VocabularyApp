import { useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SearchBar } from '../components/SearchBar'
import { AlphabetNav } from '../components/AlphabetNav'
import { StatusFilter } from '../components/StatusFilter'
import { WordForm } from '../components/WordForm'
import { WordList } from '../components/WordList'
import { WordDetail } from '../components/WordDetail'
import { BackupControls } from '../components/BackupControls'
import { DataNotice } from '../components/DataNotice'
import { FilterSummary } from '../components/FilterSummary'
import { useVocabulary } from '../hooks/useVocabulary'
import { vocabularyService } from '../services/vocabularyService'
import type { VocabularyEntry, VocabularyInput } from '../types/vocabulary'
import { errorMessage } from '../utils/validation'
import { filterEntries, type SortValue, type StatusFilterValue } from '../utils/search'

export function Home() {
  const { entries, loading, error, retry, attempt } = useVocabulary()
  const importInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<{ entry?: VocabularyEntry } | null>(null)
  const [deleting, setDeleting] = useState<VocabularyEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilterValue>('learning')
  const [letter, setLetter] = useState('all')
  const [sort, setSort] = useState<SortValue>('alphabet')
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = entries.find(entry => entry.id === detailId)
  const visible = filterEntries(entries, query, status, letter, sort)
  function clearFilters() { setQuery(''); setStatus('all'); setLetter('all') }

  async function run(action: () => Promise<void>, message: string) {
    if (busy) return false
    setBusy(true); setActionError('')
    try { await action(); setNotice(message); return true }
    catch (cause) { setActionError(errorMessage(cause)); return false }
    finally { setBusy(false) }
  }
  async function save(input: VocabularyInput) {
    if (form?.entry) await vocabularyService.update(form.entry.id, input)
    else await vocabularyService.create(input)
    setNotice('词条已保存到当前浏览器。')
  }
  async function remove() {
    if (deleting && await run(() => vocabularyService.remove(deleting.id), '词条已永久删除。')) setDeleting(null)
  }
  async function open(id: string) {
    if (await run(() => vocabularyService.recordView(id), '')) { setForm(null); setDetailId(id) }
  }

  return <main>
    <header className="page-header"><div><p className="eyebrow"><span className="brand-mark" aria-hidden="true">V</span> 个人专业词库</p><h1>Vocabulary</h1>
      <p className="subtitle">让每一次阅读，都成为下一次的积累。</p></div>
      <button className="primary" disabled={loading || !!error} onClick={() => setForm({})}>＋ 添加词条</button>
    </header>
    <div className="storage-row"><p className="storage-note">本地保存 · 当前浏览器的独立词库</p>
      <BackupControls disabled={loading || !!error || busy} onNotice={setNotice} inputRef={importInput} retryToken={attempt} /></div>
    <DataNotice />
    <SearchBar value={query} onChange={setQuery} />
    <div className="filter-row"><StatusFilter value={status} entries={entries} onChange={setStatus} />
      <button className="text-button" onClick={clearFilters}>清除筛选</button></div>
    <AlphabetNav value={letter} onChange={setLetter} />
    <div className="feedback" aria-live="polite">{notice && <p className="notice">{notice}</p>}</div>
    {(error || actionError) && <div className="error-banner" role="alert">{error || actionError}
      {error && <button onClick={retry}>重试</button>}
      {actionError && <button onClick={() => setActionError('')}>关闭提示</button>}
    </div>}
    <section aria-label="词库列表"><div className="list-header"><div><h2>我的词库</h2><span>{visible.length} / {entries.length} 个词条</span></div>
      <select aria-label="词条排序" value={sort} onChange={event => setSort(event.target.value as SortValue)}>
        <option value="alphabet">英文 A–Z</option><option value="created">最近添加</option>
        <option value="viewed">最近查看</option><option value="count">查看次数最多</option>
      </select></div>
      <FilterSummary query={query} status={status} letter={letter} sort={sort} count={visible.length}
        onQuery={() => setQuery('')} onStatus={() => setStatus('all')} onLetter={() => setLetter('all')} onClear={clearFilters} />
      {loading ? <p role="status">正在读取本地词库…</p> : !error && (visible.length ?
        <WordList entries={visible} busy={busy} onEdit={entry => setForm({ entry })} onDelete={entry => { setActionError(''); setDeleting(entry) }} onOpen={entry => void open(entry.id)}
          onStatus={entry => void run(() => vocabularyService.setStatus(entry.id, entry.status === 'learning' ? 'mastered' : 'learning'), '学习状态已更新。')} /> :
        <div className="empty-state"><span className="empty-icon" aria-hidden="true">{letter === 'all' ? 'Aa' : letter}</span>
          <h3>{entries.length ? '没有找到匹配的词条' : '从阅读中遇到的第一个词开始'}</h3><p>{entries.length ? '试试其他关键词，或清除字母和状态筛选。' : '添加英文词汇、术语或短语，写下属于你的中文释义。'}</p>
          <div className="empty-actions">{entries.length > 0 && <button onClick={clearFilters}>清除筛选</button>}
            <button className="primary" onClick={() => setForm({})}>{query.trim() ? `添加 “${query.trim()}”` : entries.length ? '添加词条' : '添加第一个词条'}</button>
            {!entries.length && <button onClick={() => importInput.current?.click()}>导入 JSON 备份</button>}
          </div>{!entries.length && <p>数据保存在当前浏览器。如果你之前使用过 VocabularyApp，可导入旧地址导出的 JSON 备份。</p>}</div>)}
    </section>
    <footer><span>为英文文献阅读而积累。</span><span>数据保存在此浏览器，请定期导出备份。</span></footer>
    {form && <WordForm key={form.entry?.id ?? 'new'} entry={form.entry} initialWord={query.trim()} onClose={() => setForm(null)} onSave={save} onExisting={id => void open(id)} />}
    {detail && <WordDetail entry={detail} onClose={() => setDetailId(null)} onEdit={() => { setDetailId(null); setForm({ entry: detail }) }} />}
    {deleting && <ConfirmDialog word={deleting.word} busy={busy} error={actionError} onClose={() => { setDeleting(null); setActionError('') }} onConfirm={() => void remove()} />}
  </main>
}
