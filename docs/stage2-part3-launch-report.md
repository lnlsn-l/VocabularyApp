# Stage 2 Part 3 B：代理部署与真实联调记录

日期：2026-10-08（Asia/Shanghai）。本文件按执行顺序保留关闭部署、用户配置 Secret、真实联调与正式发布记录。**1.2.0 已发布 GitHub Pages，正式网页验收通过，注释标签 v1.2.0 已创建并推送。** 原 [开发交付报告](stage2-part3-report.md) 保留为部署前历史证据。

当前状态：两项 Secret 已设置；云端翻译已按新授权开启，限额固定为每日 500 字符、每月 2,000 字符、每来源每自然分钟 10 次，正式 Origin 仅允许 `https://lnlsn-l.github.io`。首次部署的关闭/空 Secret 状态及 version 保留为历史记录，最新版本和证据见文末真实联调记录。

## 授权与项目基线

用户已完成 Cloudflare 注册及 Wrangler 登录，并明确授权：在 Cloudflare Free 范围内使用项目现有配置创建一个 Worker 和 SQLite Durable Object，保持 `TRANSLATION_ENABLED=false`。本次不调用有道、不设置真实 Secret、不合并 main、不发布新版 Pages、不启用付费套餐。

已完整读取 [审阅与上线计划](stage2-part3-review-and-launch-plan.md)、[原开发规范](VocabularyApp-Stage2-Part3-Work-Prompt.md) 和 [部署准备方案](stage2-part3-deployment-plan.md)。实际分支为 `codex/stage2-part3`，HEAD 为 `4788bbc6d50ce9008ba0c1a2822d76ae90eb635b`；应用实现提交为 `d15a04087cb337902d5dcd10027fd93894e1e157`。开始时的 `docs/project-context.md` 修改和未提交的审阅计划均保留。

## 实际部署结果

| 项目 | 结果 |
| --- | --- |
| Worker | `vocabularyapp-translation`，部署前查询同名 Worker 返回不存在（10007），本次新建成功 |
| 公开根地址 | https://vocabularyapp-translation.vocabulary-app.workers.dev |
| 查询接口 | `POST https://vocabularyapp-translation.vocabulary-app.workers.dev/translate` |
| 配置 | 未修改 `proxy/wrangler.jsonc`；Wrangler 4.148.0 |
| Worker version | `a157dd24-1922-4e2a-ba46-f7013083ece5` |
| 创建时间 | 2026-10-08 00:43:49.883 +08:00（UTC 2026-10-07T16:43:49.883Z） |
| 实际流量 | `wrangler deployments list` 确认该版本占 100% |
| 开关 | 部署输出及远端 `versions view` 均为 `TRANSLATION_ENABLED="false"` |
| Origin | `https://lnlsn-l.github.io`；未加入开发 Origin 或通配符 |
| SQLite DO | `TranslationQuota` 类、SQLite migration `v1` 与 `TRANSLATION_QUOTA` 绑定随 Worker 部署；稳定对象名仍是 `VocabularyApp-global-v1` |
| Secret | 远端 `wrangler secret list` 返回 `[]`；没有设置真实或占位 Secret |
| 日/月配置 | 保留 5,000 / 100,000 字符，每来源每自然分钟 10 次；关闭期间不预留额度。这些值不代表用户已授权消费或启用额度 |
| 日志 | 配置中 observability 关闭；本次 Wrangler 命令设置 `WRANGLER_SEND_METRICS=false` |

部署命令退出码为 0，上传 11.76 KiB、gzip 3.93 KiB，平台报告启动耗时 1 ms。Wrangler 同时注册了必要的免费 `vocabulary-app.workers.dev` 子域；没有购买域名、创建第二份 Worker、启用 Paid 或调用订阅升级操作。未独立读取账户账单/订阅页面；本记录不替代账户控制台的 Free 状态显示。[Cloudflare 官方文档](https://developers.cloudflare.com/durable-objects/platform/pricing/)确认 Workers Free 支持 SQLite DO。

关闭分支在签名、DO 额度预留和固定有道上游请求之前返回。SQLite 类及绑定的部署成功与线上计数实例运行是两项证据：当前关闭请求不会实例化或调用共享计数对象，**线上 SQLite 预留、持久化与 Worker→有道链路仍未验证**；没有为检查而绕过开关、重置计数或增加调试接口。

## 本地验证通过

- `npm run test:proxy`：1 个文件、33 项测试通过，包含关闭开关阻止上游的可控检查。
- `npm run test:worker`：实际本地 workerd/SQLite DO 通过；30 并发接近额度边界时只预留 39/40 字符，重启计数保留、固定上游及 Secret 隔离通过。此测试使用合成 Secret 和受控上游，不是实际有道请求。
- `npm run proxy:check`：dry-run 打包通过，输出关闭开关、预期 DO 和白名单。

本次没有修改应用代码或重跑无关前端全套测试；历史完整开发/CI 证据见原报告。

## 关闭状态线上网络检查

测试在这台用户电脑的当前网络执行，使用独立 Chrome 测试 Profile；不读取日常词库。真实加载已有 Pages URL，再从其实际 `https://lnlsn-l.github.io` Origin 执行合成查询 `silicon substrate` 的浏览器 fetch。没有修改线上应用脚本、配置 GitHub 变量或点击新版入口。这是关闭代理的网络检查，不是正式应用按钮验收。

最终一次检查时间为 2026-10-08 00:47:53 +08:00，8 项浏览器断言通过：

| 检查 | 实际结果 |
| --- | --- |
| 允许 Origin 的三个合法 POST | 均 HTTP 503，响应均为 `{"error":{"code":"not_configured"}}`；耗时 319 / 105 / 105 ms |
| 浏览器自动 OPTIONS 预检 | HTTP 204；允许 Origin 精确匹配 Pages，方法 POST、请求头 Content-Type |
| CORS / 缓存 | 允许请求含正确 `Access-Control-Allow-Origin`、`Cache-Control: no-store` 和 `Vary: Origin` |
| 非白名单 Origin | 浏览器禁止读取响应，CDP 报告 `MissingAllowOriginHeader`；未取得该拒绝响应的精确 HTTP 状态，不报告为实测 403 |
| 无 Origin 的直接导航 | HTTP 403，`forbidden` |
| 允许 Origin 的根路径 GET | HTTP 404，`invalid_request`；根地址没有健康检查接口，属于预期结果 |

为核对自动预检的实际状态，临时验证脚本补充了 Chrome CDP 记录。早期脚本因普通 Playwright response 事件不显示预检，以及 Chrome 报告的 CORS 错误名称不同而出现断言失败；修正的是观测脚本，未修改 Worker。四轮浏览器检查共观察到 12 个合法关闭 POST 均返回预期 503；中间一轮首个 POST 耗时约 5.6 秒，因此不承诺长期延迟稳定。临时脚本和不含 Secret/IP 的 JSON 在被忽略的 `.tools` 内，不进入 Git 或 Pages。

**命令行网络路径没有通过。** PowerShell HTTPS 请求在 TLS 阶段失败；DNS 可以解析，但 Node/Playwright APIRequestContext 收到的证书 SAN 属于 `facebook.com` 等域名，与代理域名不匹配。独立 Chrome 导航及页面 fetch 使用另一条浏览器网络路径可以成功，可能涉及 DNS 或代理路径差异，具体原因尚未确认。没有修改系统 DNS、代理、hosts，没有关闭证书校验，也没有使用公共转发服务。不能将浏览器通过写成所有网络可达；实际手机、另一条网络及用户日常浏览器仍未覆盖。

本次没有向有道发出请求。关闭开关和空 Secret 已由远端配置证据确认，实际浏览器返回关闭类别，代理代码在这条分支不会签名、请求 DO 或调用上游。本记录未查询有道账户账单。

## Pages / 发布状态未变化

实际公开 Pages 仍 HTTP 200，引用旧资产 `index-Cfib8dsn.js`、`index-BXDSx-BM.css`，与此前 1.1.0 一致。只读 `git ls-remote` 确认远端 main 为 `4b2d710cefc76a4d181a9953d15f6ff4d74809fc`，没有 `v1.2.0`。本次没有合并、推送、触发新版 Pages 发布或创建标签；本地 HEAD 未改变。

## 用户自行设置有道 Secret

可以在保持关闭的 Worker 上配置 Secret，不需先启用翻译。两项均使用 Cloudflare 加密 Secret，不能填入普通 Variables、GitHub Pages 变量或聊天：

- `YOUDAO_APP_ID`：有道通用 NMT 应用的应用 ID，不是 Cloudflare 账户 ID。
- `YOUDAO_APP_SECRET`：同一有道应用的应用密钥，不是 Cloudflare Token。

从用户自己的交互式 PowerShell 执行以下命令，在各自的 Secret 提示中输入真实值，不把值追加到命令或保存到项目文件：

```powershell
Set-Location -LiteralPath 'D:\VocabularyApp'
$env:WRANGLER_SEND_METRICS = 'false'
npx wrangler secret put YOUDAO_APP_ID --config proxy/wrangler.jsonc
npx wrangler secret put YOUDAO_APP_SECRET --config proxy/wrangler.jsonc
npx wrangler secret list --config proxy/wrangler.jsonc
```

`secret list` 只列名称及类型，不显示值。也可在 Cloudflare Dashboard → Workers & Pages → `vocabularyapp-translation` → Settings → Variables and Secrets 中添加这两个名称，类型选择 **Secret** 并保存/部署。参见 [Wrangler Secret 命令](https://developers.cloudflare.com/workers/wrangler/commands/#secret-put)。不要改动 `TRANSLATION_ENABLED=false`；配置完成只需告知“两项 Secret 已设置”，不提供值、含值截图或 Token。

Secret 更新可能产生新的 Worker version，下一次联调需重新记录生效版本。本次记录的 version 是尚无 Secret 的关闭部署版本。

## 关闭部署完成时的待办（历史状态）

1. 用户自行设置两项 Secret，核对有道 NMT 应用服务、剩余额度、出口限制及人工修订/保存/JSON 导出的账户适用规则。
2. 核对用户日常浏览器可达性，并排查命令行证书路径差异；补充实际手机或另一网络时单独记录结果。
3. 获得明确的少量有道调用消费授权和日/月限额确认。首次建议 500 字符/日、2,000 字符/月；当前较大配置不能直接作为已获授权额度启用。
4. 之后才按上线计划低额度开启、验证真实 Worker→有道、人工采用/修订/保存和错误恢复。临时本地 Origin 也只在需要时明确加入。
5. 真实联调及发布获授权后，再设置公开 Pages 代理地址、合并 main、完成实际 Pages 验收与最终标签。本次没有推进这些步骤。

本阶段交付结论：**关闭状态 Worker 部署成功，当前电脑的独立 Chrome 路径通过关闭接口网络检查；命令行 TLS 路径失败，真实翻译和新版 Pages 验收仍待完成。**

## 补记：用户配置 Secret 后的只读复核（开启前）

用户提供的 `wrangler secret list` 输出显示 `YOUDAO_APP_ID` 与 `YOUDAO_APP_SECRET` 均为 `secret_text`。代理收到两次 Secret Change 部署后，最后一条部署记录对应的当前 100% 流量版本为 `1d3ae90f-1ecc-4305-a7b8-0995203a0497`，创建时间为 2026-10-08 00:54:53.764 +08:00（UTC 2026-10-07T16:54:53.764Z）。

只读 `wrangler versions view` 再次确认：

- 两项 Secret 名称存在，不读取或记录其值；存在不等于密钥有效、NMT 服务开通或余额充足，尚未真实调用验证。
- `TRANSLATION_ENABLED` 仍为 `false`，Origin 仍仅允许 Pages，SQLite DO 绑定及原日/月配置保持不变。
- 本次复核没有写入 Secret、重新部署、消费有道额度、改动 main 或发布 Pages，也未将首次关闭接口网络结果重新标记为此新版本的实测结果。

当前剩余步骤收敛为：先获得真实调用与限额的明确授权，再把配置降至已授权验收档并联调。设置 Secret 本身不能替代用户此前“先不调用有道”的限制；未获得新授权前继续保持关闭。

## 小额度真实联调：授权与执行顺序

用户随后明确同意公开代理共享现有有道额度，并要求先确认每日 500 字符、每月 2,000 字符、每来源每分钟 10 次生效，再开启并仅先执行 `silicon substrate` 与 `bias voltage`。授权包含真实返回、浏览器跨域、候选采用、人工修订和保存验证；不包括提高限额、充值、Paid、合并 main 或发布新版 Pages。

配置的唯一来源为仓库 `proxy/wrangler.jsonc`。三个部署都保留现有 SQLite migration、类、binding 和对象名；没有复制 Worker、建立第二套计数、删除数据库或重置额度：

| 阶段 | Worker version | 北京时间 | 实际配置 / 结果 |
| --- | --- | --- | --- |
| 先部署验收档，仍关闭 | `be02943b-282e-4f7d-910a-eb05fee3aaa0` | 01:00:37 | 500 / 2,000 / 10，开关 false；远端 version 和 100% 流量核对后，本地 Origin 合法 POST 返回关闭 503，没有调用有道 |
| 开启并执行真实查询 | `edf5806d-01bc-4d4d-b0ae-6d08fbef79bb` | 01:03:09 | 同样限额，开关 true；临时增加仅本次独立服务使用的 `http://localhost:5174` |
| 收尾移除开发 Origin | `7657201a-a35e-49d2-91d4-ebefeb2358ca` | 01:04:48 | 开关 true，限额保持 500 / 2,000 / 10，Origin 恢复仅 Pages；当前 100% 生效版本 |

远端 `versions view --json` 安全字段比较确认三个版本均使用同一 DO 命名空间 `056694feb977425b8a08c6b915c1c060`、binding `TRANSLATION_QUOTA` 和类 `TranslationQuota`；代码稳定对象名仍为 `VocabularyApp-global-v1`。两项 Secret 均继续存在，只记录名称，不读取真实值。真实请求成功说明线上 DO 预留路径已运行；没有为了读计数增加公开管理接口。**没有直接读取线上累计表，也没有为验证持久化追加第三次真实查询**；累计保留的依据是相同命名空间/对象、既有持久化代码和未执行清空操作，不能报告当前累计值必定只有本轮查询量。

## 真实请求及 UI 验证通过

本轮实际运行本地新版页面 `http://localhost:5174/` → 正式 HTTPS Worker → 固定有道官方 `https://openapi.youdao.com/api`。所部署代理核心未替换上游，未使用合成翻译夹具或返回内容修补。独立 Chrome 页面网络中翻译请求只联系正式 Worker，没有浏览器直连有道或发送 Secret。

真实 UI 检查时间为 2026-10-08 01:03:22–01:03:26 +08:00：

| 实际查询 | 请求字符数 | HTTP | 实际 translations | 浏览器测得耗时 |
| --- | ---: | ---: | --- | ---: |
| `silicon substrate` | 17 | 200 | `["硅衬底"]` | 1,461 ms |
| `bias voltage` | 12 | 200 | `["偏置电压"]` | 468 ms |

两个返回均带 `source: "youdao"` 和准确的 query；浏览器 payload 分别仅有 `{ "query": "silicon substrate" }`、`{ "query": "bias voltage" }`。实际 CORS 头允许 `http://localhost:5174`，含 `Cache-Control: no-store`。这些耗时是单次浏览器检查值，不是长期性能保证；没有查询有道账户账单或独立取得原始上游响应。

严格只发送两次真实 POST，不自动重试。临时脚本在发送前持久登记两次尝试，限制指定 query、拒绝重复或第三条 POST；测试通过后未再请求翻译。按代理 Unicode 字符计数，本轮预留总量为 **29 字符**；这是本轮用量，不是有道账单保证或全站累计值。公开代理其他访问者若调用，会共用同一日/月限额。

11 项真实 UI / 数据断言通过：

- 独立 Profile 初始词库为空；未打开、读取或改动日常 Profile 的词库。
- 第一条保存英文 `substrate`，实际查询使用 `silicon substrate`；请求不改写英文，显示实际查询和有道来源。
- 返回后中文输入不自动变化；候选展示、采用和人工编辑期间 vocabulary 及 metadata 快照均不变。
- 采用只填入对应真实中文；最终人工改为明确标记合成验收的释义，再按保存。英文和备注保留。
- 第二条原英文为 `bias`，实际查询为 `bias voltage`；已有手写中文需要确认替换。取消保留原中文，再确认才填入“偏置电压”，之后允许人工修订。
- 修改查询使旧候选消失，不自动新增请求，也不影响已编辑的中文。
- 每次实际保存才新增一条，dataRevision 和 contentRevision 各增加一次；两条保存后均为 2。
- 合成词库 JSON version 1 下载成功，第二个独立 Profile 导入后字段完全往返一致；备份没有查询短语、候选、Secret 或代理计数。
- 实际页面无控制台/运行时错误；浏览器业务网络仅含本地应用及预期 Worker。

已直接检查合成验收截图，结果区原样展示“硅衬底”，查询与英文分开，中文可人工修订；保存后的两条记录与备注符合预期。截图与合成 JSON 仅在忽略的 `.tools` 内，不进入 Git/Pages，不含个人备份。临时 `5174` Vite 服务已按 PID 和命令行身份核对后停止；原有 `5173` 服务未操作。

## 限额、故障和最终 CORS 验证边界

- 本次代理 dry-run 和 33 项受控单元测试通过。
- 以现有 SQLite 计数算法、本地独立内存库核对授权值：每日预留到 500 后再加 1 拒绝；分四天累计到每月 2,000 后次日加 1 拒绝；同来源同自然分钟第 11 次拒绝。没有访问或重置线上计数，没有大量真实请求制造故障。
- 开启前的小额度关闭版本已经返回预期 503；本轮未专门消耗真实额度触发超限、欠费或上游超时，也未再做一次关闭/恢复部署。对应错误恢复的受控覆盖保留原开发证据，不写成新的真实有道故障实测。
- 最终版本下从实际 Pages Origin 发 OPTIONS，返回 HTTP 204；从已移除的本地 Origin 发 OPTIONS 被浏览器 CORS 阻止。收尾检查不允许 POST，**新增有道调用为 0**，时间为 01:06:57 +08:00。
- 本轮浏览器路径和 Worker→有道已实际连通；此前 PowerShell/Node 的证书域名异常尚未排查，不因浏览器成功宣称所有网络都可用。手机、另一网络、用户日常浏览器和真实 IME 未新增验证。

## 当前发布状态及剩余问题

再次只读确认 Pages 首页 HTTP 200，仍引用 `index-Cfib8dsn.js` 与 `index-BXDSx-BM.css`；远端 main 仍为 `4b2d710cefc76a4d181a9953d15f6ff4d74809fc`，没有 `v1.2.0`。没有变更 GitHub Actions 公开代理变量，没有合并、推送、发布新版 Pages 或充值/升级付费。

本地代码提交仍为 `4788bbc6d50ce9008ba0c1a2822d76ae90eb635b`；本轮只修改代理运行配置、当前说明和上线报告，原有未提交用户文档保持原样。本轮配置/文档尚未提交或推送。后续发布前需纳入经过检查的提交并执行对应 CI。

剩余事项：

1. 新版 Pages 尚未上线，所以公开网站仍没有翻译入口。本次证明的是**本地新版 UI → 真实云端代理 → 有道**；实际发布后的 Pages 按钮流程尚未验收。
2. 后续发布需获得授权，再设置公开代理地址、合并 main、等待 Pages build/deploy、完成实际页面和数据往返验收，之后才创建正式 tag；本次不推进。
3. 网络覆盖仍有限，需要核对日常浏览器、手机或另一网络，以及排查命令行证书路径异常。
4. 有道服务及密钥在这两条请求上有效，账户当前余额、账单、其他应用消费和输出个人保存/导出的适用规则未独立核对；公开发布前建议完成此前计划列出的账户事项。
5. 实际线上累计 SQL 表值、重部署后的独立运行读取与真实超限拒绝未额外检验；禁止以清空额度或大量调用作为验收方式。现有共享原子算法和持久化本地证据继续有效。

当前交付结论：**真实两条查询和新版本地 UI 人工录词流程通过；云端保持开启但严格使用已授权 500/2,000/10 验收档，累计额度保留。正式新版 Pages 与全网/全设备验收仍未完成。**

## 正式网页发布：账户复核与发布授权

用户随后明确授权整理并提交本轮配置及文档、设置公开 `VITE_TRANSLATION_API_BASE_URL`，必要检查通过后合并 main 并发布 GitHub Pages。限额仍为 500 / 2,000 / 10，不提高额度、不充值、不启用 Paid。正式网页必须用独立 Profile 验证后，才允许创建并推送 `v1.2.0`。

账户事项核对结果：

- 用户针对“现有有道额度是否可用、人工修订后个人保存与 JSON 导出的适用规则”明确回复 **“已核对，可以继续发布”**。这是用户账户确认，不写成开发代理独立读取账单或获得官方工单证明。
- 云端只读复核当前 100% 生效版本仍为 `7657201a-a35e-49d2-91d4-ebefeb2358ca`，限额 500 / 2,000 / 10、翻译开启、Origin 仅 Pages、两项 Secret 名称存在、DO 命名空间保持一致。本轮无需重新部署 Worker 或操作密钥。
- GitHub 仓库现有认证有管理/推送权限，默认分支 main；首次检查公开 Actions Variables 为空，远端 tag `v1.2.0` 不存在。
- 本轮继续使用既有 Free 资源；不执行账户订阅或充值操作，不记录 Secret、Token、真实 IP 或个人备份。

以上为发布前证据，实际发布、正式页面验收和标签记录如下。

## 正式发布事实与提交关系

| 项目 | 实际结果 |
| --- | --- |
| 正式网页 | https://lnlsn-l.github.io/VocabularyApp/ |
| 已验收应用提交 | `075ce2be24caa1d2a94581b922dd1be58ba88655`；包含功能实现、授权限额配置及发布前文档，保留原有未提交审阅/背景文档内容 |
| main 合并 | 从 `4b2d710` 快进到 `075ce2b`，没有冲突、强推或丢弃改动 |
| 功能分支 CI | [37729786288](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37729786288)，同一提交全部 build 门槛 success，deploy 按分支规则 skipped |
| main CI / Pages | [37730078973](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37730078973)，head `075ce2b`，build / deploy 均 success；部署完成 2026-10-08 13:02:01 +08:00 |
| 公开构建变量 | `VITE_TRANSLATION_API_BASE_URL=https://vocabularyapp-translation.vocabulary-app.workers.dev`；通过 `gh variable get` 再次核对，不含路径、口令或 Secret |
| 实际线上 JS | `/VocabularyApp/assets/index-B3JM4a8o.js`；SHA-256 `7da8c803d1badc3877fa8a03c7d294b37fa61eb6c5e10b9d74c3598cec5ec851` |
| 实际线上 CSS | `/VocabularyApp/assets/index-fkndreNS.css`；SHA-256 `c8fb41928a4763ff26c37dd81dbbb9da8bb608b9ea16b8741d96749ef1c7862b` |
| 注释标签 | `v1.2.0`，本地/远端 annotated tag 对象 `b469f63717b4b9aa42a7f8fe52cc12a0c9333a8f`，解引用指向已验收的 `075ce2be24caa1d2a94581b922dd1be58ba88655` |
| Worker | 保留 `7657201a-a35e-49d2-91d4-ebefeb2358ca`；本轮没有重新部署、改动 Secret 或 DO，仍开启 500 / 2,000 / 10 验收档 |

标签在 main 实际部署成功、正式网页翻译验收及 14 项线上回归全部通过之后才创建；创建前再次核对不存在，不覆盖任何标签。上线结果和当前 README/实施说明由后续独立 `docs: record verified stage 2 part 3 release` 提交归档；该文档提交不改变静态应用代码，Pages 与 tag 都继续对应 `075ce2b`。不会为让 tag 指向报告提交而移动已推送标签。

## 本轮本地与 CI 检查通过

本地重新执行 lint、9 个文件 71 项单元/数据/代理测试、Worker workerd/SQLite 并发与持久化测试、代理 dry-run、使用正式公开地址的生产构建、随机 Secret 哨兵构建检查及 dist 白名单，全部通过。生产静态文件仍只有 index、favicon、JS、CSS，没有代理源码、配置、文档或测试产物。

功能分支和 main CI 均另外执行完整现有门槛：依赖安装、lint、单元、Worker 模拟器、代理 dry-run、开发浏览器、受控翻译开发/生产子路径、正式公开地址构建、Secret 隔离、生产数据/迁移与产物白名单。main 成功后才上传 dist 并部署。CI 使用受控上游，不配置有道 Secret，不把 CI success 当作真实 API 返回的证据。

## 正式网页独立 Profile 验收通过

测试时间：2026-10-08 13:03:25–13:03:33 +08:00；新建独立 Chrome Profile，词库初始为空，个人日常数据未访问。真实页面加载的 JS/CSS 内容与上述本地已检查生产产物 SHA-256 完全一致。13 项翻译/保存/隔离断言通过：

| 检查 | 实际结果 |
| --- | --- |
| 正式翻译入口 | 添加词条表单显示“有道翻译参考”、独立查询短语和“获取翻译参考”；规范地址另外验证键入不调用代理 |
| `silicon substrate` | 真实 POST 正式 Worker，HTTP 200，`source=youdao`，返回“硅衬底”，耗时约 1,654 ms；英文仍可保存 `substrate` |
| `bias voltage` | 真实 POST 正式 Worker，HTTP 200，`source=youdao`，返回“偏置电压”，耗时约 604 ms；英文仍可保存 `bias` |
| 跨域和请求模型 | CORS 精确允许 `https://lnlsn-l.github.io`；实际两个 payload 都仅含 query，没有中文、备注、词库或凭据 |
| 采用/修订/保存 | 返回不填中文；采用只填输入。已有中文替换可取消并保留输入，确认后可人工修订。英文和备注不改变，每次最终保存才增加一次 dataRevision/contentRevision |
| 结果失效 | 修改查询清除候选，不新增上游请求，不清空已修订中文 |
| 失败时手动录词 | 在该独立 Profile 精确拦截一次代理请求并返回受控 503/not_configured；显示不可用提示，保留中文和备注，继续人工修订保存成功。未关闭公网服务，未制造真实有道故障或额外调用上游 |
| JSON 往返 | 两条修订词条及一条手填故障词条合计 3 条；version 1 导出后在第二个独立 Profile 导入，所有词条字段完全一致，没有查询候选或服务端配置 |
| 密钥隔离 | 实际 JS/CSS 不含服务端 Secret 字段、Token/私钥模式且与通过随机哨兵检查的产物一致；浏览器真实业务请求只有 Worker query，没有直连有道或认证值，合成 JSON 不含候选/Secret。未读取真实 Secret 做值比对 |

新增真实有道请求严格为 **2 次、29 字符**；尝试在发送前写入忽略的本地账本，禁止自动重试或重复执行。这是本轮预留字符量；此前本地真实联调另有 29 字符，没有清空历史累计，也不能把两轮合计 58 字符当作整个公共账户账单。第三个网页 fetch 只在独立 Profile 内被受控 503 截获，新增上游调用为 0。

专用翻译验收脚本的起始页面地址多了一个尾部斜杠，实际为 `/VocabularyApp//`，同一正式 Origin 和相同已发布产物。没有隐瞒或用 localhost 代替线上；随后从规范 `/VocabularyApp/` 地址补查入口和输入行为（13:05:01），没有重复计费查询。下述完整 14 项回归也全部使用规范正式地址。临时脚本已修正该地址，现有账本仍防止重复真实调用。

已有 `VOCABULARY_PAGES_URL=https://lnlsn-l.github.io/VocabularyApp/ npm run test:pages` **14 项线上回归全部通过（34.7 秒）**，覆盖生产子路径资源、无主动第三方请求、CRUD/搜索/筛选/排序、1440/360 布局、刷新/重开浏览器/Profile 隔离、localhost↔线上 JSON 双向迁移、重复与非法导入、备份状态、多标签页、连续录词、取消只读、下载失败、旧 v1→v2 数据迁移及保留其他应用存储。

仅受控 503 产生预期资源错误，除此之外正式翻译页面控制台和运行时错误为 0；不放开所有第三方请求或忽略全部错误。已直接检查正式翻译表单和保存后的截图。截图、合成备份、Profile、网络 JSON 和账本均留在忽略的测试目录，不进入 Git 或 Pages。

## 最终交付及未覆盖范围

- **本地/CI 通过**：实现、原数据保护、共享额度、受控故障、生产构建、Secret 隔离及静态部署检查。
- **线上通过**：真实 Pages 发布、翻译入口、两条实际有道请求、人工采用修订保存、受控不可用时手填、JSON 往返及 14 项规范 URL 回归；正式注释 tag 已推送。
- **保持不变**：500 字符/日、2,000 字符/月、每来源每 UTC 自然分钟 10 次，原 DO/累计额度与浏览器 schema 2/JSON version 1；未充值、提高额度、升级 Paid 或访问日常词库。
- **仍未覆盖**：真实手机/其他网络/用户日常 Profile 与物理 IME；此前命令行到 workers.dev 的证书路径异常仍未排查；未独立读取账户余额/账单、官方许可工单或线上 SQL 累计值，未大量真实调用触发超限/欠费/超时。账户事项由用户明确核对确认，受控错误与真实返回的证据分开记录。

正式发布范围已完成，没有阻塞项需要继续阻止本次交付。上述未覆盖范围保留为实际边界，不宣称全网、全设备或专业翻译准确率保证。
