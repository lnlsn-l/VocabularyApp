import { useEffect, useState } from 'react'
import type { VocabularyEntry } from '../types/vocabulary'
import { Modal } from './Modal'

interface Props { entry: VocabularyEntry; onClose: () => void; onEdit: () => void }
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString('zh-CN') : '尚未查看'

export function WordDetail({ entry, onClose, onEdit }: Props) {
  const [copyNotice, setCopyNotice] = useState('')
  const [copyError, setCopyError] = useState('')
  useEffect(() => {
    if (!copyNotice) return
    const timer = setTimeout(() => setCopyNotice(''), 2500)
    return () => clearTimeout(timer)
  }, [copyNotice])
  async function copy(value: string) {
    setCopyNotice(''); setCopyError('')
    try {
      if (!navigator.clipboard?.writeText) { setCopyError('当前浏览器不支持复制，请手动选择文本复制。'); return }
      await navigator.clipboard.writeText(value)
      setCopyNotice('已复制')
    } catch { setCopyError('复制失败，请检查浏览器剪贴板权限，或手动选择文本复制。') }
  }
  return <Modal title={entry.word} onClose={onClose}>
    <span className={`badge ${entry.status}`}>{entry.status === 'learning' ? '学习中' : '已掌握'}</span>
    <p className="detail-meaning">{entry.meaning}</p>
    <div className="copy-actions"><button onClick={() => void copy(entry.word)}>复制英文</button><button onClick={() => void copy(entry.meaning)}>复制中文释义</button></div>
    {copyNotice && <p role="status" className="notice">{copyNotice}</p>}
    {copyError && <p role="alert" className="form-error">{copyError}</p>}
    <div className="detail-note"><h3>备注</h3><p>{entry.note || '暂无备注'}</p></div>
    <dl className="detail-meta">
      <div><dt>查看次数</dt><dd>{entry.searchCount} 次</dd></div>
      <div><dt>最后查看</dt><dd>{dateLabel(entry.lastSearchedAt)}</dd></div>
      <div><dt>创建时间</dt><dd>{dateLabel(entry.createdAt)}</dd></div>
      <div><dt>修改时间</dt><dd>{dateLabel(entry.updatedAt)}</dd></div>
    </dl>
    <div className="modal-actions"><button onClick={onClose}>关闭</button><button className="primary" onClick={onEdit}>编辑词条</button></div>
  </Modal>
}
