# AI 协作指南与开发手册 (AI Context)

> **致 AI 智能体：** 此文件是 `vme` 项目的"单一事实来源"。请优先遵循此处的规范、术语和架构定义，而非依赖通用知识。

## 1. 项目定位与核心基调 (关键)

**项目名称：** vme (肯德基疯狂星期四文案库)
**核心价值：** 一个社区驱动的"肯德基疯狂星期四"（V50）梗图/文案分享平台。

### 🎭 梗文化术语表 (严格执行)
本项目必须体现"疯四"文化，**严禁使用通用枯燥的术语**。请在生成代码、注释或文案时严格映射：

| 通用术语 (禁止) | **项目专用术语 (必须使用)** | 备注 |
| :--- | :--- | :--- |
| 段子 / 帖子 (Joke/Post) | **文案** | 核心资产 |
| 提交 (Submit) | **上交 / 投稿** | 更有互动感 |
| 贡献者 (Contributor) | **文案鬼才** | 赋予用户角色感 |
| 排行榜 (Leaderboard) | **V50 英雄榜** | 增加荣誉感 |
| 推荐 (Recommendation) | **今日v50文案** | |
| 评分/分数 (Score) | **V50 指数** | |
| 乞讨/乞丐 (Begging) | **(禁用)** | 请使用"文案鬼才"等正面词汇，避免冒犯。 |

**Slogan:** "v50不是交易，是信仰"。

---

## 2. 系统架构

项目采用独特的 **双层架构 (Two-Layer Architecture)**：

### 层级 1：自动化与数据层 (后端逻辑)
*   **路径：** `actions_scripts/`
*   **职责：** 处理来自 GitHub Issues 的数据摄入、审核及 JSON 生成。
*   **触发器：** GitHub Actions 工作流 (`.github/workflows/`)。
*   **输出：** `data/` 目录下的静态 JSON 文件。
*   **核心逻辑：**
    *   **审核机制：** AI 辅助审核 (仇恨/色情检测) + 重复检测 (莱文斯坦距离)。
    *   **标签系统：** `文案` (有效投稿), `收录` (审核通过), `重复` (内容重复), `违规` (内容违规)。

### 层级 2：Web 应用层 (前端 UI)
*   **路径：** `src/`
*   **框架：** Next.js 14 (App Router)。
*   **部署：** Vercel。
*   **数据源策略：**
    1.  **静态缓存 (高频读取)：** 读取 `data/{YYYY-MM}.json` (缓存 1 小时)。用于展示列表、详情。
    2.  **实时数据 (动态交互)：** 直接调用 GitHub API 获取 `reactions` (点赞数) (缓存 60 秒)。

---

## 3. 技术栈与核心库

*   **前端：** Next.js 14, TypeScript, Tailwind CSS。
*   **认证：** NextAuth.js (GitHub OAuth)。
*   **图标：** FontAwesome (通过 CDN 或 CSS 类名调用，如 `fa fa-book`)。
*   **状态/请求：** 使用原生 `fetch` 配合 Next.js 的缓存标签 (Tags)。
*   **自动化脚本：** TypeScript 编写，使用 Rollup 打包。

---

## 4. 开发规范

### API 与 响应
*   **响应格式：** API 路由必须统一使用 `NextResponse.json()`。
*   **类型定义：** 避免复杂的响应模型类，使用简单的 TypeScript 接口 (Interfaces)。

### 数据处理
*   **服务端 (Server-side)：** 必须使用 `src/lib/server-utils.ts` 中的工具函数读取本地 JSON 数据。
*   **客户端 (Client-side)：** 仅用于处理用户交互（如点赞、提交表单）。

### 代码风格
*   **组件模式：** 优先使用服务端组件 (RSC) 进行渲染。仅在需要交互（按钮、表单）时使用 `'use client'`。
*   **样式：** Tailwind CSS。

---

## 5. 常用命令速查

| 范围 | 命令 | 说明 |
| :--- | :--- | :--- |
| **App** | `npm run dev` | 启动 Next.js 开发服务器 (`localhost:3000`) |
| **App** | `npm run build` | 构建 Next.js 应用 |
| **App** | `npm run lint` | 代码质量检查 |
| **Scripts** | `cd actions_scripts && npm run build` | 编译自动化脚本 |
| **Scripts** | `cd actions_scripts && npm test` | 运行审核逻辑测试 |

---

## 6. 目录结构映射

```
.
├── .github/workflows/   # CI/CD 流水线定义
├── actions_scripts/     # [Layer 1] 自动化业务逻辑
│   ├── src/
│   │   ├── createData.ts      # 将 Issues 转换为 JSON
│   │   └── moderationLogic.ts # AI 审核与查重算法
├── data/                # [Storage] 生成的 JSON 数据仓库
│   ├── summary.json     # 全局统计数据
│   └── {YYYY-MM}.json   # 按月归档的文案数据
├── src/                 # [Layer 2] Web 应用程序
│   ├── app/             # 页面与 API 路由
│   ├── components/      # UI 组件
│   └── lib/             # 核心工具库 (server-utils.ts 很重要)
└── AI_CONTEXT.md        # 本文件 (项目指南)
```

## 7. 核心业务流程

### 投稿流程 (开发模式)
1.  开发者在仓库创建一个 Issue，打上 `文案` 标签。
2.  (生产环境) GitHub Actions 会自动触发审核脚本。
3.  (开发环境) 你可能需要手动修改 `data/` 下的 JSON 文件来模拟数据，或者配置好环境变量在本地运行脚本。

### 审核逻辑
1.  Issue 标记为 `文案` -> 触发 Workflow。
2.  脚本计算与 `data/` 中现有文案的文本距离。
3.  如果唯一且安全 -> 自动标记 `收录` -> 重新生成 `data/` 目录文件。