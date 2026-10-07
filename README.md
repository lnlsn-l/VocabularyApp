# VocabularyApp

面向英文文献阅读的个人专业词库。第一版正式规范是 [docs/requirements.md](docs/requirements.md)，适用于电子信息专业的单词、术语和短语积累。

第一版完整说明、使用规则、数据与备份机制、验收边界及第二版候选方案见 [第一版说明报告](docs/v1-report.md)。

纯前端、本地优先，无登录、后端、云数据库和付费 API。可直接在线使用，也可在本地运行。在线网页资源加载需要网络；词库增删改查不调用远程服务。首次安装本地依赖需要网络。

## 在线使用

直接打开 [VocabularyApp 在线网站](https://lnlsn-l.github.io/VocabularyApp/)。**已于 2026-10-07 上线并通过真实 HTTPS 浏览器验收**，无需安装 Node.js 或运行 npm。仓库经用户明确授权由 Private 改为 Public，通过 GitHub Actions 自动部署。完整结果见 [第二阶段第一部分交付报告](docs/stage2-part1.md)。

在线页面首次加载／重新加载需要网络；本阶段没有 PWA、Service Worker 或离线资源缓存。

## 数据保存方式、上传与同步

词库主数据保存在**当前浏览器的 IndexedDB**，不会自动上传到 GitHub、Pages、Actions 或远程数据库。没有分析、广告或跟踪服务。不同设备、浏览器和 Profile 不会自动同步；共用同一浏览器 Profile 的人也共用此词库。

| 内容 | 职责 |
| --- | --- |
| GitHub Repository | 保存程序源代码和配置 |
| GitHub Pages | 通过 HTTPS 提供构建后的 HTML、CSS、JS 和图标 |
| IndexedDB | 在当前浏览器保存用户自己的词库 |
| JSON | 由用户主动导出、保管、导入的备份与迁移文件 |

部署工作流只上传 `dist/` 静态资源，发布前检查文件白名单；个人浏览器数据库、`backups/`、测试 Profile 和测试结果不进入部署产物。清理网站数据、删除 Profile 或系统重装等仍可能导致数据丢失，请定期导出 JSON。应用内“数据说明”可随时展开查看。

## 从本地版本迁移到 GitHub Pages

**localhost 与 Pages 属于不同 Origin，数据不会自动迁移。** 新网址的空词库不代表旧词库已删除。测试已验证迁移机制，个人词库仍需你在原浏览器中主动导出并选择文件导入。

1. 用原来的浏览器和 Profile 打开旧地址 `http://localhost:5173/`。需要时先按下方步骤启动本地开发服务器。
2. 点击“导出词库”，保存 `vocabulary-backup-YYYY-MM-DD.json`，建议再保留一份到其他磁盘。
3. 打开已验证可访问的 [GitHub Pages 地址](https://lnlsn-l.github.io/VocabularyApp/)。
4. 点击顶部“导入 JSON”，或首次空词库中的“导入 JSON 备份”，选择刚才的文件。
5. 核对成功、重复、无效数量；切换到“全部”或“清除筛选”，核对总词条数，再抽查释义、备注、状态与查看统计。
6. 确认迁移完成后再决定是否继续使用旧地址；保留 JSON 备份。本应用不会自动删除旧地址数据。

导入仍为 version 1 的合并导入：同名词保留目标库现有内容，新增词保留备份元数据。在线版本导出的 JSON 也可以导回本地版本。换电脑、浏览器或 Profile 同样通过 JSON 迁移。网站不会自动寻找电脑中的文件或跨 Origin 读取旧词库。

`http://localhost:5173` 与 `https://lnlsn-l.github.io` 的站点存储独立。`/VocabularyApp/` 是网页路径，不是存储隔离边界；同一 `https://lnlsn-l.github.io` Origin 下的其他路径通常共用站点存储。

## 快速开始

项目直接位于 `D:\VocabularyApp`，没有额外的 `VocabularyApp` 子目录。建议使用 Node.js 24 LTS（本机验证版本 24.14.0）、npm 和 Git。

```powershell
cd D:\VocabularyApp
npm ci
npm run dev
```

开发打开 **http://localhost:5173/**；构建后预览打开 **http://localhost:5173/VocabularyApp/**。两者仍是同一个 Origin，沿用原词库。端口冲突时会明确退出，不会悄悄切换到另一个端口造成“词库丢失”的误解。请关闭占用该端口的旧服务再启动。

```powershell
npm run build
npm run preview
```

构建输出在 `dist/`，可交给静态服务器或静态托管平台。不要直接双击 `dist/index.html`，应通过 HTTP/HTTPS 打开。此处的 Node.js 仅用于开发、构建和静态预览，不提供业务后端。当前没有 PWA/service worker；远程页面的首次加载仍需网络，本地服务器运行时无需互联网。

## 第一版功能

- 添加和编辑英文单词、术语、短语、中文释义、备注和学习状态；自动保存。
- 英文和释义必填；保存时去除首尾空格；重复检测忽略大小写，提供查看已有词条入口。
- 学习中／已掌握切换；默认显示学习中；永久删除需要二次确认。
- 单一实时搜索框支持英文完整、前缀、部分匹配，以及中文释义和备注匹配。
- 全部、A–Z、`#` 分类；数字和特殊字符开头进入 `#`，与搜索、状态组合筛选。
- 默认稳定英文 A–Z 排序；也支持最近添加、最近查看和查看次数最多。
- 点击英文标题打开详情时才增加 `searchCount` 并更新 `lastSearchedAt`。搜索结果、编辑和状态切换不增加次数。
- JSON 导出和合并导入，严格校验版本和字段，并统计成功、重复和无效记录。
- 桌面／手机布局、加载与空状态、键盘操作、可读的错误提示和失败重试。
- 同一浏览器同一地址的多个页面通过 Dexie liveQuery 自动更新列表。

## 代码、主数据和备份

**词库主数据保存在浏览器 IndexedDB 中。项目代码不会自动包含个人词库。**

- 数据库名：`VocabularyDB`。
- 表：`vocabulary`，通过 `db.version(1)` 建立。
- 主键：UUID `id`。内部 `normalizedWord` 唯一索引用于 `trim + lowercase` 去重；备份不包含内部索引。
- 字段：`id`、`word`、`meaning`、`note`、`status`、`searchCount`、`createdAt`、`updatedAt`、可选 `lastSearchedAt`。
- 数据实际位于**当前浏览器用户配置文件的站点存储**，不在 `src/` 或 `backups/`。不同浏览器／用户配置文件分别保存。可在浏览器开发者工具的 Application → IndexedDB 中查看。
- 刷新、关闭页面、关闭后重开浏览器不会主动清空词库。普通浏览器配置文件的存储也会跨电脑重启保留；实际电脑重启未作为自动化测试执行。
- 不要在隐私／无痕模式里保存长期词库；清除网站数据、删除浏览器配置文件、卸载浏览器、系统重装或浏览器存储回收都可能使本地数据消失。请定期导出 JSON，至少另存一份到其他磁盘。
- schema 升级应使用 Dexie `version(n).upgrade(...)` 迁移，禁止删除数据库来升级。

**GitHub 不会自动同步 IndexedDB。`git clone` 只能获得代码，换电脑不能仅靠 clone 恢复词库，必须用 JSON 导出／导入迁移。**

IndexedDB 按 Origin 隔离，协议、主机名、端口任何一个不同都会改变词库。例如 `http://localhost:5173`、`http://127.0.0.1:5173`、`http://localhost:4173`、`https://xxx.github.io` 是独立存储；同一 Origin 下路径通常不隔离。如果迁移到正式部署域名：先在旧地址导出 JSON，再在新地址导入。空词库不代表旧地址的数据被删除。

## JSON 备份与恢复

1. 点击“导出词库”，下载 `vocabulary-backup-YYYY-MM-DD.json`（按浏览器本地日期命名）。
2. 浏览器通常保存到下载目录。请手动将文件保存／移动到 `D:\VocabularyApp\backups` 或其他安全位置，网页不会擅自写入该目录。
3. 在目标浏览器或新地址打开应用，点击“导入 JSON”，选择备份。
4. 查看“成功导入：X；重复跳过：X；无效数据：X”。导入是**合并**，不是覆盖恢复；重复词保留原有释义、状态和统计，新记录保留备份元数据。

```json
{
  "version": 1,
  "exportedAt": "2026-10-07T00:00:00.000Z",
  "app": "VocabularyApp",
  "entries": []
}
```

无法解析、裸数组、不支持的版本或外层结构错误会拒绝整个文件；词条字段错误则逐条跳过并统计。支持 UTF-8 BOM。单文件上限 20 MB。当前库和文件内部都按 `trim + lowercase` 去重，不同词发生 ID 冲突会重新分配 UUID，绝不覆盖原记录。合并在单个事务中进行，中途失败会回滚。

本地已预留 `backups/`；该目录整体被 Git 忽略，真实词库备份不提交。Git 不保存空目录，所以新 clone 后按需创建：

```powershell
New-Item -ItemType Directory -Path backups -Force
```

## 目录与分层

```text
D:\VocabularyApp
├── src/
│   ├── components/        搜索、筛选、表单、卡片、详情、确认及备份
│   ├── pages/Home.tsx     首页组合
│   ├── hooks/            数据订阅
│   ├── types/            词条和导入结果类型
│   ├── db/               VocabularyDB 与 v1 schema
│   ├── repositories/     Repository 接口和 Dexie 实现
│   ├── services/         业务校验及统一数据访问
│   ├── utils/            搜索、备份、校验及单元测试
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── public/favicon.svg
├── docs/                 正式需求与验收记录
├── tests/app.spec.ts      真实浏览器测试
├── backups/              手工备份，Git 忽略
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── eslint.config.js
├── .gitattributes
├── .gitignore
└── README.md
```

UI → VocabularyService → VocabularyRepository → LocalVocabularyRepository → Dexie → IndexedDB。页面不直接写数据库；未来云端访问可以替换 Repository，保留手动释义和本地存储的独立职责。

运行依赖：React、React DOM、Dexie。开发依赖：TypeScript、Vite、React Vite 插件、相关类型包、ESLint／typescript-eslint／React Hooks 规则／globals、Vitest、fake-indexeddb、Playwright。实际版本以 `package-lock.json` 为准。

## 验证

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
npm run check:dist
npm run test:pages
```

端到端测试使用已安装的 Google Chrome（`channel: chrome`），自动启动独立的 `localhost:5173` 开发服务器，执行前请关闭手动启动的同端口服务。测试使用独立浏览器配置文件，不会写入日常词库。详细覆盖与边界见 [docs/verification.md](docs/verification.md)。`test-results/`、截图和测试配置文件均被忽略。

生产构建的界面验收（先执行 build）：

```powershell
$env:VOCABULARY_PREVIEW_TEST = '1'
npm run test:e2e
Remove-Item Env:\VOCABULARY_PREVIEW_TEST
```

`test:pages` 验证构建后的 `/VocabularyApp/`，自动启动 5173 开发服务器和 5174 生产预览，通过独立 Profile 验证跨 Origin JSON 双向迁移与数据隔离。这是本地生产模拟，不能代替实际 Pages HTTPS 验收。真实部署后可设置 `VOCABULARY_PAGES_URL=https://lnlsn-l.github.io/VocabularyApp/` 再执行同一套测试。请先释放相关端口；测试不使用日常浏览器 Profile。

## 自动部署

`.github/workflows/deploy-pages.yml` 在应用修改推送到 `main` 或手动运行时执行 Node.js 24、`npm ci`、lint、单元测试、开发浏览器测试、生产构建、生产子路径／迁移测试及部署文件检查；全部通过后才上传 `dist/` 并尝试部署。仅 README/docs 的提交不重复部署。`dist/` 始终被 Git 忽略。部署方法、账户限制与故障排查见 [部署文档](docs/deployment.md)。

## Git 与 GitHub

本地分支统一 `main`，每个提交对应实际开发阶段。

```powershell
git status
git log --oneline
git add src docs README.md
git commit -m "feat: describe the change"
git push origin main
```

当前仓库为 **VocabularyApp，Public 公开仓库**。第一版交付时为 Private；2026-10-07 经用户明确授权改为 Public，使用免费 GitHub Pages。源代码与 Git 历史公开，个人词库仍保存在浏览器，不自动备份至 GitHub。`.gitignore` 排除 `node_modules/`、`dist/`、`.env`、`.env.*`、`backups/`、日志、临时文件、IDE 缓存和测试产物。不要使用 `git add -f` 提交个人备份或密钥。

已创建并推送：[lnlsn-l/VocabularyApp](https://github.com/lnlsn-l/VocabularyApp)。`origin` 为 `https://github.com/lnlsn-l/VocabularyApp.git`，默认分支 `main`，已验证当前 Public 属性和文件清单。第一版历史交付信息见 [docs/delivery-report.md](docs/delivery-report.md)，当前部署信息见 [docs/stage2-part1.md](docs/stage2-part1.md)。

如果 `gh` 不在 PATH，本机可用完整路径调用：`& 'C:\Program Files\GitHub CLI\gh.exe' --version`。登录和授权由用户自行完成，不在文件或 Git 中保存 Token。创建仓库时不额外生成 README、gitignore 或 License。

## 后续版本

本版不包含登录、注册、后端、云同步、在线词典、翻译／AI API、音标发音、记忆曲线、Anki、PDF、浏览器扩展、原生客户端或 PWA。

下一版建议依次评估：

1. PWA 与离线应用启动。
2. 专业领域标签和来源论文记录。
3. 备份提醒与导入前备份、预览。
4. 可选在线词典辅助，始终保留手动释义。
5. 保留本地优先能力的跨设备同步（需要另行设计账户、隐私和冲突策略）。
