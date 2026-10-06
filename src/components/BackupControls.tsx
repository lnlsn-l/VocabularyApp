import { useRef, useState } from 'react'
import { vocabularyService } from '../services/vocabularyService'
import { downloadBackup } from '../utils/backup'
import { errorMessage, VocabularyError } from '../utils/validation'

interface Props { disabled: boolean; onNotice: (message: string) => void }
export function BackupControls({ disabled, onNotice }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function perform(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }
  async function importFile(file?: File) {
    if (!file) return
    await perform(async () => {
      if (file.size > 20 * 1024 * 1024) throw new VocabularyError('备份超过 20 MB，请拆分为较小的备份文件后导入。')
      let text: string
      try { text = await file.text() }
      catch { throw new VocabularyError('无法读取所选文件，请重新选择可读取的 JSON 备份。') }
      const result = await vocabularyService.importJSON(text)
      onNotice(`成功导入：${result.imported}；重复跳过：${result.duplicates}；无效数据：${result.invalid}。`)
    })
  }
  return <div className="backup-controls">
    <div className="backup-buttons">
      <button disabled={disabled || busy} onClick={() => void perform(async () => {
        downloadBackup(await vocabularyService.exportJSON())
        onNotice('已导出词库。请将下载的 JSON 文件保存到 backups 目录或其他安全位置。')
      })}>导出词库</button>
      <button disabled={disabled || busy} onClick={() => ref.current?.click()}>{busy ? '处理中…' : '导入 JSON'}</button>
      <input ref={ref} type="file" hidden aria-label="选择 JSON 备份" accept=".json,application/json" disabled={disabled || busy}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file) }} />
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>
}
