# 第一版验收记录

正式规范：`docs/requirements.md`。验收日期：2026-10-07（Asia/Shanghai）。

## 执行环境

Windows，Node.js 24.14.0、npm 11.18.0、Git 2.54.0.windows.1。GitHub CLI 2.102.0 通过完整路径调用；GitHub 登录验证使用联网环境。项目根目录始终为 `D:\VocabularyApp`。

## 自动化覆盖

| 验收内容 | 验证方式 |
| --- | --- |
| 启动开发服务器和首页加载 | Playwright + Chrome |
| 添加 substrate／衬底 | 表单端到端测试 |
| 刷新仍存在 | 真实 IndexedDB + 页面刷新 |
| 关闭整个浏览器进程再打开仍存在 | 两次启动同一个独立测试配置文件 |
| Substrate、首尾空格重复 | 表单提示与并发数据层测试 |
| 编辑重复词不覆盖原数据 | Repository／Service 测试 |
| sub、strate、SUB、中文衬底 | 实时搜索端到端测试 |
| ele、interference、电磁、干扰、备注 | 实时搜索端到端测试 |
| E、#、状态组合筛选、清除筛选 | 筛选端到端及排序单元测试 |
| 已掌握退出默认学习中列表 | 状态端到端测试 |
| 中文释义编辑 | 表单端到端测试 |
| 只打开详情增加计数并记录最后查看 | 页面测试与并发计数测试 |
| 删除需二次确认，取消不删除 | 页面测试 |
| JSON 实际下载、外层元数据 | 下载文件检查 |
| 删除后导入恢复、再次导入去重 | 页面恢复测试 |
| 格式、版本、必要字段、非法记录校验 | 备份单元测试 |
| 保留旧释义，ID 冲突不覆盖，文件内部去重 | 合并导入测试 |
| 导入中途失败全部回滚 | 事务故障注入测试 |
| IndexedDB 初始化失败及权限恢复重试 | Chrome 故障注入 |
| 写入失败保留表单并显示错误 | Chrome 故障注入 |
| 手机 360px 不溢出、长短语换行、Esc 取消 | 页面测试及截图检查 |
| TypeScript、生产构建、ESLint | build、lint |

命令：`npm run build`、`npm run lint`、`npm test`、`npm run test:e2e`。单元／数据层测试使用 fake-indexeddb；浏览器测试使用真实 IndexedDB 和独立配置文件。自动化生成的全部词条均为测试数据，不写入用户日常浏览器。

最终结果：TypeScript／生产构建和 ESLint 通过，21 项单元／数据层测试通过，11 项开发环境 Chrome 测试通过；npm audit 报告 0 个已知漏洞。桌面 1440px 与手机 360px 截图已检查。

生产构建还通过设置 `VOCABULARY_PREVIEW_TEST=1` 使用静态预览，运行 8 项完全通过界面操作的浏览器测试（不依赖开发环境源码模块）。

## 验证边界

- 未实际重启用户电脑；跨浏览器进程持久化已验证，跨系统重启依赖浏览器正常保存站点数据。
- 未提供云同步、自动磁盘备份或覆盖恢复。
- 隐私模式、手动清除网站数据和浏览器存储回收不能提供永不丢失保证，README 明确要求定期 JSON 备份。
- 当前未开发 PWA；远程站点首次加载不是离线启动。本机 HTTP 静态预览和已加载界面的业务操作不依赖互联网或外部 API。
- 构建需要本地子进程；Codex Windows 沙箱中出现 EPERM 时使用允许子进程的执行环境重新验证。

## 分阶段提交

初始化 → IndexedDB 数据层 → CRUD → 实时搜索 → 字母与组合筛选 → 真实查看统计 → JSON 备份 → 响应式界面与错误提示 → 文档及最终验收 → GitHub Private 推送。

个人词库位于浏览器，备份目录、依赖、构建输出、测试产物和临时缓存均在 Git 忽略范围内。

## 第二阶段第二部分：1.1.0 本次验收

日期：2026-10-07（Asia/Shanghai）；基线 f4a8c27，schema 2 / JSON 1；Windows、Node 24.14.0、Chrome 154.0.8037.98。历史结果不作为本次通过依据。

| 本次命令 | 结果 |
| --- | --- |
| npm run lint | 通过 |
| npm test | 7 个文件，36 项 unit/data 通过 |
| npm run build | TypeScript 与生产构建通过 |
| npm run check:dist | 仅 index.html、favicon.svg、JS/CSS，路径与凭据检查通过 |
| npm run test:e2e | 21 项开发 Chrome 测试通过 |
| npm run test:pages | 14 项生产子路径、JSON 双向迁移及 stage2 测试通过 |
| VOCABULARY_PREVIEW_TEST=1 的 test:e2e | 18 项静态生产预览测试通过 |
| git diff --check | 通过 |

新增覆盖：真实 v1→v2 数据无损及唯一索引、写入与 metadata 整笔回滚、并发修订、导出快照外新变化、无操作/零新增、预览只读/取消、冲突与文件内重复/ID 冲突、事务内重确认、暂停跨刷新、全库导出及失败、连续添加成功/重复/失败、编辑边界、单项筛选与排序、搜索快捷键、IME 事件/Enter、clipboard 实际读写+权限/不支持注入、其他应用 DB/local/session 哨兵、BOM 与真实 20MB+1 文件拒绝。

所有 stage2 用例检查 pageerror/console error。迁移夹具是同 Origin 的隔离空白页，先建立 v1 库再实际加载应用；测试初次直接打开 SVG 引起浏览器 favicon.ico 探测 404，改用明确图标的空白夹具后复验通过，没有屏蔽应用资源错误。桌面1440px/手机360px、预览差异、复制详情和表单截图已检查。

1000/5000/10000 条程序化内存基础验证覆盖搜索/组合筛选和导入分析，具体测量见 stage2-part2.md。不是完整 DOM 大库渲染、长期压力或所有浏览器性能保证。IME 覆盖真实 Chrome 中注入的组合事件和真实 Enter，并未驱动操作系统候选窗口。物理中文输入法、其他浏览器/手机型号、实际电脑重启仍未验证。

CI、真实 Pages HTTPS、部署 artifact 和验收后 tag 的最终证据见 [stage2-part2-report.md](stage2-part2-report.md)。本阶段未重新执行依赖漏洞审计，第一版 audit 结果仅为历史记录。生产依赖无变化。

发布提交 228799a 对应 Actions 37575769883 全部成功；真实 Pages HTTPS 执行同一 test:pages，14 项通过（24.1 秒）。线上截图与新版资源检查通过，下载本次 artifact 四文件 SHA256 与本地相同。验收后才创建并推送 v1.1.0，指向 228799a；文档随后独立提交，不改变已验收应用。
