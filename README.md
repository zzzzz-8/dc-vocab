# 📚 单词跳跳岛 - 艾宾浩斯21天抗遗忘记忆法

基于艾宾浩斯遗忘曲线的智能单词学习平台，涵盖中小学、四六级、考研、雅思托福等全套词库，科学记忆，高效背单词。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 生成Prisma客户端并初始化数据库
npm run db:push
npm run db:seed

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 测试账号
- 用户名: `demo`
- 密码: `123456`

## 📖 功能模块

### 学习模块
| 功能 | 路径 | 说明 |
|------|------|------|
| 学新词 | `/learn/new-words` | 学习新单词，支持发音、例句、记忆技巧 |
| 抗遗忘复习 | `/learn/review` | 艾宾浩斯遗忘曲线智能复习 |
| 循环记忆 | `/learn/cycle` | 按记忆阶段查看所有学习中的单词 |
| 已学词 | `/learn/learned` | 查看所有已学单词和学习进度 |

### 刷题模块
| 功能 | 路径 | 说明 |
|------|------|------|
| 学阅读 | `/practice/reading` | 阅读理解练习 |
| 学时文 | `/practice/articles` | 时事文章阅读 |
| 学完形 | `/practice/cloze` | 完形填空练习 |
| 学语境 | `/practice/context` | 语境理解练习 |
| 多选五 | `/practice/multi-select` | 多项选择题 |
| 学听力 | `/practice/listening` | 听力听写练习 |

### 词汇专项
| 功能 | 路径 | 说明 |
|------|------|------|
| 词根缀 | `/vocabulary/roots` | 词根词缀学习 |
| 单词环 | `/vocabulary/word-rings` | 主题分类单词学习 |
| 练拼写 | `/vocabulary/spelling` | 单词拼写练习 |
| 学语法 | `/vocabulary/grammar` | 语法知识学习 |
| 学音标 | `/vocabulary/phonetics` | 国际音标学习 |
| 学拼读 | `/vocabulary/phonics` | 自然拼读规则 |

### 辅助工具
| 功能 | 路径 | 说明 |
|------|------|------|
| 错词本 | `/tools/error-book` | 查看和管理错词 |
| 作业单 | `/tools/homework` | 单词作业练习 |
| 趣味学 | `/tools/fun-learn` | 趣味单词游戏 |
| 随机测 | `/tools/random-test` | 随机单词测试 |
| 查词典 | `/tools/dictionary` | 在线词典查询 |
| 测词量 | `/tools/assessment` | 词汇量评估测试 |

### 资源库
| 功能 | 路径 | 说明 |
|------|------|------|
| 词书库 | `/resources/word-books` | 浏览和选择词书 |
| 课件库 | `/resources/courseware` | 学习课件资源 |

### 学习报告
| 功能 | 路径 | 说明 |
|------|------|------|
| 学习报告 | `/reports` | 学习数据统计和图表 |

## 🧠 艾宾浩斯21天抗遗忘算法

根据艾宾浩斯遗忘曲线，在学习新单词后的特定时间点安排复习：
🕐 30分钟 → 🌙 12小时 → 📅 1天 → 📅 2天 → 📅 4天 → 📅 7天 → 📅 15天 → 🎯 21天

系统会自动为每个单词生成复习计划并智能排序。

## 🗄️ 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite (通过 Prisma ORM)
- **UI框架**: Tailwind CSS 4
- **状态管理**: Zustand
- **图表**: Recharts
- **图标**: React Icons (Heroicons)
- **认证**: JWT + bcrypt
- **语音**: Web Speech API (支持美式/英式发音)

## 📂 项目结构

```
duo-vocab/
├── prisma/                     # 数据库模型和种子数据
│   ├── schema.prisma
│   ├── seed.ts                 # 种子数据脚本
│   └── dev.db                  # SQLite数据库文件
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API路由 (16个)
│   │   ├── learn/              # 学习模块 (4页面)
│   │   ├── practice/           # 刷题模块 (6页面)
│   │   ├── vocabulary/         # 词汇专项 (6页面)
│   │   ├── tools/              # 辅助工具 (6页面)
│   │   ├── resources/          # 资源库 (2页面)
│   │   ├── reports/            # 学习报告 (1页面)
│   │   └── page.tsx            # 首页
│   ├── components/             # 组件
│   │   ├── layout/             # 布局组件
│   │   ├── common/             # 通用组件
│   │   └── learn/              # 学习组件
│   └── lib/                    # 工具库
│       ├── prisma.ts
│       ├── auth.ts             # JWT认证
│       ├── ebbinghaus.ts       # 艾宾浩斯算法
│       └── voice.ts            # 语音引擎
└── package.json
```

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run db:push` | 同步数据库Schema |
| `npm run db:seed` | 导入种子数据 |
| `npm run db:studio` | 打开Prisma数据库管理界面 |
| `npm run db:reset` | 重置并重新导入数据库 |

## 📊 功能特性

- ✅ 完整艾宾浩斯21天抗遗忘复习算法
- ✅ 美式/英式发音切换（Web Speech API）
- ✅ 卡通可爱UI设计，适合儿童使用
- ✅ 响应式布局，PC/手机自适应
- ✅ 多维度学习数据统计与图表
- ✅ 学习报告导出
- ✅ 12本词书、单词、词根词缀、语法点
- ✅ 错题收集与针对性复习
- ✅ 词汇量评估测试
- ✅ JWT认证，数据持久化
