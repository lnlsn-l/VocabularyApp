import type { VocabularyEntry } from '../types/vocabulary'
import { Modal } from './Modal'

interface Props { entry: VocabularyEntry; onClose: () => void; onEdit: () => void }
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString('zh-CN') : '尚未查看'

export function WordDetail({ entry, onClose, onEdit }: Props) {
  return <Modal title={entry.word} onClose={onClose}>
    <span className={`badge ${entry.status}`}>{entry.status === 'learning' ? '学习中' : '已掌握'}</span>
    <p className="detail-meaning">{entry.meaning}</p>
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
