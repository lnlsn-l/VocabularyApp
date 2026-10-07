import { useState } from 'react'
import type { useTranslation } from '../hooks/useTranslation'

interface Props { translation: ReturnType<typeof useTranslation>; meaning: string; onAdopt: (text: string) => void; blocked: () => boolean }
export function TranslationReference({ translation, meaning, onAdopt, blocked }: Props) {
  const [replacement, setReplacement] = useState<{ text: string; previous: string; result: typeof translation.state.result }>()
  const { query, state } = translation
  const adopt = (text: string) => {
    if (blocked()) return
    if (meaning.trim() && meaning !== text) setReplacement({ text, previous: meaning, result: state.result })
    else onAdopt(text)
  }
  return <section className="translation-reference" aria-label="有道翻译参考">
    <h3>有道翻译参考</h3>
    <label>查询词或短语
      <input value={query} placeholder="可补充论文语境，例如 silicon substrate" onChange={event => { setReplacement(undefined); translation.changeQuery(event.target.value) }} />
    </label>
    <p>仅主动获取时，将上面的查询文本发送到本站翻译代理并转交有道；双方可能获得请求相关网络信息。不会发送词库、中文释义或备注。</p>
    <div className="translation-actions"><button type="button" disabled={state.status === 'loading' || !query.trim() || Array.from(query.trim()).length > 200}
      onClick={() => { if (!blocked()) { setReplacement(undefined); void translation.request() } }}>{state.status === 'loading' ? '获取中…' : '获取翻译参考'}</button>
      {state.status === 'loading' && <button type="button" onClick={() => { setReplacement(undefined); translation.cancel() }}>取消查询</button>}</div>
    <p role="status" aria-live="polite">{state.status === 'loading' ? '正在获取翻译参考…' : state.message}</p>
    {state.result && <div>
      <p className="actual-query">实际查询：{state.result.query}</p>
      <p>专业含义可能不准确，请结合语境修改后保存。</p>
      <ul className="translation-results">{state.result.translations.map((text, index) => <li key={index}>
        <p>{text}</p><button type="button" onClick={() => adopt(text)}>采用此翻译{state.result!.translations.length > 1 ? ` ${index + 1}` : ''}</button>
      </li>)}</ul>
      {replacement && replacement.result === state.result && <div className="replacement" role="alert">
        <p>{meaning !== replacement.previous ? '中文释义又有修改，请取消后重新选择翻译。' : '采用将替换当前中文释义；英文和备注保持你的输入。'}</p>
        <button type="button" disabled={meaning !== replacement.previous} onClick={() => { if (!blocked()) { onAdopt(replacement.text); setReplacement(undefined) } }}>确认替换中文</button>
        <button type="button" onClick={() => setReplacement(undefined)}>取消替换</button>
      </div>}
    </div>}
    <p><a href="https://ai.youdao.com/" target="_blank" rel="noreferrer">来源：有道智云通用文本翻译</a> · 采用只填入中文框，请修订后点击保存。</p>
  </section>
}
