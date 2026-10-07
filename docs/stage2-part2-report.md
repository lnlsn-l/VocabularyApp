# VocabularyApp 第二阶段第二部分完成报告

日期：2026-10-07（Asia/Shanghai）。正式规范：[VocabularyApp-Stage2-Part2-Requirements.md](VocabularyApp-Stage2-Part2-Requirements.md)。

**发布状态：第二阶段第二部分已完成。1.1.0 已上线，本地检查、GitHub Actions 和真实 HTTPS Chrome 验收全部通过，验收后创建并推送 v1.1.0。**

## 1. 版本、路径与提交关系

| 项目 | 结果 |
| --- | --- |
| 项目 | D:\VocabularyApp，继续原项目，无嵌套目录或重初始化 |
| 开发前 commit | f4a8c27617f8678889dcfecece565e1a1d565f11 |
| 应用发布 commit | 228799ad07547b0f8ad5df46dcd18a9da933a9a7 |
| 应用 package / lockfile 根版本 | 1.1.0 |
| Dexie schema | 2，由 1 无损迁移 |
| JSON backup format | 1，保持旧格式 |
| 分支、远端 | main，origin=https://github.com/lnlsn-l/VocabularyApp.git |
| 仓库、网站 | Public；https://lnlsn-l.github.io/VocabularyApp/ |
| 发布工作流 | [37575769883](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37575769883)，对应发布 commit |
| 发布 tag | v1.1.0，本地及远端均指向 228799ad07547b0f8ad5df46dcd18a9da933a9a7 |

三个功能批次依次为 0ab80ca（备份状态/提醒）、48940e1（导入预览）、038e8e4（筛选/录词效率）。228799a 完成文件边界测试、发布文档和版本。未新增 npm 依赖，未改写架构或部署 workflow。报告自身作为发布/标签后的独立 docs 提交补充实际发布证据，不改变已验收应用；其确切 hash 可从最终 git log 获取，不将其混同为应用发布 commit。

开发前完整阅读项目及历史文档、正式需求、背景摘要、锁文件、数据层、UI、测试和 Git 历史；用户新增的两份文档保留并提交。允许联网后 GitHub 身份可用，远端基线一致，v1.1.0 原先不存在。沙箱 Vite 子进程 EPERM 通过允许必要子进程的环境解决，没有改架构绕过。

## 2. 数据迁移与全部存储名称

保留 `VocabularyDB` 和 `vocabulary`，通过 Dexie version(2).upgrade 新增元数据。旧表、所有字段、UUID 与 normalizedWord 唯一约束不变，不删除、清空或重建用户库。fake-indexeddb 和真实 Chrome 分别创建 v1 数据后运行新版，逐字段校验 id、word、meaning、note、status、searchCount、createdAt、updatedAt、lastSearchedAt（及内部 normalizedWord）保留；再次写入同名词仍被唯一索引拒绝。

| 生产存储名称 | 用途 |
| --- | --- |
| VocabularyDB | 原有应用 IndexedDB，名称保持不变 |
| VocabularyDB / vocabulary | 个人词条；主键 id，唯一 normalizedWord，原索引保留 |
| VocabularyDB / vocabularyAppMetadata | 独立应用元数据表；主键 key |
| VocabularyDB / vocabularyAppMetadata / VocabularyApp.backupState | 唯一备份及提醒元数据记录 |
| localStorage | 无生产 key |
| sessionStorage | 无生产 key |
| 排序/搜索/状态/字母持久化 key | 无；UI 临时状态仅在 React 中 |
| Service Worker/CacheStorage | 未使用 |

元数据字段：key、dataRevision、contentRevision、lastExportedRevision、lastExportedContentRevision、lastExportRequestedAt、firstPendingContentAt、reminderDismissedUntil。新空库 revision 均 0；旧非空库 data/content revision 初始化为 1，已导出均 0，迁移时记录首次待导出起点，历史导出时间未知。初始化不把旧库误认为已备份，不紧急提醒新空库。

测试存储不进入生产：unit 使用原有 test-UUID 及 VocabularyApp.test-/VocabularyApp.import-test-UUID 专属数据库；浏览器测试用独立 Profile 内的 VocabularyDB。故障恢复 key 为 VocabularyApp.test.allow-storage。命名边界测试专门建立 OtherApp.test/settings/sentinel、OtherApp.settings（local）、OtherApp.session（session），验证新版加载、迁移和导出后仍原样保留。

生产代码没有 localStorage.clear、sessionStorage.clear、全局枚举/删除数据库或设置清理入口。命名空间防冲突/误清理，**不构成同 Origin 访问安全隔离**；github.io 下 URL path 也不隔离存储。localhost 与 Pages 仍通过用户主动 JSON 迁移，独立 Profile 各自保存词库。旧版本标签页可能需要刷新以重新加载新版 schema。

## 3. 备份状态、快照与提醒

词条写入与 revision 更新在同一 IndexedDB 读写事务中，失败整笔回滚；同库多连接事务保护并发修订，liveQuery 刷新多标签页词条与备份状态。读取失败有可读提示；主词库重试同时重新订阅备份状态，避免重复错误。

| 行为 | 数据 revision | 内容 revision |
| --- | --- | --- |
| 新增、实际编辑、实际状态变化、删除 | +1 | +1 |
| 合并导入新增至少一条 | 整笔 +1 | 整笔 +1 |
| 查看统计写入 | +1 | 不变 |
| 无变化保存/状态、纯读/搜索、预览/取消、复制、失败、零新增导入 | 不变 | 不变 |

searchCount/lastSearchedAt 仍只在真实打开详情时更新，并作为可备份数据计入变化；不改 updatedAt。内容 revision 是操作/事务次数，不表示新增/修改/删除词条各自数量；UI 只说明是否存在待导出变化。

导出在只读事务读取全库和修订号快照，JSON 序列化后发起原有 Blob 下载。只有下载请求未抛错才记录该快照 revision 与最近发起导出时间；之后的新写入保持待导出，并发较旧快照不能回退已导出 revision。下载请求失败不会伪造导出时间；下载已发起而 metadata 记录失败时单独提示实际状况。测试包含导出回调中并发新增、请求异常和 metadata 写入回滚。

导出保持 `vocabulary-backup-YYYY-MM-DD.json`，覆盖全库，排除 normalizedWord 和全部应用 metadata。只确认发起下载，不能确认目录、最终保存、文件未被删除或外部副本；统一提示“已发起 JSON 下载，请在浏览器下载列表中确认文件已保存”。通常位于浏览器下载目录，可由用户选择，不自动写入 backups。GitHub/Pages 不自动备份或同步个人词库。

提醒集中配置为：存在待导出数据，且有待导出内容操作，再满足“距最近发起导出／首次待导出满 14 天”或“累计 50 次内容操作”。统计写入计入数据但不累计内容阈值，纯统计变化不单独触发提醒；空库不提醒。从未导出的新/旧库用首次待导出起点，不猜历史时间。提醒非模态，不打断录词。稍后提醒持久化暂停 7 天；到期且条件仍成立才恢复。暂停不改变任何导出修订号或时间；新导出会清除暂停。

未实现可选 navigator.storage.persist()，没有浏览器持久存储申请或相关状态承诺。IndexedDB 仍可能因清理、Profile 删除或浏览器回收丢失，需保管外部 JSON。

## 4. 导入预览、差异与事务

流程：选择文件 → 解析/校验 → 只读快照分析 → 预览/查看差异/取消 → 确认时事务内重读与分析 → 过期则更新预览并再次确认 → 安全合并 → 实际结果。

保持 JSON v1、UTF-8 BOM、20 MB 上限和原字段校验。非法 JSON/外层/版本拒绝整文件；无效记录逐条跳过。预览保留文件名、exportedAt、版本、原始数量、有效数量（含重复）、当前全库、新增、重复、无效、重复差异子集及 ID 冲突数量。新增+重复+无效=原始数量，新增+重复=有效数量。重复互斥细分为文件首条有效记录与当前库同名、文件内同名的后续有效记录；即使已在当前库的词在文件里重复，也单独识别后续重复。

分析构建 normalizedWord→保留词条映射和 ID 集合，时间 O(n+m)，不逐条扫描全库。差异比较 meaning、note、status、searchCount、createdAt、updatedAt、lastSearchedAt；差异为重复的子集，每页 20 条展示双方字段及最终保留方。

当前库同名始终保留当前释义/备注/状态/统计/时间；新词保留首条有效备份元数据。不同词发生 ID 冲突在确认写入时分配 UUID，保护原记录。取消、查看差异、过期预览更新都不写词条、统计、时间或 revision。

确认在同一读写事务重读全库和 dataRevision，复用预览分析规则；任何 revision 变化都保守要求重确认，涵盖并发新增/修改/删除与查看统计。首次发现变化只刷新预览，用户第二次确认新版后才合并，避免读取与写入间竞态。整笔词条/metadata 失败回滚，零新增不增加修订；导入 JSON 不被认定为合并后全库已备份。真实双标签页 UI 验证此路径；unit 验证 ID 冲突、metadata/词条回滚及旧 JSON 兼容。

## 5. 日常效率、键盘和无障碍

无结果按原搜索文案预填英文，保留大小写并在保存时 trim；组合筛选隐藏已收录词时仍执行全库重复校验和“查看已有词条”。新增提供普通保存与保存并继续，继续成功后清空文本/错误、恢复学习中并聚焦英文；失败/重复不清空、不关闭。编辑没有继续按钮，提交期间防重复。

详情提供复制英文/中文释义。Chrome 中实际授权并读回剪贴板，内容正确；不支持、权限拒绝/异常注入有可读反馈，不影响后续编辑。成功提示 2.5 秒；未加入可选复制完整词条。

Ctrl+K / Meta+K 聚焦搜索且保留查询；弹窗与其他编辑输入保持当前焦点，不让默认浏览器动作跳到地址栏。不加入可选全局添加快捷键、不抢占 Ctrl+N。Windows Chrome 实测 Ctrl+K；Meta 分支有实现，未宣称 macOS 已实测。

表单原生 submit、快捷键与弹窗处理 compositionstart/end、isComposing、229 兼容标记及结束后 100 ms 的尾部保护。组合/选词 Enter 不误提交，正常非组合 Enter 保留；Esc 取消，组合中的 Esc 不关闭。原生 dialog 打开后明确聚焦首个输入；关闭使用原生焦点恢复。测试在 Chrome DOM 注入组合事件再发送真实 Enter，覆盖组合中、结束相邻顺序及恢复；**未驱动物理中文输入法候选窗口**。

筛选摘要准确显示当前条件，单项清除只影响对应条件；清除全部恢复全部状态/字母、清空搜索并保留排序。原四种稳定排序不变，说明指标和并列规则，0/1 结果提示无可见变化。无临时查询/筛选/排序持久化，刷新保持原默认学习中、全部字母、英文 A–Z；未实施可选排序偏好。

沿用原设计。1440px/360px 首页、预览差异、详情复制、连续表单/错误反馈检查通过；长内容换行，预览可滚动，核心操作不依赖快捷键。新按钮有可访问名称，取消/Esc 不导入或删除。

## 6. 本次测试、规模与验证边界

环境：Windows / Node 24.14.0 / npm 11.18.0 / Chrome 154.0.8037.98 / Vitest 5.0.3 / Playwright 1.63.0。所有数据用独立测试 Profile、专属 DB 和临时 JSON，不读取或修改用户日常词库。

| 实际检查 | 最终本地结果 |
| --- | --- |
| npm run lint | 通过 |
| npm test | 7 文件、36 项通过 |
| npm run build | TypeScript/Vite 通过 |
| npm run check:dist | 四个静态文件白名单及路径/常见凭据检查通过 |
| npm run test:e2e | 21 项开发 Chrome 通过 |
| npm run test:pages | 14 项生产子路径/迁移/stage2 通过 |
| VOCABULARY_PREVIEW_TEST=1 test:e2e | 18 项静态生产 UI 通过 |
| git diff --check、依赖/版本清单 | 通过，无新增依赖 |

原有 CRUD、确认删除、大小写去重、搜索/A–Z/#/四种排序、查看语义、浏览器进程重开与独立 Profile 隔离、JSON 实际下载/恢复/重复/非法及双向迁移均重新验证。新增覆盖快照外变更、并发修订/预览、暂停提醒、零新增、连续录词故障、剪贴板故障、存储权限恢复、命名边界、真实 v1 升级、BOM 与 20MB+1 拒绝；所有 stage2 用例检查 pageerror 与 console error。

基础规模验证使用程序化内存数据，包含状态/字母/备注组合筛选和导入重复差异分析：

| 词条数量 | 搜索/组合筛选 | 导入分析 |
| --- | --- | --- |
| 1000 | 1.27 ms | 2.53 ms |
| 5000 | 3.42 ms | 2.58 ms |
| 10000 | 4.42 ms | 6.88 ms |

这是一次 Node/Vitest 基础测量及正确性验证，非完整 DOM 万词渲染、专业 benchmark 或长期性能保证。初次回归的焦点/快捷键、统一错误恢复及 SVG 夹具触发 favicon.ico 404 已定位修复并复验；没有跳过失败或宽泛屏蔽应用错误。未重新执行漏洞审计，不引用历史 audit 为本次结论。

## 7. GitHub Actions、真实 Pages 与产物

已推送发布 commit 228799a，工作流 [37575769883](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37575769883)。保持原 Node24/npm ci、lint、unit、开发 E2E、build、生产/迁移 E2E、check:dist 和仅上传 dist 的门槛，最小权限和官方 Actions 固定 SHA 不变。

本次工作流 status=completed、conclusion=success，build/deploy 均 success。正式 Pages API 确认 build_type=workflow、https_enforced=true，html_url 正确。实际首页 HTTP 200，引用 `/VocabularyApp/assets/index-Cfib8dsn.js`、`index-BXDSx-BM.css` 和 favicon.svg，与本地构建一致。

在 `VOCABULARY_PAGES_URL=https://lnlsn-l.github.io/VocabularyApp/` 下执行 `npm run test:pages`，**14 项真实线上 Chrome 验收通过（24.1 秒）**，目标为 228799a：

1. 实际 HTTPS 页面、JS/CSS/favicon、样式、首次空库和数据说明正常，无相关 404、pageerror、console error 或第三方业务请求；无 Service Worker。
2. 原有 CRUD、搜索、A–Z/#、状态和四种排序正常；真实 1440px/360px 页面及新增预览、详情和表单截图检查通过。
3. 独立 Profile A 的词条在刷新、重开标签页、关闭整个浏览器进程并重开后保留；Profile B 同地址独立，不出现 A 的词条。
4. localhost 的临时三词库实际下载 JSON，导入 Pages 后所有业务字段一致；Pages 新增后导出回 localhost，按原规则合并/去重，元数据一致。没有迁移或读取个人日常词库。
5. 备份状态/全库导出/多标签页/刷新、预览只读取消与差异、另页变化后的重确认、连续成功/重复/失败、筛选/排序/Ctrl+K、IME 事件/Enter、实际剪贴板+拒绝/不支持、真实 v1 升级/其他应用哨兵、提醒暂停/下载失败、BOM/20MB+1 拒绝全部通过。

已下载 **本次 run 37575769883** 的 github-pages artifact，检查 artifact.tar 只有 index.html、favicon.svg、assets/index-Cfib8dsn.js、assets/index-BXDSx-BM.css 及目录；无链接、个人 JSON、IndexedDB、Profile、截图、测试输出、依赖或凭据。四文件 SHA256 逐项与本地验收 dist 一致。全部本地生成文件仍在 Git 忽略路径；已核查 Git 跟踪清单无被禁止目录，应用没有上传词库的代码。

## 8. 最终 Git 状态与已知限制

发布 main 与报告均成功推送。报告提交是发布之后的独立 docs 提交（`docs: record stage 2 part 2 verified release`），只补充本报告、实施记录与验收文档；应用/测试/版本与已验收 228799a 无差异，按原 workflow 的 paths-ignore 不重新部署。最终交付检查 main 与 origin/main 一致，工作区干净；报告提交自身 hash 由最终 git log 和交付消息给出。

v1.1.0 在本地检查、CI、线上 14 项验收及截图/产物核对通过后才创建并推送，是注释标签：tag 对象 `44f549f63ff3d50db365f1cde2c35333aaa8cce8`，本地及远端解析提交均为 `228799ad07547b0f8ad5df46dcd18a9da933a9a7`。没有移动或覆盖既有标签。正式网站保持发布版本，后续 docs 提交不混入新功能。

测试结束后已后台恢复原 `http://localhost:5173/` 开发入口并确认 HTTP 200。未访问日常浏览器 Profile 或清理网站数据。

未实施可选 persist、排序偏好、全局添加快捷键及复制完整词条，以保持范围集中。没有 PWA/Service Worker、自动云备份、账号、在线词典、标签/来源、AI/PDF 或同步；没有覆盖恢复。公开的是代码和网页，词库保存在个人浏览器。

未验证实际电脑重启、物理 IME 候选窗口、macOS Meta 快捷键、所有浏览器/手机、长期运行与完整一万条 DOM 渲染。IndexedDB/命名空间不提供永不丢失或同 Origin 身份隔离保证；JSON 下载不保证最终外部保存。个人词库迁移仍由用户主动导出/选择文件完成。

## 9. 下一阶段建议

等待用户审阅本报告后再确定范围。建议单独评估可选在线词典候选释义、专业标签/论文来源与原句，再按真实需要考虑 PWA 或云同步；保持手动专业释义与本地能力。以上均未开发，本阶段验收后停止新增功能。
