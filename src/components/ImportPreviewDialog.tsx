import { useState } from 'react'
import type { ParsedBackup } from '../utils/backup'
import type { ImportPreview, ConfirmImportResult } from '../utils/importAnalysis'
import { errorMessage } from '../utils/validation'
import { Modal } from './Modal'

interface Props {
  fileName: string
  document: ParsedBackup
  initialPreview: ImportPreview
  onClose: () => void
  onConfirm: (revision: number) => Promise<ConfirmImportResult>
  onImported: (message: string) => void
}
const labels = { meaning: '中文释义', note: '备注', status: '状态', searchCount: '查看次数', createdAt: '创建时间', updatedAt: '修改时间', lastSearchedAt: '最后查看' }
function valueLabel(value: unknown) {
  return value === 'learning' ? '学习中' : value === 'mastered' ? '已掌握' : value === undefined || value === '' ? '（空）' : String(value)
}

export function ImportPreviewDialog({ fileName, document, initialPreview, onClose, onConfirm, onImported }: Props) {
  const [preview, setPreview] = useState(initialPreview)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)
  const [page, setPage] = useState(0)
  const { analysis } = preview
  async function confirm() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await onConfirm(preview.revision)
      if (response.changed) { setPreview(response.preview); setChanged(true); setPage(0) }
      else {
        onImported(`成功导入：${response.result.imported}；重复跳过：${response.result.duplicates}；无效数据：${response.result.invalid}。`)
        onClose()
      }
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }
  return <Modal title="导入预览" onClose={onClose} busy={busy}>
    <p className="preview-file">文件：{fileName}</p>
    <p className="muted">备份导出时间：{new Date(document.exportedAt).toLocaleString('zh-CN')} · JSON 版本：{document.version}</p>
    <dl className="preview-stats">
      <div><dt>文件原始记录</dt><dd>{analysis.rawTotal}</dd></div>
      <div><dt>有效记录（包含重复）</dt><dd>{analysis.validTotal}</dd></div>
      <div><dt>当前词库总数</dt><dd>{analysis.currentTotal}</dd></div>
      <div><dt>预计新增</dt><dd>{analysis.imported}</dd></div>
      <div><dt>预计重复</dt><dd>{analysis.duplicates}</dd></div>
      <div><dt>预计无效</dt><dd>{analysis.invalid}</dd></div>
    </dl>
    <p className="muted">重复细分：文件首条有效记录与当前库同名 {analysis.existingDuplicates}，文件内同名的后续有效记录 {analysis.fileDuplicates}。重复中存在差异 {analysis.differences.length} 条（重复的子集）。ID 冲突 {analysis.idConflicts} 条，将分配新 ID。</p>
    <p>同名词保留当前词库版本，不覆盖。文件内新词重复时保留首条有效记录。选择、查看或取消预览不会写入词库。</p>
    {analysis.differences.length > 0 && <details className="import-differences">
      <summary>查看重复词差异（{analysis.differences.length}）</summary>
      {analysis.differences.slice(page * 20, (page + 1) * 20).map((difference, index) => <section className="import-difference" key={page * 20 + index}>
        <h3>{difference.word}</h3><p>处理：保留{difference.source === 'current' ? '当前词库版本' : '文件内首条有效新词'}。</p>
        {difference.fields.map(field => <div key={field} className="difference-field">
          <strong>{labels[field]}</strong>
          <p>{difference.source === 'current' ? '当前词库' : '首条新词'}：{valueLabel(difference.retained[field])}</p>
          <p>备份文件：{valueLabel(difference.incoming[field])}</p>
        </div>)}
      </section>)}
      <div className="difference-pagination">
        <button disabled={page === 0 || busy} onClick={() => setPage(page - 1)}>上一页差异</button>
        <span>第 {page + 1} / {Math.ceil(analysis.differences.length / 20)} 页</span>
        <button disabled={(page + 1) * 20 >= analysis.differences.length || busy} onClick={() => setPage(page + 1)}>下一页差异</button>
      </div>
    </details>}
    {changed && <p role="status" className="notice">词库在预览后发生变化，已更新预览，本次未写入。请核对后再次确认合并。</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="modal-actions"><button disabled={busy} onClick={onClose}>取消</button><button className="primary" disabled={busy} onClick={() => void confirm()}>{busy ? '合并中…' : '确认合并'}</button></div>
  </Modal>
}
