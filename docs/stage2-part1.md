# 第二阶段第一部分交付记录

日期：2026-10-07（Asia/Shanghai）。路径：`D:\VocabularyApp`。

**状态：部署准备与本地验收已完成，公开上线受 GitHub 账户方案阻塞；本阶段尚未全部验收完成。** 仓库保持 Private，未改为 Public。目标 HTTPS 地址当前返回 404，不能作为已上线产品交付。

## 开发前基线与检查

- 基线：`eb2cd975144af47ff76861c23040200faf667f9a`（`eb2cd97`）。分支 `main`，工作区干净，远端 main 与本地一致。
- 已阅读 README、requirements、v1-report、verification、delivery-report、完整 Git 历史、package.json、Vite、schema、数据层、UI 和测试。
- origin：`https://github.com/lnlsn-l/VocabularyApp.git`。
- 环境：Node.js 24.14.0、npm 11.18.0。GitHub CLI 登录 `lnlsn-l`，具有 repo/workflow 权限；仓库 admin / push 可用，Actions 已启用。
- 沙箱内 gh 登录检查曾失败；允许联网后验证成功，不是用户凭据失效。Vite/Vitest 沙箱启动遇到 `spawn EPERM`，允许子进程后正常运行。
- 仓库实际 visibility 为 private、默认分支 main、`has_pages=false`。Pages 查询返回 404。创建 workflow 类型 Pages 返回 HTTP 422：`Your current plan does not support GitHub Pages for this repository.`
- API 未返回账户方案名称，未推断具体订阅级别。限制是此 Private 仓库的 Pages 资格。未操作账号密码、购买方案或改变 visibility。

## 本阶段文件与技术决策

| 文件 | 变化 |
| --- | --- |
| vite.config.ts | dev base `/`，build/preview base `/VocabularyApp/`，保留 localhost:5173 与 strictPort |
| index.html | favicon 使用 Vite `%BASE_URL%` |
| src/components/DataNotice.tsx | 可长期展开的数据保存、独立 Profile、备份、Origin 说明 |
| src/components/BackupControls.tsx | 共享现有文件输入引用，复用第一版导入逻辑 |
| src/pages/Home.tsx | 数据说明和首次空库导入备份入口 |
| src/styles.css | 数据说明的轻量样式和键盘焦点 |
| playwright.config.ts | 明确原有测试文件，适配生产预览子路径 |
| tests/app.spec.ts | 保留原测试行为，使用相对入口与隔离截图输出 |
| playwright.pages.config.ts | 独立生产／远程 Pages 验收配置，本地开发为迁移来源 |
| tests/pages.spec.ts | 4 项生产、持久化、隔离、JSON 双向迁移验收 |
| scripts/check-dist.mjs | 部署静态文件白名单、资源路径和常见凭据检查 |
| package.json | 新增 test:pages、check:dist，无新依赖 |
| tsconfig.json | 检查新增 Playwright 配置 |
| eslint.config.js | 检查新增 mjs 脚本 |
| .github/workflows/deploy-pages.yml | 官方 Actions、质量门槛、仅 dist 产物、最小权限部署 |
| README.md | 在线状态、迁移步骤、数据职责、预览地址与自动部署说明 |
| docs/deployment.md | 部署架构、限制、工作流、重跑、迁移与故障排查 |
| docs/stage2-part1.md | 本交付记录 |

没有新增运行／开发依赖，没有改动 package-lock.json。没有引入路由；当前仅首页，不需要刷新子页面兼容重构。

保留 `VocabularyService → VocabularyRepository → LocalVocabularyRepository → Dexie → IndexedDB`。数据库名、表名、schema、version 1、业务字段和 JSON version 1 均未改变。未删除或重建数据库；未打开或操作用户日常词库。没有登录、云存储、云同步、AI、词典、PWA、Service Worker、PDF、标签或其他后续功能。

## GitHub Actions

应用 push main 或手动 dispatch 后：checkout → Node.js 24 → npm ci → lint → 单元测试 → Chrome 安装 → 开发 E2E → build → 生产子路径／迁移 E2E → dist 白名单检查 → upload-pages-artifact；deploy job 依赖 build 成功，再 configure-pages → deploy-pages。README/docs 独立提交不会重复部署。

全局 `contents: read`，deploy job 为 `contents: read`、`pages: write`、`id-token: write`。官方 Actions 固定到 API 核对过的提交 SHA，无 write-all、硬编码 Token 或 PAT。只上传 dist，不提交 dist，不上传测试输出或浏览器数据。

已推送应用／CI提交 `3b0d2e8b5457f7a346c6c0f6712e491f34f9605f`，真实 Actions：[37569721357](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37569721357)。最终运行结果见下方“远端结果”。

## 本地验证结果

| 检查 | 结果 |
| --- | --- |
| npm run build | TypeScript 与 Vite 生产构建通过 |
| npm run lint | 通过 |
| npm test | 3 个文件、21 项通过 |
| npm run test:e2e | 原有 11 项开发 Chrome E2E 通过 |
| VOCABULARY_PREVIEW_TEST=1 的 test:e2e | 原有 8 项生产子路径 UI E2E 通过 |
| npm run test:pages | 新增 4 项生产／迁移 Chrome E2E 通过 |
| npm run check:dist | 静态文件白名单、HTML 资源路径、常见凭据扫描通过 |
| git diff --check | 通过 |
| 桌面 1440px / 手机 360px | 页面、搜索、筛选、A–Z、添加、备份入口、表单和详情检查通过，截图已检查 |

新增测试具体结果：

1. 构建的 JS/CSS/favicon 均位于 `/VocabularyApp/` 并正常加载，页面没有 404、console error、脚本错误或外部第三方请求。新环境首次词库为空，没有预填个人词条；未注册 Service Worker。
2. 生产构建的添加、编辑、状态切换、确认删除、英文／中文／备注搜索、A–Z/# 和四种排序通过真实 UI 验证。
3. 独立测试 Profile A 添加 substrate／衬底，刷新、关闭标签页重开、关闭整个浏览器进程再打开后仍保留。Profile B 打开同地址为空；B 新增测试词不出现在 A 中。
4. localhost:5173 的隔离测试库添加三条不同状态测试词，记录查看次数并实际下载 JSON；导入 localhost:5174/VocabularyApp/ 后，逐字段比较 id、word、meaning、note、status、searchCount、createdAt、updatedAt、lastSearchedAt，全等。
5. 目标测试库新增 pages-test-word，导出 version 1 JSON，再导入 localhost，按第一版规则新增 1、跳过重复 3；元数据一致。重复导入目标库新增 0、重复 4；非法 JSON 拒绝且原数据保留。

这些测试只使用 Playwright 独立临时 Profile，不涉及用户日常词库。5173 的原项目 Vite 服务曾为测试暂时停止，测试结束后已后台恢复，`http://localhost:5173/` 返回 200。

测试初次发现 build 与 preview 对 base 的判断差异，已用 `isPreview` 修复并复验；测试中备注／状态标签和重复筛选按钮定位也已调整。最终结果全部通过，没有跳过功能测试或将失败当作成功。

**本地跨 Origin 模拟已通过，不等于真实 localhost → Pages HTTPS 验收已完成。** 未修改用户已有 localhost 数据；数据库及数据访问代码无改动，未执行清空升级。未实际重启用户电脑。

## 远端结果

真实 Actions `37569721357` 已结束：build job 成功（1 分 13 秒），deploy job 失败（3 秒），整体 conclusion=failure。Linux runner 上 npm ci、lint、21 项单元测试、11 项开发 E2E、4 项生产／迁移 E2E、build、check:dist 和静态 artifact 上传全部通过。

失败位置为 `Configure Pages`：Pages 查询返回 HTTP 404，`Deploy` 未执行。已查阅失败日志；创建站点先前已被 HTTP 422 拒绝，原因是当前账户方案不支持此 Private 仓库。没有通过重跑同一工作流绕过账户限制，没有改变 visibility。

独立 Chrome 实际打开 `https://lnlsn-l.github.io/VocabularyApp/`：HTTP 404，标题 `Site not found · GitHub Pages`，应用未加载。因此尚无经 Pages API 确认的最终部署 URL；以上仅为目标地址。线上 JS/CSS、CRUD、HTTPS 下载／上传、Profile 隔离和 localhost → Pages 迁移尚未验收，不能宣称完成。

## 数据和产物安全

本地 dist 文件仅为 `index.html`、`favicon.svg`、`assets/index-BKqIY1WG.js`、`assets/index-D8g7kxYd.css`。只由现有前端源码和 public 图标构建，不读取个人浏览器配置文件、IndexedDB 或 backups。未打包个人词库、JSON、.env、依赖目录、浏览器 Profile、Playwright 用户数据、测试截图或日志。生成的截图、Profile 和诊断脚本只在 Git 忽略目录中。

应用词库操作继续仅在当前浏览器内执行，没有上传词条的请求或服务。Repository、Pages、IndexedDB 三者的区别已写入界面、README 与部署文档。IndexedDB 按 Origin/Profile 隔离；共用同一 Profile 的人共用数据。同一 github.io Origin 下不同路径通常共用站点存储，不能当作应用间的独立安全边界。

已通过 gh 下载真实 Actions artifact `github-pages`（压缩大小 109868 字节）并检查内部 `artifact.tar`，包含且仅包含上述四个静态文件及目录，无链接、JSON、IndexedDB、Profile、环境文件、依赖或测试输出。其 JS/CSS 文件名与本地一致。远端 main 文件树检查没有发现被禁止的目录或个人备份；只有 package.json、package-lock.json、tsconfig.json 三个必要配置 JSON。已验证 backups、.env/.env.local、dist、test-results、.tools 的 Git 忽略规则，已提交内容的常见凭据格式扫描无匹配。

## 提交与交付状态

| 提交 | 内容 |
| --- | --- |
| eb2cd97 | 第一版开发前基线 |
| 1c18545 | Pages 路径与应用内本地数据说明 |
| 3b0d2e8 | 自动部署、产物检查和隔离迁移测试 |

本报告及 README/deployment 作为独立 docs 提交推送。报告自身的提交 hash 以 `git log -1 --oneline` 和最终交付消息为准；本阶段应用与 CI 基线固定为上述 3b0d2e8。交付约定为：main、origin 未变、git status 干净、HEAD 与 origin/main 一致；这些状态在文档提交和推送后再次核对，若有差异须在最终消息中明确报告。

## 已知限制与后续步骤

- 当前方案不支持 Private Pages，未上线。仓库 visibility 保持 Private。
- 选择升级支持私有 Pages 的账户方案，可保留代码私有；或明确授权将仓库改为 Public，使用免费 Pages。Public 会公开源代码和提交历史，不能仅凭部署任务自动执行。
- 解除限制后配置 Pages 为 GitHub Actions，手动重跑工作流，核对 API html_url/page_url，再按 deployment.md 的 `VOCABULARY_PAGES_URL` 执行真实 HTTPS 浏览器验收并更新本报告。
- 从用户日常 localhost 迁移个人词库仍需本人导出与选择 JSON；本次没有访问或迁移真实个人词库。
- IndexedDB 不自动同步到 GitHub 或其他设备，不保证永不丢失；定期导出并保留外部副本。
- 没有 PWA 或离线启动缓存；首次加载和远程重新加载需要网络。

下一步应先解除 Pages 账户／可见性阻塞并完成真实部署验收。后续功能按单独需求安排，本次不开始下一阶段。
