import { Modal } from './Modal'

interface Props { word: string; busy: boolean; onClose: () => void; onConfirm: () => void }
export function ConfirmDialog({ word, busy, onClose, onConfirm }: Props) {
  return <Modal title="永久删除词条" onClose={onClose} busy={busy}>
    <p>确定永久删除 “{word}” 吗？</p><p className="muted">此操作不可撤销。建议先导出词库备份。</p>
    <div className="modal-actions"><button autoFocus onClick={onClose} disabled={busy}>取消</button>
      <button className="danger" onClick={onConfirm} disabled={busy}>{busy ? '删除中…' : '永久删除'}</button>
    </div>
  </Modal>
}
