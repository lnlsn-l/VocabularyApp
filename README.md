# VocabularyApp

面向英文文献阅读的个人专业词库。第一版正式规范是 [docs/requirements.md](docs/requirements.md)，适用于电子信息专业的单词、术语和短语积累。

第一版完整说明、使用规则、数据与备份机制、验收边界及第二版候选方案见 [第一版说明报告](docs/v1-report.md)。

当前在线部署版的完整功能、数据隔离、JSON 下载位置、迁移规则、验收结果及后续优化建议见 [在线部署版详细说明报告](docs/stage2-part1-report.md)。

本地优先，无登录或云端词库。词库增删改查不调用远程服务；1.2.0 增加可选的“有道翻译参考”，用户主动获取时将显示的查询文本发送到独立代理并转交有道，有道可能按量计费。Pages 仍只提供静态网页。代理未配置/不可用时可手动添加，全部本地功能继续可用。首次安装本地依赖需要网络。

当前工作区应用版本 **1.2.0**，新增/编辑表单支持独立修改查询短语、主动获取有道中文翻译参考、人工采用并修订后保存。**正式 Cloudflare 代理已部署，本地新版表单到真实有道的两条查询及人工保存验证通过；1.2.0 未发布新版 Pages，在线已发布基线仍为 1.1.0，页面还没有翻译入口。** 代理现按用户授权保持开启：每日 500 字符、每月 2,000 字符、每来源每自然分钟 10 次，仅允许正式 Pages Origin；配置以 `proxy/wrangler.jsonc` 为准。当前说明见 [stage2-part3.md](docs/stage2-part3.md)，实际版本、网络边界和剩余验收见 [上线与真实联调报告](docs/stage2-part3-launch-report.md)，部署前历史证据见 [阶段报告](docs/stage2-part3-report.md)。1.1.0 的备份提醒、导入预览、连续添加、复制和快捷操作继续保留；历史证据见 [stage2-part2-report.md](docs/stage2-part2-report.md)。

## 1.1 日常操作

- “最近发起导出”仅表示发起 JSON 下载，不能确认文件已保存。下载后请在浏览器下载列表确认；通常位于下载目录，也可能由你选择目录，不会自动写入项目 backups。
- 新增、实际编辑、状态变化、删除、含新词的合并导入和查看统计写入都会产生待导出变化；失败、取消、纯读取和零新增导入不会。无变化保存不会修改时间。
- 备份提醒仅在有待导出内容变化，且距最近导出／首次待导出满 14 天或累计 50 次内容操作时显示。查看统计计入待导出数据，不累计提醒阈值；空库不提醒。选择“稍后提醒”暂停 7 天，刷新仍保留，不代表完成备份。
- 导入先预览原始／有效／新增／重复／无效记录与重复差异，再确认合并。同名词保留当前版本；文件内重复新词保留首条。预览期间词库变化会刷新预览，必须再次确认；取消不会写入。
- 无结果可直接“添加当前搜索词”，预填原文并保留大小写；仍检查全库重复。新增支持“保存并继续添加”，成功后清空并聚焦英文框，失败保留内容；编辑不提供连续添加。
- 详情支持“复制英文”“复制中文释义”，不支持或权限失败时提示手动复制。复制不增加查看次数。
- **Ctrl + K / ⌘ + K** 聚焦搜索并保留查询。弹窗或其他编辑区域内保持当前输入；中文组合输入与选词结束附近的 Enter 不会提交表单。普通非组合 Enter 保留表单提交，Esc 取消弹窗。
- 当前筛选标签可单独清除，或“清除全部”；不改变排序。排序说明解释四种规则，0/1 条结果说明无可见排序变化。搜索、状态、字母、排序不跨刷新记忆，默认学习中／全部字母／英文 A–Z。

新增/编辑中的“英文词汇 / 短语”是最终保存字段；“查询词或短语”是本次发送的文本。查询开始跟随英文，主动修改过后保留独立选择；两者变化会使旧候选失效。翻译抵达不会自动填中文或保存。“采用此翻译”只填入释义框，已有不同中文可取消替换；最终需结合论文语境修订再保存。有道通用翻译不保证专业含义、全部义项、词性或例句。没有查询也能手动保存。

## 在线使用

直接打开 [VocabularyApp 在线网站](https://lnlsn-l.github.io/VocabularyApp/)。**已于 2026-10-07 上线并通过真实 HTTPS 浏览器验收**，无需安装 Node.js 或运行 npm。仓库经用户明确授权由 Private 改为 Public，通过 GitHub Actions 自动部署。完整结果见 [第二阶段第一部分交付报告](docs/stage2-part1.md)。

在线页面首次加载／重新加载需要网络；本阶段没有 PWA、Service Worker 或离线资源缓存。

## 数据保存方式、上传与同步

词库主数据保存在**当前浏览器的 IndexedDB**，不会自动上传到 GitHub、Pages、Actions 或远程数据库。没有分析、广告或跟踪服务。不同设备、浏览器和 Profile 不会自动同步；共用同一浏览器 Profile 的人也共用此词库。

主动翻译仅上传当前显示的查询文本；不发送个人词库、中文释义、备注、备份、数据库 ID 或查看统计。代理与有道可能获得网络元信息；有道条款允许特定的去标识输入输出处理。候选只在表单内存中，JSON仅保留人工确认的词条。服务端保存短期来源哈希和必要额度计数，不存词库。密钥仅放本机服务端配置/平台Secret，不能发送聊天或使用`VITE_*`存放。许可和实际网络边界见部署方案。

| 内容 | 职责 |
| --- | --- |
| GitHub Repository | 保存程序源代码和配置 |
| GitHub Pages | 通过 HTTPS 提供构建后的 HTML、CSS、JS 和图标 |
| IndexedDB | 在当前浏览器保存用户自己的词库 |
| 独立翻译代理 | 可选主动查询、有道签名、共享原子限额；不提供词库同步 |
| JSON | 由用户主动导出、保管、导入的备份与迁移文件 |

部署工作流只上传 `dist/` 静态资源，发布前检查文件白名单；个人浏览器数据库、`backups/`、测试 Profile 和测试结果不进入部署产物。清理网站数据、删除 Profile 或系统重装等仍可能导致数据丢失，请定期导出 JSON。应用内“数据说明”可随时展开查看。

## 从本地版本迁移到 GitHub Pages

**localhost 与 Pages 属于不同 Origin，数据不会自动迁移。** 新网址的空词库不代表旧词库已删除。测试已验证迁移机制，个人词库仍需你在原浏览器中主动导出并选择文件导入。

1. 用原来的浏览器和 Profile 打开旧地址 `http://localhost:5173/`。需要时先按下方步骤启动本地开发服务器。
2. 点击“导出词库”，保存 `vocabulary-backup-YYYY-MM-DD.json`，建议再保留一份到其他磁盘。
3. 打开已验证可访问的 [GitHub Pages 地址](https://lnlsn-l.github.io/VocabularyApp/)。
4. 点击顶部“导入 JSON”，或首次空词库中的“导入 JSON 备份”，选择刚才的文件。
5. 在预览中核对新增、重复、无效和差异，确认合并；完成后核对实际数量。切换到“全部”或“清除筛选”，核对总词条数，再抽查释义、备注、状态与查看统计。
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

构建输出在 `dist/`，可交给静态服务器或静态托管平台。不要直接双击 `dist/index.html`，应通过 HTTP/HTTPS 打开。Node.js 用于开发、构建、静态预览和可选本地翻译代理；正式代理独立部署。当前没有 PWA/service worker；远程页面首次加载仍需网络。已加载页面的本地词库操作不依赖翻译网络。

本地安全代理配置模板为`proxy/config.example.env`（复制为被忽略的`proxy/.env.local`）；前端公开地址模板为`config.example.env`（复制为`.env.local`）。真实Secret只能在本机填写，按部署方案核对许可与费用后主动启用；分别运行`npm run dev:proxy`和`npm run dev`。默认没有真实翻译配置；无需配置即可用`npm run test:translation`验证合成上游的完整流程。正式Pages禁止回退连接用户电脑localhost。

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
- 表：`vocabulary`；schema 从 version 1 无损升级到 version 2，新增独立 `vocabularyAppMetadata`，旧词条字段和唯一索引不变。
- 主键：UUID `id`。内部 `normalizedWord` 唯一索引用于 `trim + lowercase` 去重；备份不包含内部索引。
- 字段：`id`、`word`、`meaning`、`note`、`status`、`searchCount`、`createdAt`、`updatedAt`、可选 `lastSearchedAt`。
- 数据实际位于**当前浏览器用户配置文件的站点存储**，不在 `src/` 或 `backups/`。不同浏览器／用户配置文件分别保存。可在浏览器开发者工具的 Application → IndexedDB 中查看。
- 刷新、关闭页面、关闭后重开浏览器不会主动清空词库。普通浏览器配置文件的存储也会跨电脑重启保留；实际电脑重启未作为自动化测试执行。
- 不要在隐私／无痕模式里保存长期词库；清除网站数据、删除浏览器配置文件、卸载浏览器、系统重装或浏览器存储回收都可能使本地数据消失。请定期导出 JSON，至少另存一份到其他磁盘。
- schema 升级应使用 Dexie `version(n).upgrade(...)` 迁移，禁止删除数据库来升级。

应用元数据唯一记录为 `VocabularyDB/vocabularyAppMetadata/VocabularyApp.backupState`，保存数据／内容修订号、实际导出快照修订号、最近发起导出时间及提醒暂停时间。词条与修订号在同一事务更新，liveQuery 反映多标签页变化。导出只标记实际读取的快照，之后的新变化仍待导出；JSON 不包含元数据。升级前非空库初始化为待导出，历史导出时间未知；空库无待导出数据。

没有生产 localStorage 或 sessionStorage key，也不持久化 UI 偏好。保留 `VocabularyDB` 名称，新表／记录明确归属应用；不操作未知其他应用存储。命名空间用于避免冲突和误清理，同 Origin 的路径或前缀**不提供访问安全隔离**。

**GitHub 不会自动同步 IndexedDB。`git clone` 只能获得代码，换电脑不能仅靠 clone 恢复词库，必须用 JSON 导出／导入迁移。**

IndexedDB 按 Origin 隔离，协议、主机名、端口任何一个不同都会改变词库。例如 `http://localhost:5173`、`http://127.0.0.1:5173`、`http://localhost:4173`、`https://xxx.github.io` 是独立存储；同一 Origin 下路径通常不隔离。如果迁移到正式部署域名：先在旧地址导出 JSON，再在新地址导入。空词库不代表旧地址的数据被删除。

## JSON 备份与恢复

1. 点击“导出词库”，下载 `vocabulary-backup-YYYY-MM-DD.json`（按浏览器本地日期命名）。
2. 浏览器通常保存到下载目录。请手动将文件保存／移动到 `D:\VocabularyApp\backups` 或其他安全位置，网页不会擅自写入该目录。
3. 在目标浏览器或新地址打开应用，点击“导入 JSON”，选择备份；核对预览和差异，点击“确认合并”。其他标签页改变词库时需核对更新后的预览并再次确认。
4. 查看“成功导入：X；重复跳过：X；无效数据：X”。导入是**合并**，不是覆盖恢复；重复词保留原有释义、状态和统计，新记录保留备份元数据。差异比较释义、备注、状态、查看次数及全部时间字段，每页展示 20 条。

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
│   ├── db/               VocabularyDB 与 v1→v2 无损迁移
│   ├── repositories/     Repository 接口和 Dexie 实现
│   ├── services/         业务校验及统一数据访问
│   ├── utils/            搜索、备份、校验及单元测试
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── public/favicon.svg
├── docs/                 正式需求与验收记录
├── tests/                原功能、Pages 迁移与 stage2 浏览器测试
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

运行依赖：React、React DOM、Dexie。开发依赖：TypeScript、Vite、React Vite 插件、相关类型包、ESLint／typescript-eslint／React Hooks 规则／globals、Vitest、fake-indexeddb、Playwright，以及代理本地打包/模拟验证用Wrangler；客户端不包含代理/模拟器。实际版本以 `package-lock.json` 为准。

## 验证

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
npm run check:dist
npm run test:pages
npm run test:proxy
npm run test:worker
npm run test:translation
npm run test:translation:preview
npm run check:secrets
npm run proxy:check
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

`.github/workflows/deploy-pages.yml` 在应用修改推送到 `main` 或`codex/**`、或手动运行时执行 Node.js24/npm ci、lint、单元/代理测试、Worker实际模拟器、代理dry-run、开发浏览器、受控翻译开发/生产子路径测试、生产构建、Secret隔离、生产迁移和dist检查；只有main全部通过才上传`dist/`并部署。功能分支只验证，README/docs不重复执行。GitHub Actions公开变量`VITE_TRANSLATION_API_BASE_URL`只放真实HTTPS代理根地址；未配置时入口提示不可用。代理不由Pages工作流部署，有道Secret/CloudflareToken不进入工作流。既有发布方法见 [部署文档](docs/deployment.md)，新增代理部署见 [Part3方案](docs/stage2-part3-deployment-plan.md)。本阶段实现提交已通过 [CI 37639627358](https://github.com/lnlsn-l/VocabularyApp/actions/runs/37639627358)，Pages上传/deploy按分支门槛跳过；正式线上接入仍未验收。

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

本版不包含登录、注册、云同步、完整在线词典、额外大模型服务、音标发音、记忆曲线、Anki、PDF、浏览器扩展、原生客户端或 PWA。可选通用NMT翻译参考及其独立代理已通过小额度真实联调，尚待新版 Pages 发布授权和实际线上页面验收。

下一版建议依次评估：

1. PWA 与离线应用启动。
2. 专业领域标签和来源论文记录。
3. 完成剩余网络/账户核对，获得新版 Pages 发布授权后完成实际线上页面验收；保留已授权验收档，不自动提高限额。
4. 按实际使用反馈完善翻译辅助，始终保留人工专业释义。
5. 保留本地优先能力的跨设备同步（需要另行设计账户、隐私和冲突策略）。
