# 第二阶段第二部分实施记录

日期：2026-10-07（Asia/Shanghai）。正式规范：[VocabularyApp-Stage2-Part2-Requirements.md](VocabularyApp-Stage2-Part2-Requirements.md)。

## 开发前基线

- 项目固定为 `D:\VocabularyApp`；main 与真实远端 main 为 `f4a8c27617f8678889dcfecece565e1a1d565f11`。
- package 1.0.0，Dexie schema 1，JSON format 1。应用内容与历史 Pages 发布 4bd1d27 一致；此后的提交仅修改文档。
- 已完整核对 README、全部历史 docs、正式需求及 project-context、数据层、备份/搜索、测试、Vite 和 Actions；锁文件根包与依赖清单一致。
- 新需求与 project-context 是用户新增文件，保留并纳入文档。其他工作区干净；没有重新初始化或另建目录。
- Node 24.14.0 / npm 11.18.0 / Git 2.54.0 / gh 2.102.0；允许联网后 gh 身份正常，远端为 Public，Pages HTTPS workflow 配置正常；v1.1.0 标签不存在。
- 本次开发前 lint、21 项 unit/data 测试、build、check:dist 通过。首页 HTTP 200；完整新版线上验收在发布后执行。
- 原端口 5173 为已核实的本项目 Vite，测试期间暂停，由 Playwright 自行启动隔离服务。所有数据测试使用专属数据库或独立 Profile。

## 第一批：备份状态与提醒

Dexie schema 无损升级到 2，保留 `VocabularyDB/vocabulary` 及唯一索引，新增 `VocabularyDB/vocabularyAppMetadata` 表（主键 key），唯一记录 `VocabularyApp.backupState`。没有 localStorage/sessionStorage、通用 origin key 或清理其他应用数据的操作。

元数据记录 dataRevision、contentRevision、lastExportedRevision、lastExportedContentRevision、lastExportRequestedAt、firstPendingContentAt、reminderDismissedUntil。旧非空库初始化两种 revision 为 1、已导出 revision 为 0、待导出起点为迁移时刻，历史导出时间未知；空库为 0，不提醒。

新增、实际编辑/状态变化、删除、含新词的整笔导入各增加一次内容及数据 revision；查看统计只增加数据 revision、不改 updatedAt。无变化保存、纯读、重复/无效零新增导入、失败不增加。导入一次内容操作不等于导入词条数量，UI 不用 revision 差推断词条操作明细。

词条与 revision 在同一 IndexedDB 读写事务更新，错误整笔回滚；同库多连接事务串行保证不丢修订，liveQuery 更新备份 UI。导出在只读事务获取全库与 revision 快照，序列化和下载请求成功后才记录该快照 revision；之后的新写入不被标为已导出。状态记录失败单独说明下载已发起但状态未保存；并发旧快照不能回退已记录 revision。

提醒规则集中在 backupReminder.ts：存在待导出数据且有待导出内容操作，距最近导出或首次待导出满 14 天，或累计 50 次内容操作。统计变化不会累计内容阈值；空库不提醒。稍后提醒持久化暂停 7 天，不改变导出 revision/时间；恢复后仍按同一条件判断。准确称为“最近发起导出”，发起下载不能确认外部文件保存。

第一批 lint/build 通过，unit/data 27 项通过，开发 E2E 11 项通过。新增覆盖真实 v1→v2 全字段/唯一索引、无效/无操作变化、元数据失败回滚、导出并发、双连接和提醒规则。

## 后续批次

第二批实现导入分析、预览、差异和事务内确认重校验；第三批实现筛选/排序反馈、连续添加、复制和 IME；第四批完整回归、1.1.0、CI、真实 Pages 验收、验收后标签与最终报告。未实现的可选项和最终结果将在完成报告中说明。
