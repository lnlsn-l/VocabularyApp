我想开发一个面向英文文献阅读的个人专业词库 Web App。我的专业是电子信息类，平时阅读英文论文时会频繁遇到不认识的单词、术语和短语，希望把这些内容逐渐积累成自己的专业词库。

请你直接在我的本地项目目录中完成第一版 MVP 的实际开发，而不是只给我教程或零散代码。

项目本地目录固定为：

D:\VocabularyApp

请注意：

- 直接在 D:\VocabularyApp 中创建项目。
- 不要再额外创建一层 VocabularyApp 文件夹。
- 正确结构应类似：

D:\VocabularyApp\src

而不是：

D:\VocabularyApp\VocabularyApp\src

---

# 一、项目定位

这是一个“个人英文专业词库”，主要服务于英文论文阅读。

典型使用流程：

1. 阅读英文论文。
2. 遇到不认识的单词、专业术语或短语。
3. 打开 VocabularyApp 搜索。
4. 如果已经收录，就直接查看中文释义，加深印象。
5. 如果未收录，就添加英文内容和中文释义。
6. 后续可以随时修改释义和备注。
7. 熟练掌握后，可以标记为“已掌握”。
8. 如果确实不需要，可以永久删除。
9. 下次再次打开网页时，之前的数据仍然存在。
10. 可以导出 JSON 文件作为词库备份。
11. 可以从 JSON 文件重新导入和恢复词库。

第一版的核心目标是：

简单、稳定、快速、每天都能使用。

不要为了未来可能出现的复杂功能而过度设计第一版。

---

# 二、第一版技术方案

固定使用：

- React
- TypeScript
- Vite
- IndexedDB
- Dexie.js
- CSS 或轻量级样式方案
- Git
- GitHub

第一版必须是：

纯前端、本地优先、无需服务器即可运行。

Node.js 仅作为开发和构建环境使用。

第一版不要引入：

- Express
- Node.js 后端
- Python 后端
- Java 后端
- MySQL
- PostgreSQL
- MongoDB
- SQLite
- Firebase
- Supabase
- 云数据库
- 登录系统
- 用户系统
- 付费 API

---

# 三、数据保存方案

这是本项目非常重要的设计。

## 1. 主数据

日常使用中的词条数据必须保存在：

浏览器 IndexedDB

使用 Dexie.js 进行封装。

例如：

Chrome / Edge
└── IndexedDB
    └── VocabularyDB
        ├── substrate → 衬底
        ├── impedance → 阻抗
        └── permittivity → 介电常数

IndexedDB 是第一版的主数据库。

必须保证：

- 刷新页面后数据仍存在。
- 关闭网页后重新打开，数据仍存在。
- 关闭浏览器后重新打开，数据仍存在。
- 电脑重启后重新打开，数据仍存在。

不能只保存在 React state。
不能只保存在内存。
不能依赖页面一直打开。

---

## 2. JSON 备份

JSON 不是日常主数据库，而是词库的备份格式。

日常流程：

IndexedDB
↓
正常使用和自动保存

需要备份时：

IndexedDB
↓
点击“导出词库”
↓
生成 JSON 文件

例如：

vocabulary-backup-2026-10-07.json

JSON 文件可以用于：

- 手动备份
- 换浏览器
- 换电脑
- 重装系统后恢复
- 从 localhost 迁移到正式部署网站
- 数据迁移

恢复流程：

JSON
↓
导入
↓
恢复到 IndexedDB

---

# 四、备份文件目录

项目中预留：

D:\VocabularyApp\backups

这个目录用于我手动保存导出的 JSON 备份。

例如：

D:\VocabularyApp
├── src
├── public
├── backups
│   ├── vocabulary-backup-2026-10-07.json
│   └── vocabulary-backup-2026-11-01.json
└── ...

但 backups 中的个人词库备份默认不上传 GitHub。

请把：

backups/

加入 .gitignore。

可以在仓库中保留空目录说明，例如：

backups/.gitkeep

或者 README 说明，但不要提交我的真实词库 JSON。

---

# 五、代码和数据必须分离

必须明确区分：

程序代码：

D:\VocabularyApp

个人词库主数据：

浏览器 IndexedDB

个人词库备份：

D:\VocabularyApp\backups 下的 JSON 文件

GitHub：

只保存程序代码和必要项目配置。

不要让 GitHub 默认保存我的个人词库。

---

# 六、浏览器 Origin 问题

IndexedDB 是按网站地址隔离的。

例如开发阶段：

http://localhost:5173

这里有一套 IndexedDB。

以后如果部署到：

https://xxx.github.io/VocabularyApp

或者其他正式域名，

浏览器会把它识别为另一套独立数据。

因此第一版必须依赖：

导出 JSON
↓
在新地址打开网站
↓
导入 JSON

实现数据迁移。

README 中请明确说明这一点。

---

# 七、开始开发前检查环境

首先检查：

node -v

npm -v

git --version

gh --version

如果 Node.js、npm 或 Git 不存在，请明确告诉我具体缺少什么。

不要盲目继续执行。

GitHub CLI gh 如果不存在，可以继续本地开发和本地 Git。

不要因为 gh 不存在而中止项目。

---

# 八、项目初始化

直接在：

D:\VocabularyApp

初始化：

Vite + React + TypeScript

不要生成额外嵌套目录。

确认项目能够：

npm install

npm run dev

并且浏览器可以正常打开。

---

# 九、Git 要求

从项目第一天开始使用 Git。

如果：

D:\VocabularyApp

还不是 Git 仓库，请初始化。

默认分支统一使用：

main

.gitignore 至少需要忽略：

node_modules/
dist/
.env
.env.local
backups/
*.log
临时文件
系统文件
IDE 缓存

不要提交：

node_modules
dist
API Key
Token
密码
个人词库 JSON
临时文件

---

# 十、Git 提交规范

建议按阶段提交。

例如：

init: initialize React TypeScript project

feat: add IndexedDB vocabulary storage

feat: add vocabulary CRUD

feat: add search and filters

feat: add alphabet navigation

feat: add vocabulary backup import and export

style: refine application UI

docs: complete README

fix: resolve final MVP issues

不要为了凑提交次数制造无意义 commit。

每个提交应代表一个相对完整的开发阶段。

---

# 十一、GitHub 要求

本项目第一版开发完成后需要上传 GitHub。

仓库名称：

VocabularyApp

第一版默认：

Private 私有仓库

暂时不要设置为 Public。

---

# 十二、GitHub 创建方式

如果本机：

gh --version

可用，并且 GitHub CLI 已登录，可以直接创建：

VocabularyApp

Private Repository

GitHub 端不要额外创建：

README
.gitignore
License

因为这些由本地项目管理。

远程仓库名称使用：

origin

默认分支：

main

然后进行 push。

---

# 十三、如果 GitHub 未登录

如果 GitHub CLI：

- 未安装
- 未登录
- 需要浏览器授权

请停止在认证步骤前，并明确告诉我需要执行什么操作。

不要擅自处理账号密码。

但不要因此影响本地开发。

至少确保：

本地 Git 仓库
main 分支
本地 commits

已经正常完成。

---

# 十四、GitHub 中应该包含的内容

应上传：

src/
public/
docs/
package.json
package-lock.json
tsconfig.json
vite.config.ts
README.md
.gitignore
必要配置
必要源代码

不应上传：

node_modules/
dist/
.env
.env.local
backups 中的真实数据
API Key
Token
密码
个人词库
浏览器 IndexedDB 数据

---

# 十五、核心架构原则

虽然第一版只使用 IndexedDB，但未来可能升级为：

- 在线网站
- 多用户系统
- 用户注册登录
- 云同步
- 手机和电脑同步
- 在线词典
- AI 辅助释义
- PDF 论文阅读工具
- PWA
- 离线优先应用

因此第一版必须做到：

UI 和数据库逻辑分离。

不要在 React 页面中到处直接写：

db.words.add(...)

db.words.delete(...)

db.words.update(...)

应该设计统一的数据访问层。

推荐：

React UI
↓
VocabularyService
↓
VocabularyRepository
↓
LocalVocabularyRepository
↓
Dexie
↓
IndexedDB

以后如果改成：

React
↓
API
↓
PostgreSQL

应该尽量只需要替换数据层。

---

# 十六、不要过度工程化

虽然需要可扩展，但不要为了架构而架构。

第一版优先：

简单
稳定
容易理解
容易维护
容易升级

不要创建大量没有实际用途的抽象层和文件。

---

# 十七、推荐目录结构

可以根据实际开发做适当调整，但整体建议：

D:\VocabularyApp
│
├── src
│   ├── components
│   │   ├── SearchBar.tsx
│   │   ├── WordCard.tsx
│   │   ├── WordForm.tsx
│   │   ├── WordList.tsx
│   │   ├── AlphabetNav.tsx
│   │   ├── StatusFilter.tsx
│   │   └── ConfirmDialog.tsx
│   │
│   ├── pages
│   │   └── Home.tsx
│   │
│   ├── db
│   │   ├── database.ts
│   │   └── schema.ts
│   │
│   ├── repositories
│   │   ├── vocabularyRepository.ts
│   │   └── localVocabularyRepository.ts
│   │
│   ├── services
│   │   └── vocabularyService.ts
│   │
│   ├── types
│   │   └── vocabulary.ts
│   │
│   ├── utils
│   │   ├── search.ts
│   │   ├── backup.ts
│   │   └── validation.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── public
│
├── docs
│   └── requirements.md
│
├── backups
│
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── .gitignore
└── README.md

不要让 App.tsx 变成几百行的大文件。

---

# 十八、词条数据结构

第一版不要只保存：

word
meaning

推荐：

interface VocabularyEntry {
  id: string;
  word: string;
  meaning: string;
  note: string;
  status: "learning" | "mastered";
  searchCount: number;
  createdAt: string;
  updatedAt: string;
  lastSearchedAt?: string;
}

---

# 十九、字段解释

## id

必须使用稳定唯一 ID。

推荐 UUID。

不要用 word 本身作为数据库唯一主键。

---

## word

英文单词、术语或短语。

例如：

substrate

electromagnetic interference

intrinsic semiconductor

carrier mobility

---

## meaning

中文释义。

例如：

衬底；基板

电磁干扰

本征半导体

载流子迁移率

---

## note

可选备注。

未来可以记录：

半导体论文常见

微波专业含义

当前论文中的具体含义

暂时允许为空。

---

## status

两个状态：

learning

mastered

默认：

learning

---

## searchCount

记录真正查看这个词的次数。

默认：

0

---

## createdAt

创建时间。

自动生成。

---

## updatedAt

最后修改时间。

自动维护。

---

## lastSearchedAt

最近一次真正打开或查看该词条的时间。

允许为空。

---

# 二十、数据库设计

使用 Dexie.js。

数据库名称可以：

VocabularyDB

表名：

vocabulary

第一版必须从一开始使用：

db.version(1)

未来可以：

db.version(2)

数据库结构升级时，应该允许通过 Dexie upgrade 进行迁移。

不能因为未来 schema 修改就自动清空已有词库。

---

# 二十一、第一版核心功能

必须实现：

1. 添加词条
2. 编辑词条
3. 标记已掌握
4. 永久删除
5. 查看全部词条
6. 学习中筛选
7. 已掌握筛选
8. 英文搜索
9. 中文搜索
10. 前缀搜索
11. 部分字符串搜索
12. 实时搜索
13. A-Z 分类
14. 重复检测
15. 搜索次数统计
16. 最后查看时间
17. JSON 导出
18. JSON 导入
19. 数据校验
20. 错误提示
21. IndexedDB 持久化

---

# 二十二、添加词条

添加表单包含：

英文词汇 / 短语

中文释义

备注

状态

其中：

英文必填

中文释义必填

备注选填

状态默认 learning

保存成功后：

立即写入 IndexedDB

无需刷新页面。

---

# 二十三、英文输入规范

保存前应：

trim 首尾空格

重复检测时：

忽略大小写

例如：

substrate

Substrate

SUBSTRATE

 substrate

应视为同一个词。

但显示时可以保留用户输入的合理大小写。

---

# 二十四、重复词检测

如果词库中已有：

substrate

再次添加：

Substrate

应该提示：

该词已经存在于词库中。

同时尽量提供：

查看已有词条

或直接定位已有词条。

不要创建重复记录。

---

# 二十五、编辑词条

允许修改：

word
meaning
note
status

修改后自动更新：

updatedAt

---

# 二十六、已掌握机制

不要把熟悉的词直接删除。

提供：

标记为已掌握

状态：

mastered

默认主视图建议显示：

learning

用户可以切换：

全部
学习中
已掌握

已掌握词仍然保存在数据库中。

---

# 二十七、永久删除

保留真正删除功能。

删除前必须二次确认。

例如：

确定永久删除 “substrate” 吗？

此操作不可撤销。

不要误点击直接删除。

---

# 二十八、搜索功能

搜索是第一版的核心功能之一。

只使用一个搜索框。

支持搜索：

英文 word

中文 meaning

备注 note

---

# 二十九、英文完整搜索

数据库：

substrate

搜索：

substrate

应找到。

---

# 三十、英文前缀搜索

数据库：

electromagnetic interference

electromagnetic wave

electron mobility

输入：

ele

都应显示。

---

# 三十一、英文部分匹配

不能只支持 startsWith。

数据库：

electromagnetic interference

输入：

inter

仍然应该显示。

数据库：

substrate

输入：

strate

应该显示。

---

# 三十二、中文部分搜索

数据库：

electromagnetic interference
电磁干扰

搜索：

电磁

应显示。

搜索：

干扰

也应显示。

---

# 三十三、大小写忽略

搜索：

sub

SUB

Sub

效果一致。

---

# 三十四、实时搜索

用户输入过程中实时更新结果。

例如：

e
el
ele

搜索结果立即变化。

不要求必须点击搜索按钮。

如果实现需要，可以使用：

100～200 ms debounce

但不要过度优化。

---

# 三十五、搜索次数统计

注意：

不要因为一个词出现在搜索结果中就自动增加 searchCount。

只有用户真正：

点击
打开
查看详细内容

时：

searchCount += 1

同时更新：

lastSearchedAt

这样 searchCount 才真正代表：

“这个词我实际查过多少次”。

---

# 三十六、A-Z 分类

提供：

全部

#

A B C D E F G H I J K L M
N O P Q R S T U V W X Y Z

点击：

E

显示首字母为 E 的词条。

例如：

electromagnetic interference

属于：

E

短语按整个词条第一个英文字符分类。

数字或特殊字符开头统一放：

#

---

# 三十七、搜索和字母筛选

需要合理处理：

搜索
A-Z 分类
状态筛选

建议允许组合筛选。

例如：

状态 = 学习中
字母 = E
搜索 = electro

显示同时满足条件的结果。

也可以提供清除筛选。

---

# 三十八、排序

默认排序：

英文 A-Z

第一版如果实现成本低，可以增加：

最近添加

最近查看

搜索次数最多

但不属于必须项。

默认排序必须稳定。

---

# 三十九、词条列表

列表至少显示：

英文

中文释义

状态

可以选择适当显示：

搜索次数

备注摘要

但不要让卡片过于拥挤。

首页重点：

快速查找
快速查看
快速添加

---

# 四十、界面设计

整体风格：

简洁
现代
清晰
适合长期阅读
不过度花哨
桌面优先
兼顾手机宽度

不要大量动画。

不要复杂视觉特效。

不要加入与功能无关的元素。

---

# 四十一、首页建议

整体可以类似：

Vocabulary

[ 搜索单词、短语或中文释义…… ]

全部 | 学习中 | 已掌握

# A B C D E F G H I J K L M N O P ...

[ + 添加词条 ]

substrate
衬底；基板
学习中

impedance
阻抗
学习中

electromagnetic interference
电磁干扰
学习中

---

# 四十二、添加和编辑界面

可以使用：

模态框
抽屉
独立表单

任选一种合理方式。

包含：

英文

中文释义

备注

状态

按钮：

保存

取消

编辑时自动填充原内容。

---

# 四十三、JSON 导出

必须实现：

导出词库

文件命名建议：

vocabulary-backup-YYYY-MM-DD.json

例如：

vocabulary-backup-2026-10-07.json

---

# 四十四、JSON 文件格式

不要只导出裸数组。

建议包含：

{
  "version": 1,
  "exportedAt": "...",
  "app": "VocabularyApp",
  "entries": [...]
}

这样未来可以进行：

数据格式兼容

版本迁移

---

# 四十五、JSON 导入

支持选择之前导出的 JSON 文件。

导入前必须：

验证 JSON 是否能解析

验证 version

验证 entries

验证必要字段

防止非法数据导致应用崩溃。

---

# 四十六、导入策略

第一版使用：

合并导入

而不是默认覆盖整个数据库。

重复判断：

trim + lowercase

重复词不要再创建。

导入后提示：

成功导入：X

重复跳过：X

无效数据：X

例如：

成功导入：153
重复跳过：12
无效数据：2

---

# 四十七、以后可考虑覆盖恢复

第一版不强制。

但代码结构可以允许未来增加：

完全覆盖恢复

导入前自动备份

等高级功能。

---

# 四十八、错误处理

至少处理：

英文为空

中文释义为空

重复词

IndexedDB 初始化失败

IndexedDB 写入失败

修改失败

删除失败

JSON 无法解析

JSON 格式不正确

导入非法数据

所有错误都应给普通用户能看懂的提示。

不能只：

console.error(...)

---

# 四十九、不要实现的功能

第一版明确不要实现：

登录

注册

用户账户

后端服务器

云同步

MySQL

PostgreSQL

Firebase

Supabase

在线词典

词典 API

翻译 API

OpenAI API

DeepSeek API

AI 自动释义

音标

发音

记忆曲线

Anki 模式

PDF 上传

论文解析

Chrome Extension

浏览器插件

微信小程序

Windows 桌面版

手机原生 App

排行榜

社交功能

复杂统计中心

这些留到后续版本。

---

# 五十、未来扩展目标

虽然不实现，但架构应兼容：

## 在线词典

未来可以：

输入 substrate
↓
调用词典 API
↓
返回多个释义
↓
用户选择
↓
保存到词库

meaning 必须始终允许手动编辑。

---

## 专业释义

未来可能增加：

generalMeaning

professionalMeaning

customMeaning

domain

第一版不实现。

---

## 标签

未来可能增加：

半导体

电路

电磁场

通信

微波

第一版不实现。

---

## 来源论文

未来可能记录：

某个词出现在哪篇论文中。

第一版不实现。

---

## 云同步

未来可能：

React
↓
API
↓
PostgreSQL

第一版的数据访问层必须方便替换。

---

## 多用户

未来可能增加：

userId

第一版不实现。

---

## Local-first

未来即使增加云端，也希望保留：

React
↕
IndexedDB
↕
Cloud

离线时可以继续使用。

联网后同步。

第一版 IndexedDB 不是临时方案。

---

## PWA

未来可能支持：

安装到电脑

安装到手机

离线运行

第一版不需要实现 PWA，但不要使用明显妨碍 PWA 的结构。

---

# 五十一、TypeScript 要求

尽量使用明确类型。

避免大量：

any

为主要数据结构建立：

interface

或：

type

对：

数据库
service
repository
导入数据

保持明确类型。

---

# 五十二、代码质量要求

要求：

组件职责清晰

逻辑分层

命名明确

避免重复

不要写巨大 App.tsx

不要把所有逻辑堆进一个文件

数据库逻辑集中

搜索逻辑集中

备份逻辑集中

错误处理统一

必要位置添加注释

不要为了“高级”使用复杂设计模式。

---

# 五十三、README 要求

完成第一版后完善：

README.md

至少包含：

项目简介

主要功能

技术栈

本地目录说明

安装方式

启动方式

构建方式

数据保存位置

IndexedDB 说明

JSON 备份说明

JSON 恢复说明

Git 使用说明

GitHub 说明

未来规划

---

# 五十四、README 中必须特别说明

必须明确写：

词库主数据保存在浏览器 IndexedDB 中。

项目代码不会自动包含个人词库。

git clone 只能获得代码。

换电脑后不能仅靠 clone 恢复词库。

个人词库需要通过 JSON：

导出
导入

进行迁移。

GitHub 不会自动同步 IndexedDB。

---

# 五十五、开发顺序

请严格分阶段完成。

## 阶段 1

检查：

Node.js

npm

Git

gh

检查 D:\VocabularyApp 当前状态。

初始化：

React + TypeScript + Vite

配置：

Git

.gitignore

确认：

npm run dev

可以启动。

进行第一次 Git commit。

---

## 阶段 2

建立：

VocabularyEntry 类型

Dexie 数据库

VocabularyDB

v1 schema

Repository

Service

完成基础 IndexedDB 持久化。

验证刷新后数据存在。

---

## 阶段 3

实现：

添加

编辑

删除

已掌握

列表

重复检测

完成对应 Git commit。

---

## 阶段 4

实现：

统一搜索框

英文完整匹配

英文前缀匹配

英文部分匹配

中文匹配

备注匹配

忽略大小写

实时搜索

完成对应 Git commit。

---

## 阶段 5

实现：

A-Z

#

状态筛选

默认排序

完成对应 Git commit。

---

## 阶段 6

实现：

searchCount

lastSearchedAt

确保只有真正打开词条时增加。

---

## 阶段 7

实现：

JSON 导出

JSON 导入

version

校验

去重

导入结果统计

完成对应 Git commit。

---

## 阶段 8

完善：

UI

确认弹窗

错误提示

移动端宽度兼容

空状态

加载状态

---

## 阶段 9

检查：

npm run build

TypeScript 错误

ESLint（如果配置）

主要功能

README

Git 状态

完成最终 MVP commit。

---

## 阶段 10

GitHub。

如果 gh 可用且已登录：

创建：

VocabularyApp

Private Repository

连接：

origin

分支：

main

执行 push。

然后检查远程仓库。

---

# 五十六、测试要求

至少验证以下情况：

1. 添加：

substrate

衬底

成功。

2. 刷新页面。

substrate 仍存在。

3. 关闭浏览器后重新打开。

数据仍存在。

4. 输入：

Substrate

尝试新增。

提示重复。

5. 搜索：

sub

可以找到 substrate。

6. 搜索：

strate

可以找到 substrate。

7. 搜索：

衬底

可以找到 substrate。

8. 添加：

electromagnetic interference

电磁干扰

9. 搜索：

ele

可以找到。

10. 搜索：

interference

可以找到。

11. 搜索：

电磁

可以找到。

12. 点击 E。

可以看到：

electromagnetic interference

13. 把 substrate 标记：

mastered

14. “学习中”不显示它。

15. “已掌握”可以看到它。

16. 编辑 substrate 中文释义。

保存成功。

17. 点击 substrate 查看。

searchCount + 1。

18. 搜索框输入 sub。

只出现搜索结果，不应自动给 substrate 的 searchCount + 1。

19. 删除 substrate。

出现二次确认。

20. 导出 JSON。

成功生成文件。

21. JSON 中包含：

version

exportedAt

entries

22. 清理测试数据后导入 JSON。

词条恢复。

23. 再次导入相同 JSON。

不会创建重复词。

24. 导入非法 JSON。

应用不崩溃。

25. npm run build 成功。

26. git status 最终合理。

27. GitHub 中没有 node_modules。

28. GitHub 中没有个人备份 JSON。

---

# 五十七、第一版验收标准

第一版完成后，我应该可以：

打开 VocabularyApp
↓
输入一个陌生单词
↓
快速检索自己的词库
↓
如果已存在则查看
↓
如果不存在则添加
↓
输入中文释义
↓
自动保存在 IndexedDB
↓
以后输入部分字母即可找到
↓
熟悉后标记为已掌握
↓
定期导出 JSON
↓
JSON 作为个人词库备份

整个日常使用流程不需要：

服务器

账号

互联网

付费 API

第一版额外运行成本：

0 元。

---

# 五十八、项目最终关系

请始终遵循：

程序代码
↓
D:\VocabularyApp
↓
Git
↓
GitHub Private Repository

词库主数据
↓
浏览器 IndexedDB

词库备份
↓
JSON
↓
D:\VocabularyApp\backups
↓
默认不上传 GitHub

---

# 五十九、开发过程中的要求

请直接实际执行开发。

不要只告诉我：

“可以这样做。”

请实际：

创建文件

安装 npm 依赖

修改代码

运行项目

执行构建

执行 Git

如果已有文件，请先检查，不要直接覆盖。

如果已有项目，请基于现有项目继续。

每完成阶段后：

检查 TypeScript

检查构建

验证功能

合理提交 Git

---

# 六十、遇到问题时

如果出现：

Node.js 不存在

npm 不可用

Git 不存在

端口冲突

npm 安装失败

TypeScript 错误

GitHub 登录问题

gh 不存在

不要直接绕过。

请：

1. 明确说明问题。
2. 优先解决不需要我人工操作的问题。
3. 如果需要我登录 GitHub 或浏览器授权，再告诉我最少需要执行什么。
4. 不要破坏已有正常项目。

---

# 六十一、最终交付报告

完成后请向我汇报：

1. 项目本地路径。
2. 最终目录结构。
3. 安装的 npm 依赖。
4. 数据库名称。
5. IndexedDB 中有哪些表。
6. 数据具体保存在什么位置。
7. JSON 备份如何导出。
8. JSON 如何恢复。
9. 如何启动项目。
10. 如何构建项目。
11. 第一版已完成的功能。
12. 明确未实现、留到后续版本的功能。
13. 当前 Git 分支。
14. 当前主要 commits。
15. git status 是否干净。
16. GitHub 仓库名称。
17. GitHub 是否为 Private。
18. origin 是否配置。
19. 是否成功 push。
20. GitHub 仓库中是否确认没有 node_modules、个人 JSON、API Key 等敏感内容。
21. 如果 GitHub 尚未完成，具体还差哪一步。
22. 下一版本最值得优先增加的 3～5 个功能，但暂时不要直接开发。

---

# 六十二、最后强调

第一版不是普通演示页面。

它必须是一个真正可以长期使用的个人词库工具。

优先级：

第一：数据不能轻易丢失。

第二：搜索必须方便。

第三：添加词条必须快。

第四：代码要方便以后升级。

第五：界面简洁。

不要优先追求：

复杂动画

华丽设计

大量依赖

高级架构

多余功能

现在请先检查：

D:\VocabularyApp

以及：

node -v
npm -v
git --version
gh --version

确认环境后，按照以上要求开始第一版开发。