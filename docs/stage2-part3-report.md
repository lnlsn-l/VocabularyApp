# VocabularyApp Stage 2 Part 3 阶段交付报告

日期：2026-10-07（Asia/Shanghai）。规范：[完整工作提示词](VocabularyApp-Stage2-Part3-Work-Prompt.md)。

**本地实现、测试与部署准备已完成，远端CI全部验证门槛通过；正式代理尚未部署，1.2.0尚未线上验收或发布。** 用户已确认有道翻译参考＋可修改查询短语＋人工修订确认保存，按此范围实施，没有重新进行来源质量抽样，没有扩展第二来源、大模型、云同步或PWA。

## 1. 真实基线与版本

| 项目 | 实际状态 |
| --- | --- |
| 项目 | `D:\VocabularyApp`，继续原项目，无嵌套项目/重初始化 |
| 开始分支/commit | main / `4b2d710cefc76a4d181a9953d15f6ff4d74809fc` |
| 开始工作区 | `docs/project-context.md`修改；工作提示词、Part3规划和来源评估3份未跟踪文档 |
| 保留用户文档提交 | `37f7e8a`，保留提示词/规划/两轮评估，背景摘要保留历史内容并据实更新当前进展 |
| 实现分支 | `codex/stage2-part3`；已推送同名远端分支，main未合并 |
| 应用实现commit | `d15a04087cb337902d5dcd10027fd93894e1e157` |
| package / lock根版本 | 1.2.0，两者同步，未创建版本tag |
| Dexie / JSON版本 | schema2 / JSON version1，完全独立于package，无新增迁移 |
| 线上既有发布 | Part2的1.1.0；历史发布应用commit `228799a`，不作为本次翻译验收 |

报告及CI结果说明为实现提交之后的独立docs提交；只补充交付事实，不改变已测应用代码，不能当作正式release/tag提交。其hash可从最终Git历史中定位 `docs: record stage 2 part 3 verified preparation`。本次没有正式v1.2.0 tag、release或Worker部署version。

## 2. 完成的功能与保护

新增与编辑均有“有道翻译参考”。保存英文与查询文本分开，初始查询跟随英文；用户主动修改短语后保留选择，不自动附加语境或改英文。成功候选显示来源、实际查询和专业含义提示，按真实返回项展示。不存在样本正确答案、词性/例句生成、短语结果裁剪或假装词典义项。

查询不自动填中文。“采用此翻译”只写入中文框；不同已有中文需要明确替换确认，可取消，请求过程中及确认期间新编辑的内容受保护。英文、备注和学习状态不被候选改写。最后仍需点击保存/保存并继续。无网络、未配置或额度不足时可完整手动录词。

有idle/loading/success/empty/error、明确恢复提示、取消和请求id防迟到。改查询、改英文、关窗/卸载、取消及连续保存成功使旧候选失效；同查询进行中不重复发送、不自动重试计费。总代理12秒、上游10秒、客户端15秒。结果到达不抢焦点。组合输入、Enter/Esc、Ctrl/Meta+K沿用原防护；翻译按钮非submit，不引入额外快捷键。

查询/取消/展示/采用到表单/复制/失败恢复不写DB、不增加revision或查看统计。最终保存仍经过原Service/Repository，去除首尾空格、大小写归一化、全库去重、数据库唯一约束、业务/metadata同事务；成功一次revision+1，无变化/重复/失败不增。连续新增成功清空并聚焦英文，下一条无旧查询结果。多标签页唯一约束及liveQuery未改。

原备份快照、统计与内容提醒区分、导入只读预览/事务内重新分析/再次确认及JSON合并规则完全保留。新功能未修改任何词条字段、db/schema或备份序列化代码。

## 3. 代理、限额与密钥

实现模块和接口见 [stage2-part3.md](stage2-part3.md)。小型核心与Node/Cloudflare适配分开，前端仅依赖query/source/translations模型。固定HTTPS官方上游、POST表单、en→zh-CHS、strict=true、官方v3签名、随机UUID salt、UTC秒时间戳、UTF-8及短/长文本签名。Worker使用manual重定向且全部非2xx失败，避免向任何其他地址转交签名。

限制：trim后1–200 Unicode码点、4KiB请求体、200KiB上游与客户端响应、最多20项；空结果、异常结构/JSON、有道HTTP200业务错误、HTTP错误、网络、超时、限流、欠费、缺配置分别映射稳定错误，不透传原始响应/堆栈、签名或发音URL。应用无查询文本/结果日志。测试不仅比较算法，也实际运行Worker，发现并修复workerd不接受redirect=error这一兼容问题。

公开代理CORS明确Origin，正式默认`https://lnlsn-l.github.io`，本地`http://localhost:5173`；Pages路径不是Origin。CORS不防非浏览器滥用。正式适配从平台可信CF-Connecting-IP取来源，忽略X-Forwarded-For；来源按Secret+UTC日加盐SHA256后进入计数。

全站单个SQLite Durable Object，以`transactionSync`同时检查并预留全站UTC日/月字符量及来源分钟次数，存储失败时关闭调用；多实例不能各用内存计数。建议日5,000/月100,000字符、来源每自然分钟10次，尚未得到用户真实费用限额授权。预留不退款：成功、失败、超时及预留后取消都计入保守额度；没有自动重试。上游调用前被拒绝的不收费调用计数。

仅保存`buckets(key,used,expires)`：必要总量与短期哈希，不存原IP或词库/查询文本。每次预留清理过期记录，alarm每日扫除；逻辑过期按分钟/日/月边界，物理清理可能延后约1日及平台alarm延迟。运行时30并发在40字符上限仅13次×3字符=39字符放行，17次拒绝且不调上游；重启仍拒绝，未通过重启恢复额度。单元层200并发在100字符上限放行33次×3=99字符，验证月限额、限流、UTC重置/过期。

YOUDAO_APP_ID/SECRET仅配置在服务端，前端VITE变量只保存公开HTTPS代理根地址。真实值未读取、未写入文件/命令参数/聊天/浏览器存储。配置模板、Secret输入步骤和忽略清单齐全；`.env*`、`.dev.vars*`、`.wrangler/`、`.tools/`和真实备份/测试Profile均忽略。部署检查仅上传dist静态4文件，无代理、测试或用户词库。test:worker和代理测试随机哨兵秘密不进入响应/额度记录，check:secrets随机哨兵不进入前端产物、构建输出或Git跟踪文件；浏览器备份测试排除query候选/source/密钥/配置。

新增开发依赖Wrangler4.148.0，用于dry-run、workerd/SQLite真实运行时验证；运行依赖仍React/ReactDOM/Dexie。安装首次发现sharp间接依赖高风险漏洞，使用修复版override后`npm ci`及npm audit均零漏洞。Node24的SQLite目前给出实验性API提示，仅本地适配/测试使用；正式运行在Cloudflare SQLite DO，不依赖Node SQLite。

## 4. 本地测试通过

最终环境：Windows、Node24.14.0、npm11.18.0、Chrome154.0.8037.98、Vitest5.0.3、Playwright1.63.0。所有测试使用fake-indexeddb专用DB或独立Chrome Profile及合成词条，不读取/删除用户日常库。

| 实际命令/验收 | 最终结果 |
| --- | --- |
| npm ci | 通过，锁文件可重现，audit零漏洞 |
| npm run lint | 通过 |
| npm test | 9文件、71项通过（原36＋代理33＋客户端2） |
| npm run test:proxy | 33项通过，独立命令有效 |
| npm run test:worker | workerd+SQLite DO并发与重启、固定上游、Secret隔离通过 |
| npm run proxy:check | dry-run打包通过，11.76KiB/gzip3.93KiB，无远端部署 |
| npm run test:e2e | 22项开发Chrome通过 |
| npm run test:translation | 7项开发翻译通过，真实本地HTTP代理、合成上游 |
| npm run test:translation:preview | 7项生产/VocabularyApp/翻译通过，finally恢复正常dist |
| npm run build | TypeScript/Vite通过 |
| npm run check:secrets | 随机服务端秘密产物/构建输出/Git边界通过 |
| npm run check:dist | 4个静态文件白名单、生产子路径与常见凭据检查通过 |
| npm run test:pages | 14项本地生产迁移/回归通过，非真实线上 |
| VOCABULARY_PREVIEW_TEST=1 npm run test:e2e | 19项静态生产Chrome通过 |
| git diff --check/ignore/跟踪清单 | 通过，无dist/备份/.tools/Profile被跟踪 |
| 本地Node代理启动 | 关闭真实调用时POST/translate返回503+not_configured，通过 |
| 日常开发入口恢复 | 后台恢复http://localhost:5173/，HTTP200 |

代理覆盖：官方SHA256参考独立校验、短/长/Unicode签名、请求/响应限制、固定上游与拒绝重定向、CORS、精确JSON模型、HTTP200业务码、429/欠费、超时/取消/额度等待上限、无重试、失败保守预留、共享日/月/短时限额、缺少可信来源及存储失败不调用上游、Secret无透传。

新增浏览器覆盖：无结果预填、英文和短语分离、中文/备注保护、采用与修订、真实JSON下载并导入另一隔离Profile、查询/采用revision不变、成功一次写入、A迟于B/改词/取消/关窗/连续新增失效、错误和15秒实际客户端期限、不同标签页重复/保存故障、无变化编辑、未配置仍手填保存、HTML纯文本无第三方资源请求。成功流程不放宽console/pageerror检查；故障夹具仅允许该测试代理端点预期的Failed to load resource日志，其他错误仍失败。

原CRUD、大小写去重、搜索/字母/状态/四排序、详情次数、复制含故障、连续新增、备份快照/提醒、多标签页、导入预览/重新确认、BOM/20MB边界、v1数据库无损升级/唯一索引、旧JSON完整字段/双向跨Origin迁移、其他应用哨兵、浏览器进程重开与独立Profile均回归。规模1000/5000/10000原单元测试也随npm test执行；不推断完整DOM万词性能。

1440px/360px检查长查询、长结果、无水平溢出、弹窗和候选滚动、保存按钮可进入视口及英文/中文焦点保护；已实际查看自动截图。截图只含合成内容，保存在被忽略的`.tools/translation-tests/`。中文组合事件/Enter/Esc测试通过，**未驱动物理输入法候选窗口，未实测真实手机软键盘/所有浏览器或macOS Meta**。

## 5. CI、远端与线上状态

实现提交已推送独立分支并触发 [Actions 37639627358](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37639627358)，对应`d15a04087cb337902d5dcd10027fd93894e1e157`。已通过GitHub实时查询确认status=completed、conclusion=success，build job成功，完成于北京时间2026-10-07 22:50:08；依赖、lint、71项单元、workerd并发/重启、dry-run、22项开发浏览器、开发/生产各7项翻译、生产构建、秘密隔离、14项迁移与dist全部success。Pages artifact上传和deploy job均因分支门槛skipped，**不是新版部署成功**。工作流允许codex/**验证，main才允许既有发布，最小权限未放宽。真实有道Secret不进入CI，上游全部可控。

本次**没有新版本线上验收通过项**：正式Worker未创建/未配置Secret，真实Pages→代理→有道链路未执行。有道历史30/30、中位214ms及24/24、中位215ms仅保留为两轮本机来源评估，未当作新代理或专业质量验收。1.1.0的真实线上验收属于旧报告。

真实HTTPS现有Pages首页只读检查HTTP200，仍引用旧版`index-Cfib8dsn.js`、`index-BXDSx-BM.css`，与Part2发布资产记录一致；没有在该网站执行本次翻译功能验收或进入日常词库。最新远端查询main仍`4b2d710cefc76a4d181a9953d15f6ff4d74809fc`，已核对feature应用实现提交；v1.2.0远端不存在，既有v1.1.0注释tag对象`44f549f63ff3d50db365f1cde2c35333aaa8cce8`仍解析到`228799ad07547b0f8ad5df46dcd18a9da933a9a7`。未合并main、未触发新版Pages部署、未创建/覆盖任何正式tag。最终报告文档另commit并推送到同一分支，交付分支最新HEAD因此是报告commit，paths-ignore不重复部署；应用代码保持已验收实现提交。

## 6. 隐私与许可实际边界

词库依然只存浏览器IndexedDB。主动联网仅query文本及必要请求网络元信息；不上传中文、备注、词库ID、统计、整库、备份。不增加跟踪服务或持久缓存。没有localStorage/sessionStorage/CacheStorage新key，保留原`VocabularyDB/vocabulary`和`vocabularyAppMetadata/VocabularyApp.backupState`。路径和命名空间不构成Origin身份隔离；JSON下载只保证已发起，不确认最终落盘。

有道API、价格、Vite变量暴露、Workers/DO价格与国内网络说明已核对官方当前资料。完整有道条款读取成功后发现第9.2服务数据限制与第9.5生成输出权利说明需结合实际NMT账户适用规则；署名/声明不得擅自删除。实现候选署名和官方链接、纯文本原样展示、无持久候选，未断言无限修改/导出许可。正式开放前针对“人工修订个人保存及JSON备份是否须额外持久标识”向有道账户官方工单核对；若要求保存标识，先取得兼容方案，不能静默塞备注或改变JSON版本。具体可复制工单文案、引用条款及兼容选择均在部署方案中。

## 7. 仍待完成：集中交接

详见 [可执行部署方案](stage2-part3-deployment-plan.md)，仅需集中处理以下实际外部依赖：

1. 确认代理平台：推荐Cloudflare Free，授权创建一个Worker和一个SQLite DO；自行本机浏览器登录或平台设置Token，不要求发送聊天。用户实际网络到workers.dev及Worker到有道尚未验证，不能承诺国内可达/永久免费。
2. 本机/平台Secret配置：有道已有API应用绑定通用NMT，两项Secret在平台加密输入；核对账户余额、IP限制及上述结果保存/导出许可。没有搜索未知密钥位置或要求把密钥发送聊天。
3. 消费/限额授权：是否允许公开访问者使用站点所有者已有有道额度；确认保守日/月限额和预算，初验建议500/2,000字符，正常建议5,000/100,000。通用中英48元/百万字符时100,000字符约4.8元，仅估算，不保证账单。平台免费/计数资源配额、来源分散滥用与全站耗尽、其他账户消费不受本代理保护已说明。没有充值、资源包、自动充值、域名或付费计划动作。

以上到位后，按已有部署文件部署关闭的Worker→加Secret→设置授权限额/开启→设置Pages公开地址→合并并运行Pages CI→实际HTTPS隔离Profile验收（含错误恢复/JSON往返/客户端密钥边界）→验收后才创建推送注释v1.2.0。代码和本地验证已完成，不需要重新来源试查或重做架构。

本报告是**部署前阶段交付**，不是“Part3全部完成”的正式发布报告。真实公网/付费链路、实际手机/物理IME、账单与服务许可的账户确认均不得由mock通过替代。新的平台资源与费用尚待上述具体授权。
