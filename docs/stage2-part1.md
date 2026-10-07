# 第二阶段第一部分交付记录

日期：2026-10-07（Asia/Shanghai）。路径：`D:\VocabularyApp`。

**状态：第二阶段第一部分已完成，网站上线并通过真实 HTTPS 验收。** 仓库经用户明确授权由 Private 改为 Public。最终地址：[https://lnlsn-l.github.io/VocabularyApp/](https://lnlsn-l.github.io/VocabularyApp/)。

## 开发前基线与检查

- 基线：`eb2cd975144af47ff76861c23040200faf667f9a`（`eb2cd97`）。分支 `main`，工作区干净，远端 main 与本地一致。
- 已阅读 README、requirements、v1-report、verification、delivery-report、完整 Git 历史、package.json、Vite、schema、数据层、UI 和测试。
- origin：`https://github.com/lnlsn-l/VocabularyApp.git`。
- 环境：Node.js 24.14.0、npm 11.18.0。GitHub CLI 登录 `lnlsn-l`，具有 repo/workflow 权限；仓库 admin / push 可用，Actions 已启用。
- 沙箱内 gh 登录检查曾失败；允许联网后验证成功，不是用户凭据失效。Vite/Vitest 沙箱启动遇到 `spawn EPERM`，允许子进程后正常运行。
- 开发前仓库 visibility 为 private、默认分支 main、`has_pages=false`。Pages 查询返回 404。创建 workflow 类型 Pages 返回 HTTP 422：`Your current plan does not support GitHub Pages for this repository.`
- API 未返回账户方案名称，未推断具体订阅级别。首次保留 Private 并完成准备后，用户明确回复“变成public即可”，随后才执行 Private → Public 并创建 Pages。未操作账号密码或购买方案。

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

应用／CI提交为 `3b0d2e8b5457f7a346c6c0f6712e491f34f9605f`。首次准备工作流：[37569721357](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37569721357)；用户授权改为 Public 后部署工作流：[37570191550](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37570191550)。详细结果见下方“远端结果”。

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

本地跨 Origin 模拟已通过；随后又对实际 Pages HTTPS 地址完成同一套验收，见下方。未修改用户已有 localhost 数据；数据库及数据访问代码无改动，未执行清空升级。未实际重启用户电脑。

## 远端结果

首次 Actions `37569721357`：build 成功，deploy 在 Configure Pages 处因站点尚未创建而失败；创建站点曾因 Private 方案资格被 HTTP 422 拒绝。首次失败已查日志，没有跳过或当作部署成功。

用户明确授权 Public 后，仓库可见性变更成功，Pages 创建成功。创建 API 已返回 HTTPS 启用；紧接着再次设置 HTTPS 曾因证书尚未就绪返回 404，未将此当作部署失败或改用 HTTP。部署后再次查询确认 `https_enforced=true`，实际 HTTPS 浏览器访问正常。

最终 Actions `37570191550`：整体 success，build 54 秒、deploy 13 秒。部署基线 `4bd1d27c320cb4485c0a8dbca045c6b3bd237397`，应用／CI内容与已验收的 3b0d2e8 一致；中间仅增加部署文档。npm ci、lint、单元测试、开发 E2E、build、生产／迁移 E2E、check:dist、上传、configure-pages 与 deploy-pages 全部通过。

Pages API 确认 `html_url=https://lnlsn-l.github.io/VocabularyApp/`、`build_type=workflow`、`public=true`、`https_enforced=true`。独立 Chrome 实际访问返回 HTTP 200，标题 `Vocabulary · 个人专业词库`，应用正常加载。API status 字段为 null，未把它当作成功依据；成功依据是工作流部署结果和实际 HTTPS 访问。

设置 `VOCABULARY_PAGES_URL=https://lnlsn-l.github.io/VocabularyApp/` 后运行 `npm run test:pages`，**4 项真实线上 E2E 全部通过（11.9 秒）**：

- 页面、JS/CSS/favicon 正常，无资源 404、console error 或第三方请求；全新 Profile 词库为空，没有开发者个人词条。
- CRUD、英文／中文／备注搜索、A–Z/#、状态与四种排序全部正常；1440px 与 360px 页面、表单、详情截图已检查。
- Pages Profile A 的 substrate 刷新、重开标签页、重启浏览器进程后保留；Profile B 同地址为空，数据相互隔离。
- 隔离 localhost 的三词 JSON 实际导入 Pages，全部字段逐项一致；Pages 新增词后实际下载 version 1 JSON，导回 localhost 按规则新增并跳过重复；Pages 再次导入无重复新增，非法文件不会破坏原库。

测试后已恢复 `http://localhost:5173/` 本地开发服务。没有访问或修改用户日常 Profile，也没有自动迁移真实个人词库。

## 数据和产物安全

本地 dist 文件仅为 `index.html`、`favicon.svg`、`assets/index-BKqIY1WG.js`、`assets/index-D8g7kxYd.css`。只由现有前端源码和 public 图标构建，不读取个人浏览器配置文件、IndexedDB 或 backups。未打包个人词库、JSON、.env、依赖目录、浏览器 Profile、Playwright 用户数据、测试截图或日志。生成的截图、Profile 和诊断脚本只在 Git 忽略目录中。

应用词库操作继续仅在当前浏览器内执行，没有上传词条的请求或服务。Repository、Pages、IndexedDB 三者的区别已写入界面、README 与部署文档。IndexedDB 按 Origin/Profile 隔离；共用同一 Profile 的人共用数据。同一 github.io Origin 下不同路径通常共用站点存储，不能当作应用间的独立安全边界。

已通过 gh 下载首次与成功部署两次真实 Actions 的 `github-pages` artifact 并检查内部 `artifact.tar`，均只包含上述四个静态文件及目录，无链接、JSON、IndexedDB、Profile、环境文件、依赖或测试输出。JS/CSS 文件名与本地一致。远端 main 文件树没有被禁止目录或个人备份；只有 package.json、package-lock.json、tsconfig.json 三个必要配置 JSON。完整 Git 历史的文件名检查无 backups、dist、依赖、环境文件或测试 Profile 提交。已验证忽略规则，已提交内容的常见凭据格式扫描无匹配。

## 提交与交付状态

| 提交 | 内容 |
| --- | --- |
| eb2cd97 | 第一版开发前基线 |
| 1c18545 | Pages 路径与应用内本地数据说明 |
| 3b0d2e8 | 自动部署、产物检查和隔离迁移测试 |
| 4bd1d27 | 部署准备文档与最初的 Private 方案限制记录；成功部署基线 |

当前报告、README/deployment 的已上线结果作为后续独立 docs 提交推送，不改变已发布应用，因此不重复部署。报告自身提交 hash 以 `git log -1 --oneline` 和最终交付消息为准；应用／CI基线为 3b0d2e8，成功部署基线为 4bd1d27。交付约定为：main、origin 未变、git status 干净、HEAD 与 origin/main 一致；在文档提交和推送后再次核对，若有差异须在最终消息中明确报告。

## 已知限制与后续步骤

- 当前仓库为 Public，免费 Pages 已上线；此变化依据用户明确授权执行。源代码和 Git 提交历史公开，词库数据仍保存在各浏览器中。
- 后续应用修改推送 main 会自动检查并部署；仅文档修改跳过部署，需要时可 workflow_dispatch 手动运行。
- 从用户日常 localhost 迁移个人词库仍需本人导出与选择 JSON；本次没有访问或迁移真实个人词库。
- IndexedDB 不自动同步到 GitHub 或其他设备，不保证永不丢失；定期导出并保留外部副本。
- 没有 PWA 或离线启动缓存；首次加载和远程重新加载需要网络。

下一步建议先按 README 迁移本人词库、核对总数并保留外部 JSON 备份，再积累实际使用反馈。后续功能按单独需求安排，本次不开始下一阶段。
