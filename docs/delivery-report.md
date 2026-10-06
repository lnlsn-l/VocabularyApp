# 第一版交付报告

交付日期：2026-10-07（Asia/Shanghai）。正式需求：`docs/requirements.md`。

## 本地项目与运行

路径：**D:\VocabularyApp**，已确认不存在 `D:\VocabularyApp\VocabularyApp` 嵌套目录。

```text
D:\VocabularyApp
├── src/
│   ├── components/   搜索、字母／状态筛选、列表／卡片、表单、详情、确认弹窗、备份
│   ├── pages/        Home
│   ├── hooks/        词库订阅
│   ├── db/           数据库及 v1 schema
│   ├── repositories/ Repository 接口及本地实现
│   ├── services/     词库业务层及测试
│   ├── types/        VocabularyEntry 等类型
│   ├── utils/        搜索、备份、校验及测试
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── public/favicon.svg
├── docs/requirements.md
├── docs/verification.md
├── docs/delivery-report.md
├── tests/app.spec.ts
├── backups/          本地空备份目录，整体 Git 忽略
├── package.json / package-lock.json
├── tsconfig.json / vite.config.ts
├── playwright.config.ts / eslint.config.js
├── .gitignore / .gitattributes
└── README.md
```

`node_modules/`、`dist/`、`.tools/`、`test-results/` 为本地安装／构建／验证产物，均不上传 GitHub。

安装与启动：

```powershell
cd D:\VocabularyApp
npm ci
npm run dev
```

打开 `http://localhost:5173`。构建：`npm run build`；静态预览：`npm run preview`。开发与预览固定相同 Origin，端口冲突时明确退出。

## npm 依赖

运行依赖：`react@19.3.0`、`react-dom@19.3.0`、`dexie@4.4.6`。

开发依赖：`typescript@6.0.3`、`vite@8.3.3`、`@vitejs/plugin-react@6.1.2`、`@types/react@19.3.0`、`@types/react-dom@19.3.0`、`@types/node@26.6.4`、`eslint@10.12.0`、`@eslint/js@10.0.1`、`typescript-eslint@8.71.1`、`eslint-plugin-react-hooks@7.1.1`、`globals@17.13.0`、`vitest@5.0.3`、`fake-indexeddb@6.2.5`、`@playwright/test@1.63.0`。锁定版本记录在 `package-lock.json`。

## 数据与备份

- 数据库：**VocabularyDB**。
- 表：**vocabulary**，Dexie schema v1，UUID 主键和不区分大小写的唯一词索引。
- 主数据位于当前浏览器用户配置文件的 IndexedDB 站点存储，不在代码目录或 GitHub。
- 点击“导出词库”下载 `vocabulary-backup-YYYY-MM-DD.json`，包含 `version: 1`、`exportedAt`、`app` 和 `entries`。请手动保存到 `D:\VocabularyApp\backups` 或其他安全位置。
- 点击“导入 JSON”选择备份，合并恢复到 IndexedDB，旧词不覆盖，重复和无效记录分别统计。写入失败时整个导入事务回滚。
- 更换浏览器、电脑、协议、主机名、端口或部署域名时，用 JSON 迁移。`git clone` 只获取代码，不能恢复词库。

## 完成范围

已实现需求第一版全部核心功能：添加／编辑、学习状态、确认删除、列表、必填校验、重复检测与已有词定位；英文完整／前缀／部分、中文和备注实时搜索；全部／A–Z／# 与状态组合筛选、清除筛选、稳定默认排序及三个辅助排序；显式打开详情时的查看次数／最后查看时间；IndexedDB 持久化；版本化 JSON 导入导出、校验、去重、统计；错误提示、加载／空状态、响应式界面和键盘取消。

UI、Service、Repository 和 Dexie 分离。跨页面订阅会刷新数据；编辑保留统计元数据，导入 ID 冲突不会覆盖其他词。

按需求未实现：登录／注册、业务后端、云数据库／云同步、在线词典、翻译／AI API、音标／发音、记忆曲线／Anki、PDF、浏览器扩展、原生客户端、PWA、社交或复杂统计。

## 验证结果

- TypeScript、`npm run build`、`npm run lint` 通过。
- `npm test`：21 项单元／数据层测试通过。
- 开发环境 Chrome：11 项端到端测试通过。
- 生产构建静态预览：8 项真实界面操作测试通过。
- `npm audit`：0 个已知漏洞。
- 已验证刷新和关闭整个浏览器进程再打开后数据存在；已验证 JSON 实际下载与恢复、重复导入、非法数据和事务回滚。
- 已检查 1440px 桌面及 360px 手机截图。
- 未实际重启用户电脑。存储跨重启依赖正常浏览器配置文件；清理网站数据、隐私模式和浏览器存储回收仍可能导致数据丢失，必须定期备份。

详细测试矩阵见 `docs/verification.md`。

## Git 与 GitHub

分支：**main**，跟踪 **origin/main**。

主要阶段提交：

| 提交 | 阶段 |
| --- | --- |
| db5ed9d | 初始化 React／TypeScript／Vite |
| 6c75b4d | IndexedDB、Repository 和 Service |
| 231dcd2 | 词条 CRUD |
| dd8fd48 | 实时多字段搜索 |
| 2a23211 | 字母分类、状态和组合筛选 |
| 68433e7 | 真实查看次数及时间 |
| e8c9fb0 | JSON 备份导入导出与校验 |
| 7b7caf5 | 响应式界面及存储错误反馈 |
| dbee77c | README 和最终 MVP 验收 |

随后以 `docs: record private repository delivery` 提交本报告及远端交付信息。

仓库：[lnlsn-l/VocabularyApp](https://github.com/lnlsn-l/VocabularyApp)。已通过 GitHub API 核实 **isPrivate = true**，默认分支 **main**，首次 push 成功且远端提交与本地一致。

`origin`：`https://github.com/lnlsn-l/VocabularyApp.git`。GitHub CLI 使用本机已有登录账号，账号密码／Token 不写入项目。后续推送使用当前仓库本地配置的 gh 凭据助手，不改变全局 Git 设置。

已核查远端完整文件树和本地提交内容：没有 `node_modules/`、`dist/`、`backups/`、个人 JSON、环境文件或测试浏览器配置；常见密钥／Token 格式扫描未发现匹配。备份和敏感环境文件的忽略规则也已验证。

GitHub 工作已完成，没有待登录、待创建或待推送步骤。最终交付后工作区干净，与 `origin/main` 同步。

## 后续优先建议

1. PWA 和离线启动。
2. 专业标签与来源论文。
3. 备份提醒、导入预览及导入前备份。
4. 可选在线词典辅助，保留手动释义。
5. 保留本地优先能力的跨设备同步。

以上仅列规划，本次没有开发。
