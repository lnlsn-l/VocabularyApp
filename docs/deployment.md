# GitHub Pages 部署与本地数据迁移

日期：2026-10-07（Asia/Shanghai）。项目：`D:\VocabularyApp`。仓库：`lnlsn-l/VocabularyApp`，默认分支 `main`。

## 当前状态与可见性

在线地址：[VocabularyApp](https://lnlsn-l.github.io/VocabularyApp/)。2026-10-07 已部署成功，并通过实际 HTTPS Chrome 验收。仓库为 Public，默认分支 main；Pages API 确认 `build_type=workflow`、`public=true`、`https_enforced=true`，html_url 与上述地址一致。成功工作流：[37570191550](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37570191550)。

首次准备时仓库为 Private，创建 Pages 返回 HTTP 422：`Your current plan does not support GitHub Pages for this repository.` API 未返回账户方案名称，未推断具体订阅级别。此前保持 Private 并完成全部准备后，用户明确回复“变成public即可”，才执行 Private → Public 变更并成功创建 Pages。源代码与 Git 历史因此公开，个人词库没有进入仓库或发布产物。

[GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)规定：GitHub Free 支持公开仓库 Pages；私有仓库 Pages 需要 GitHub Pro、Team 等支持方案。本次按用户明确授权使用 Public + 免费 Pages。以后不要未经授权更改 visibility 或购买订阅。

## 架构与路径

源代码仓库 → Actions 检查与 Vite 构建 → Pages 静态产物 → 用户浏览器 → IndexedDB。无业务后端、账户、云数据库、云同步、追踪或第三方词典。

`vite.config.ts` 集中管理 base：开发为 `/`，build 和 preview 为 `/VocabularyApp/`。本地开发仍为 `http://localhost:5173/`；生产预览为 `http://localhost:5173/VocabularyApp/`。二者协议、主机、端口相同，复用同一 Origin 的数据库。favicon 使用 `%BASE_URL%favicon.svg`，JS/CSS 路径由 Vite 生成，没有引入客户端路由。本阶段没有 manifest、PWA、Service Worker 或新业务字段。

当前 1.1.0 保留 `VocabularyDB/vocabulary`，通过 Dexie version 2 无损新增 `vocabularyAppMetadata`。第一部分部署时 schema 为 1；第二部分增加应用元数据，但 JSON 仍为 version 1，旧词条与唯一索引不变。不删除或重建用户数据库，测试只使用独立 Profile。详见 `stage2-part2.md`。

## 工作流

路径：`.github/workflows/deploy-pages.yml`。触发：push 到 `main` 或 `workflow_dispatch`；仅 README/docs 的提交不重复部署应用。Node.js 使用 24，与本机已验收 Node.js 24.14.0 一致；依赖通过 `npm ci` 按现有锁文件安装。

build job 顺序：checkout → setup-node → npm ci → lint → 单元测试 → 安装 Chrome → 开发 E2E → build → 生产子路径／迁移 E2E → check:dist → upload-pages-artifact。

deploy job 依赖 build 成功：configure-pages → deploy-pages，环境名 `github-pages`，环境 URL 来自 `steps.deployment.outputs.page_url`。并发组 `pages`，不取消正在进行的部署。超时分别为 15、10 分钟。

权限：全局 `contents: read`；deploy job 仅增加 `pages: write`、`id-token: write`，使用 Actions 的短期令牌和 OIDC，不写入 PAT、密码或 Token。官方 Actions 固定到已核对的提交 SHA，注释保留对应 major 版本。

只上传 `dist/`。不提交 dist，不上传浏览器 Profile、JSON、测试截图、trace、测试结果、依赖或整个工作目录。`scripts/check-dist.mjs` 仅允许 index.html、favicon.svg、assets 下的 JS/CSS，拒绝其他文件、链接、异常目录，校验 HTML 资源路径及常见凭据格式。此文件检查与构建过程共同确保浏览器个人词库不会被打包；不是对任意未来代码的数据保护保证。

## 后续部署与手动重跑

1. 当前仓库已为 Public，Pages 已创建，无需再次创建或改变可见性。
2. 仓库 Settings → Pages → Source 应保持 GitHub Actions，HTTPS 已启用。
3. push 已通过检查的 main，或在 Actions 中选择“Deploy VocabularyApp to GitHub Pages”→“Run workflow”。CLI 可使用 `gh workflow run deploy-pages.yml --ref main`。
4. 使用 `gh run list --workflow deploy-pages.yml` 与 `gh run view <run-id> --log-failed` 检查结果；需要重跑时用 Actions 的“Re-run jobs”或 `gh run rerun <run-id>`。
5. 用 Pages API 返回的 `html_url` 和工作流 page_url 核对最终 HTTPS 地址。打开页面并执行下述真实环境验证，不能只看 Actions 绿色。

## 验证命令与隔离环境

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
npm run check:dist
npm run test:pages
```

运行浏览器测试前释放 5173、5174；不复用手动启动的服务。所有测试使用独立的 Playwright Profile，数据仅为测试词条。没有使用用户日常词库做删除、导入或其他测试。

`npm run test:pages` 默认目标为 `http://localhost:5174/VocabularyApp/`。实际部署后：

```powershell
$env:VOCABULARY_PAGES_URL = 'https://lnlsn-l.github.io/VocabularyApp/'
npm run test:pages
Remove-Item Env:\VOCABULARY_PAGES_URL
```

同一套测试验证首次空库、JS/CSS/favicon、页面与资源错误、无第三方请求、CRUD、搜索、A–Z/#、四种排序、桌面与 360px 布局、刷新和标签页／浏览器进程重开、两个独立 Profile、localhost 导出到目标 Origin 导入、全部元数据一致、目标导出到 localhost 导入、重复与非法 JSON。2026-10-07 对实际 `https://lnlsn-l.github.io/VocabularyApp/` 执行上述环境变量命令，4 项全部通过；线上 1440px/360px 页面、表单和详情截图已检查。后续应用变更仍应按需重新验收。

1.1.0 的 `test:pages` 同时运行 `stage2.spec.ts`：备份快照/多标签页、预览取消与重确认、连续添加、单项筛选、Ctrl/Meta+K、IME 事件/Enter、真实剪贴板及异常、真实 v1 升级、其他应用哨兵、提醒暂停、下载失败、BOM/20MB 边界和移动端。上述 4 项是第一部分历史结果；第二部分的当前结果与目标 commit 以 `stage2-part2-report.md` 为准。部署 workflow 及最小权限保持不变。

## 迁移和备份

先在原 `http://localhost:5173/`、原浏览器 Profile 中导出 JSON，保留文件，再打开部署后的 HTTPS 地址导入。切换到全部词条核对数量，并抽查释义、备注、状态、查看次数和时间。新词元数据保留，同名词仍按第一版规则跳过并保留目标库内容。确认无误后才决定旧地址是否继续使用；保留外部备份。网页不自动寻找文件，也不跨 Origin 读取 localhost。

1.1.0 导入前须核对预览并确认合并；预览后词库发生变化时需要再次确认。应用内记录的“最近发起导出”不保证文件已保存。首次升级的非空库初始化为待导出，历史导出时间未知。旧版本标签页可能因 schema 升级需要刷新；不通过清理网站数据处理。

Repository 保存代码，Pages 提供网页，IndexedDB 保存用户数据；三者职责独立。不同浏览器/Profile 拥有独立数据，同一 Origin 下的路径通常不隔离存储；共享同一 Profile 的人共用词库。清理网站数据、删除 Profile、系统重装或存储回收可能丢失数据，需定期 JSON 备份。没有自动同步或 GitHub 词库备份。

## 故障排查

| 现象 | 检查与处理 |
| --- | --- |
| Private 创建 Pages 返回 422 | 当前方案不支持，按上述选择处理，不能擅自改 Public |
| configure-pages 返回 404 | 检查 Settings → Pages 的 source 和账户资格，确认站点仍存在 |
| Actions 失败 | 查具体失败 job／日志，修复并重新测试；不能绕过质量门槛 |
| JS/CSS/favicon 404 或空白 | 检查 build/preview base 和 `/VocabularyApp/` 的大小写，运行 check:dist |
| Pages 暂时 404 | 核对 API 地址、工作流状态、部署时间；不能宣称已经上线 |
| 新地址没有旧词库 | Origin 不同，返回旧浏览器地址导出再导入，不要删除数据库 |
| 导入后少于预期 | 核对重复／无效统计、学习状态和字母筛选，合并不会覆盖已有词 |
| 本地 5173 被占用 | 确认占用进程，停止同项目旧服务后再测试，不自动换端口 |
| Windows 构建 spawn EPERM | 使用允许子进程的本地执行环境，不通过重建项目处理 |

官方依据：[Vite 静态部署](https://vite.dev/guide/static-deploy.html)、[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
