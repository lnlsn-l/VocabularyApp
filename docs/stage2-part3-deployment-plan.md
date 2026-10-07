# Stage 2 Part 3 部署准备与集中交接

日期：2026-10-07（Asia/Shanghai）。状态：实现和本地验证已进行；**没有创建云端代理、配置真实 Secret、消费有道额度或发布 v1.2.0 tag**。本文件是可执行方案，不代表平台及费用已经获得授权。

## 推荐的最小方案

继续使用现有 GitHub Pages 提供静态应用；新增一个 Cloudflare Workers Free Worker（`vocabularyapp-translation`）和一个 SQLite Durable Object 类（`TranslationQuota`），所有访问共用稳定对象名 `VocabularyApp-global-v1`。不购买域名，不新增用户登录或云端词库。Worker 是本阶段推荐的平台，用户尚未最终选定。

浏览器只 POST `{ "query": "用户当前显示的查询短语" }` 到公开 HTTPS 代理 `/translate`。代理校验 Origin、请求模型、长度、开关和服务端 Secret，经单个 Durable Object 原子预留额度后，对固定 `https://openapi.youdao.com/api` 发起一次 v3 签名的英译简中通用 NMT 表单请求。返回 query/source/translations；数据库保存仍完全在浏览器。任何层失败都可手动录词。

部署文件：`proxy/wrangler.jsonc`。已提供 SQLite migration 和 binding；默认 `TRANSLATION_ENABLED=false`。`npm run proxy:check` 仅本地打包，`npm run test:worker` 实际执行 workerd/SQLite 模拟器与可控上游，不会部署。新增 Wrangler 是开发/打包/运行时验收工具，不进入前端；锁文件固定实际版本。为修复其 sharp 间接依赖漏洞设置 `overrides.sharp=^0.35.5`，最终 npm audit 零漏洞。

## 配额与费用依据

于上述日期核对官方资料：

- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)与 [平台限额](https://developers.cloudflare.com/workers/platform/limits/)：Free 的 Worker 请求额度 100,000/日，CPU 每调用 10ms。SQLite Durable Object 可以使用 Free；DO 请求 100,000/日、执行时长 13,000 GB-s/日，SQLite 读 500万行/日、写 100,000行/日、合计存储 5GB。不同资源分别消耗配额，账户其他项目也可能共用额度。限流拒绝、预检与攻击流量仍可能消耗平台请求/CPU；Free 超限可能不可用，不能承诺永久免费或始终可用。Paid 起价 $5/月，**本方案不启用 Paid**。
- [有道通用文本翻译价格](https://ai.youdao.com/DOCSIRMA/html/trans/price/wbfy/index.html)：中英常见语种通用翻译按量为 48元/百万字符，领域版另价，本项目不启用。免费体验与赠金按账户实际余额/有效期为准，不把历史体验额当长期免费额度。资源包耗尽/过期可能转按量收费。没有购买资源包、充值或自动充值动作。

初始技术建议：全站日最多 5,000 字符，月最多 100,000 字符，每来源每 UTC 自然分钟 10 次（不是滑动窗口，在分钟边界可能先后各 10 次）。**这些是待授权的上限，尚不是用户确认的费用预算**。建议首次真实验收先临时设 500字符/日、2,000字符/月，再在用户确认后调整。

个人用量示例：每天 20次、每次平均20字符，30天约12,000字符，按上述单价约0.576元；100,000字符约4.8元。仅为单价换算，不是账单保证。保留的预留额度涵盖成功、业务失败、HTTP失败、网络异常、超时及预留后取消，不退款、不自动重试，因此通常高估真正上游消费。校验失败、服务关闭、缺少配置和限额拒绝不调上游。实际有道统计口径和账户其他应用调用、密钥在其他客户端的使用不受本代理限制，需在控制台另核对。

公开代理可被伪造 Origin 的非浏览器客户端调用。CORS 白名单不构成身份或费用保护；日/月总量共享控制可限制本代理产生的上游字符量，但有人可以耗尽大家的额度。IP 限流不能抵御分布式来源，暂不加入登录或人机验证。若实际遭滥用，先关闭开关；可另评估 Turnstile 的用户点击/网络成本，不能仅提高预算。共享总量依赖稳定对象绑定，不得部署另一份代理同时用同一有道账户却各自计数，或清空/回滚 DO 计数来恢复额度。

## 网络和许可验收条件

[Cloudflare 中国网络说明](https://developers.cloudflare.com/china-network/)指出跨境链路可能有延迟/可靠性问题，中国网络是 Enterprise 独立订阅；本方案不订购该产品，Free Worker 不能被宣传为国内节点保证。尚无实际 Worker 地址，**用户所在地到 workers.dev、Worker 到有道的连接均未验证**。平台选择须以少量实际 HTTPS 试运行结果为准。若不适用，保留 core/quota 模块，另用用户确认的可达平台及共享事务数据库作适配；不能把单进程 Node 内存计数直接当作多实例上线保护。当前 Node 适配仅用于 loopback 本地开发，SQLite 文件持久化，不作为公网部署方案。

已核对 [有道 API](https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html) 和 [有道智云服务条款](https://ai.youdao.com/DOCSIRMA/html/agreement/terms/ydzyfwkt/index.html)。浏览器读取条款超时后，通过普通 HTTPS 取得完整公开 HTML；没有进入账户页面。第2.1节支持通过 API 开发应用，第9.5节说明一般生成输出的权利归属；第9.2节对缓存/改编/转播服务数据有限制，第9.3节和第5.7节要求保留相关权利声明/内容标识，第9.6节说明去标识输入输出可能用于优化、安全分析。**不能将这些组合条款直接解释为任意再发布许可**。

当前实现显示有道署名和官方链接，原样显示 translation 文本、不删除文本内声明；候选不持久缓存，只有用户人工确认的释义进入既有 JSON version1。API 文档没有给出本模式必须写入 JSON 的署名字段；这里是实施解释，非法律保证。正式开放前建议用账户官方工单明确确认以下实际使用方式，文案可直接复制：

> 本项目使用通用 NMT API 展示带有道署名和官方链接的临时翻译参考；用户可人工采用、修订后保存为个人词库释义，并通过本地 JSON 备份/迁移。无批量缓存、词典镜像、翻译结果转售。请确认这种结果修改、个人保存及 JSON 导出是否属于应用允许范围，是否须额外许可，以及保存/导出是否必须保留来源或内容标识。

若有道明确要求持久保留标识，先采用获许可的兼容方式再开放：例如有道认可当前人工释义模式无需额外字段，或经用户确认在现有 note 字段由用户显式附上要求的信息。不能自行静默追加备注、移除声明或破坏 JSON version1；未获允许时维持关闭。原始有道评估两轮记录是历史真实证据，不代替条款确认和正式代理验收。

## 用户集中准备事项

1. **平台与资源授权**：确认愿意使用 Cloudflare Free，授权创建上述一个 Worker 和 SQLite DO；自行注册/登录账户并启用 workers.dev 子域，不需要购买域名或开付费套餐。可用 `npx wrangler login` 在本机浏览器登录，或仅在本机环境配置限于该 Worker 所需权限的 API Token。不要把 Token/账户页面/Secret 发到聊天。
2. **有道配置与许可**：已有 API 应用需绑定通用 NMT，检查应用/服务状态、可用余额及账户适用协议。通过本机/Cloudflare Secret 输入 `YOUDAO_APP_ID`、`YOUDAO_APP_SECRET`；如平台 IP 白名单限制与动态出口冲突，先在有道控制台核对接入方案，不通过任意客户端 IP 头绕过。确认上述保存/导出适用规则。
3. **具体费用授权**：确认是否允许该公开应用消耗自己有道账户已有额度；确认日/月字符限额和愿意承担的预算（建议最终 5,000/100,000，初验先 500/2,000）。本次没有获得充值/新购资源包/自动充值/付费平台授权，任何此类动作须另外明确批准。

这三项一次性交接即可。真实值仅在用户本机或平台 Secret 配置；可以告知“已配置/已确认”，无需提供值。平台不需要获得浏览器词库。

## 获得上述授权后的具体部署步骤

从 `D:\VocabularyApp` 操作。以下命令不含 Secret 值，也不会要求在命令行参数提供 Secret：

```powershell
npm ci
npx wrangler login
npm run proxy:check
npx wrangler deploy --config proxy/wrangler.jsonc
npx wrangler secret put YOUDAO_APP_ID --config proxy/wrangler.jsonc
npx wrangler secret put YOUDAO_APP_SECRET --config proxy/wrangler.jsonc
```

首次 deploy 仍关闭调用；Secret put 在终端提示输入，或用 Cloudflare Dashboard 的加密 Secret 输入。不要上传 proxy/.env.local。Worker 及绑定创建属新资源操作，**以上实际 deploy 和 secret put 本次未执行**。不将示例 Secret 写入工作区、Git、命令历史或构建变量。

先临时保持 `ALLOWED_ORIGINS=https://lnlsn-l.github.io`，通过需要实际浏览器的 Pages 流程验收；若本地要连正式 Worker，显式增加 `http://localhost:5173`，验收后删除开发 Origin。Pages `/VocabularyApp/` 不是 Origin。将 config 中限额设为已授权值，把 `TRANSLATION_ENABLED` 设为 `true` 后 redeploy（或只在平台控制台管理该值；之后用配置部署时须防止旧值覆盖）。一次变更只采用一处配置来源。

在 GitHub 仓库 Settings → Secrets and variables → Actions → Variables 新建公开变量 `VITE_TRANSLATION_API_BASE_URL`，值为真实代理 HTTPS 根地址，不带 /translate、查询参数或口令。该值可公开；有道 Secret 和 Cloudflare Token **不进入 Pages workflow**。当前 workflow 已读取此变量；未配置时前端明确显示不可用。新增受控翻译测试与 Worker gate 已纳入 CI；构建仅上传 dist，代理单独手动部署。

推送已经本地验收的应用提交后，等待 Actions build/deploy 成功。用隔离 Profile 从真实 `https://lnlsn-l.github.io/VocabularyApp/` 点击一到两次合成短查询：核对浏览器只有代理请求、payload仅query，实际服务端调用有道、中文可修订保存、候选不自动保存、额度/错误可恢复；导出并导入临时 JSON，核对词条字段。平台 Secret 及客户端产物核对也须完成。Worker 运行时 mock 测试不是此验收。

真实网络失败时关闭调用，保留本地功能，不自动切 localhost 或公共代理；先核对实际网络再决定平台。无需重复 30 词来源试查。

最后核对应用提交、Actions run、在线资产与版本、远端状态，只有代理和真实 Pages **全部**验收后创建并推送注释 `v1.2.0`（先确认远端不存在，不覆盖既有 tag）。报告若单独 docs commit，明确 tag 仍指向验收应用提交。

## 关闭、回滚与数据保护

- 紧急关闭：在 Worker 将 `TRANSLATION_ENABLED=false`，持久保存配置并重新部署/应用；新请求在预留/上游前拒绝，已经在途的调用可能已计费。
- 前端关闭：清空公开代理变量后重新执行既有 Pages 工作流；所有本地录词仍可用。只修改构建变量不撤销已发起的请求。
- 代理代码回滚：回到已验收 Worker version，保留同一 DO 类/binding/object名和原有计数；检查回滚版本是否有开关，不能通过恢复旧计数降低已消费总量。
- 静态回滚：既有应用提交重新构建发布，无需操作 IndexedDB。浏览器 schema仍2/JSON仍1；不删除用户数据、备份或同 Origin 其他应用存储。
- Secret 泄露时在有道撤销并更换、更新平台 Secret；先保持关闭。不能仅换前端地址。平台请求日志/trace不要启用记录 body，Wrangler命令设置 `WRANGLER_SEND_METRICS=false`；配置已禁用 Worker observability。平台基础访问元信息仍可能由服务商保存。
