# Stage 2 Part 3 实施说明

日期：2026-10-07。package与锁文件为1.2.0，本地功能实现；正式代理尚未部署，线上未验收。开发规范为 [工作提示词](VocabularyApp-Stage2-Part3-Work-Prompt.md)，部署与费用交接见 [部署方案](stage2-part3-deployment-plan.md)，实际测试/提交状态见 [报告](stage2-part3-report.md)。

## 用户流程与实现

新增和编辑复用 WordForm：英文词条是保存字段，查询词/短语独立且初始同步英文；用户主动改过查询后保留其选择。英文再次变化会使旧结果失效。两者在界面分别标明，实际查询跟随成功模型显示。普通搜索、筛选、详情查看、编辑输入不自动调用网络。

useTranslation 管理 idle/loading/success/empty/error、AbortController及请求id；同步失效，阻止迟到结果覆盖、同查询重复请求。查询修改、英文变化、取消、组件关闭/卸载和连续新增成功都使旧请求候选失效。15秒客户端等待略长于代理12秒总预算/10秒上游预算。重试必须用户主动点击，不自动计费重试。

TranslationReference以React纯文本展示真实 translation 数组，每条一项，最多20项，不生成词性、例句或专业修补答案。署名与官方链接固定，不加载响应中的音频/页面。结果到达不填中文、不保存、不抢焦点。采用仅写入可编辑释义，已有不同中文需要确认替换且可取消；确认期间中文又变了则禁用确认、要求重新选择。英文/备注不被改写，来源不自动加备注。编辑保留已有释义/备注。始终允许不查询而手动保存。

保存仍经原 VocabularyService / Repository / 同事务业务+metadata；trim/lowercase全库去重、唯一约束、保存失败/无变化及多标签页规则未改。新增成功一次revision+1；查询/取消/采用到表单为纯内存，无revision或查看统计写入。保存并继续成功清空查询/词条/错误、学习中、聚焦英文；失败保留。查询按钮为type=button，沿用composition/isComposing/229/结束尾部100ms保护、Enter表单和Esc/Ctrl或Meta+K规则。

## 代理模块与接口

- `proxy/core.mjs`：固定HTTPS上游、有道v3 UTF-8签名、限制/超时、错误映射、响应提取、无secret透传。超过20字符按Unicode码点取前10+长度+后10，与Python字符计数一致。salt=随机UUID，curtime=UTC Unix秒。from=en/to=zh-CHS/strict=true，不传domain或其他服务参数。采用redirect=manual，并拒绝全部非2xx，不向新地址转发签名；workerd本地运行发现redirect=error不受支持后已修正。
- `proxy/quota.mjs`：SQL事务中同时检查日/月字符及每来源分钟请求数；成功预留后才允许上游，超限拒绝。限额非法或存储错误时失败关闭，不退化为无保护调用。
- `proxy/worker.mjs`：Cloudflare适配，所有入口共用一个SQLite DO。地址只来自可信CF-Connecting-IP，不读X-Forwarded-For。DO所有计数读/写在transactionSync中，无await并发穿透；alarm每日清理过期记录。
- `proxy/local.mjs`与node-storage：Node24 loopback HTTP适配，用socket地址与持久SQLite文件`.tools/proxy/quota.sqlite`，用于本地联调；重启不自动重置总量。仅限本地，不提供公网多实例保证。
- `src/services/translationService.ts`：仅接收稳定模型、额外客户端校验/响应字节限制、错误恢复和公开HTTPS代理地址；正式网页拒绝loopback地址，无隐式localhost回退。

`POST /translate`只接受application/json且仅有一个query字符串字段；额外url/headers/备注字段拒绝。成功HTTP200：

```json
{ "query": "实际 trim 后查询", "source": "youdao", "translations": ["中文参考"] }
```

错误仅有`{ "error": { "code": "稳定类别" } }`，不含原始上游、query、签名或异常详情。类别：invalid_request(400)、forbidden(403)、no_results(404)、not_configured(503)、network_error/upstream_failure(502)、timeout/cancelled(504)、rate_limited/quota_exceeded(429)。有道HTTP200的非零业务码也失败：401→额度，411/412→限流，应用/签名/IP等配置错误→未配置，其余→上游失败。数组结构异常拒绝，空/纯空白结果无结果。

## 限制与保存边界

| 项目 | 当前值与口径 |
| --- | --- |
| 查询 | trim后1–200个Unicode码点；空格和标点也计数，不为签名按字节截断 |
| 请求体 | UTF-8流式最多4KiB；Content-Length和实际流均检查，坏JSON/UTF-8拒绝 |
| 上游/客户端响应 | 200KiB字节上限，检查实际流；最多20项，不透传其他字段 |
| 超时 | 总代理12秒，上游10秒，客户端15秒；body等待/额度等待也有取消保护 |
| 日/月总量 | 建议5,000/100,000字符，全站共用，UTC自然日/月重置；配置未授权真实消费 |
| 短时来源 | UTC自然分钟每来源10次；分钟边界非滑动窗口 |
| 额度策略 | 调上游前原子预留；成功、失败、超时、预留后取消不返还，不自动重试 |

SQL仅`buckets(key,used,expires)`与过期索引；day/month总量、rate分钟+来源哈希。地址哈希以服务端Secret和UTC日加盐，不保存原始IP/查询；轮换Secret会重置来源分组但不重置全站日/月总量。短时记录下一分钟逻辑过期；日/月在边界过期。每次预留删除过期记录；alarm每日执行，即使无后续请求也清理（最多约1日残留，平台alarm延迟可能影响物理清理）。不存词库，应用自定义日志不记录请求/结果；平台访问元信息由平台政策决定。

客户端未新增localStorage/sessionStorage/CacheStorage/ServiceWorker/持久候选，只有原`VocabularyDB/vocabulary`、`VocabularyDB/vocabularyAppMetadata/VocabularyApp.backupState`。Dexie schema2、JSON version1、业务字段完全保留；没有迁移或访问日常用户Profile。query/source/translations和服务端配置不导出。IndexedDB的同Origin隔离规则不变，路径/命名空间不是身份安全隔离。

## 安全本地启动

无需密钥：直接`npm run dev`，翻译提示不可用，词库功能全部可用。仅测试代理：`npm run test:translation`（开发）或`npm run test:translation:preview`（生产子路径）。这些脚本使用独立Profile与合成上游，绝不请求有道。

真实本地接入仅在用户愿意消费额度且许可明确后：

1. 把`config.example.env`复制为项目根`.env.local`，仅保存公开地址`http://127.0.0.1:8787`。
2. 把`proxy/config.example.env`复制为`proxy/.env.local`；在本机编辑器内填写两项Secret，明确设置`TRANSLATION_ENABLED=true`和已授权限额。不要输入聊天，不要写到命令行参数、前端VITE变量或浏览器存储。
3. 两个终端分别`npm run dev:proxy`和`npm run dev`；使用`http://localhost:5173`，不要为调试换Origin而造成误认数据丢失。端口8787仅监听127.0.0.1；5173冲突须先关闭已知旧项目服务。

`.env*`、`.dev.vars*`、`.wrangler/`、`.tools/`、备份、Profile和测试输出被忽略，example文件不含真实值。生产仅平台Secret；Pages变量只有公开代理地址。

## 可复现验证

```powershell
npm ci
npm run lint
npm test
npm run test:proxy
npm run test:worker
npm run proxy:check
npm run test:e2e
npm run test:translation
npm run test:translation:preview
npm run build
npm run check:secrets
npm run check:dist
npm run test:pages
```

test:worker实际运行锁定Wrangler的workerd模拟器，固定出站拦截、不使用真实Secret，30并发/重启计数；与纯Node SQLite算法测试互补。check:secrets随机生成服务端哨兵，验证生产构建、输出和Git跟踪文件。生产翻译脚本在finally重建正常dist，避免测试8788地址成为交付产物。CI纳入上述核心/代理/runtime/翻译受控门槛，仍仅上传dist，最小Pages权限不变；CI无真实有道密钥。

测试覆盖/结果以报告实际运行证据为准。物理中文输入法、真实手机软键盘、实际Worker公网和有道计费链路需另外验证；历史两轮来源评估不重做，不宣称专业准确率。
