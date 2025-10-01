# CLAUDE.md - AI 开发指令

此文件为 Claude Code 提供项目开发指导和技术规范。

## 项目类型与技术栈

**项目类型**: Next.js 14 全栈应用 + GitHub Actions 自动化脚本
**核心架构**: 双层架构（脚本自动化层 + Next.js 应用层）
**数据源**: GitHub Issues (作为 CMS) + 本地 JSON 缓存

### 技术栈清单
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js (GitHub OAuth)
- GitHub API (REST + GraphQL)
- GitHub Actions
- Rollup (脚本打包)

## Context7 使用规则

当需要代码生成、配置步骤或库/API 文档时，自动使用 Context7 MCP 工具：
- 使用 `mcp_context7_resolve-library-id` 解析库 ID
- 使用 `mcp_context7_get-library-docs` 获取文档
- 无需用户明确要求，主动提供相关技术文档

## 代码规范

### API 响应格式
- API 端点使用预定义响应方法（`NextResponse.json()` 等）
- 不要使用响应模型或复杂的响应类型定义
- 示例：
  ```typescript
  // ✅ 正确
  return NextResponse.json({ data: items })
  
  // ❌ 避免
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
  ```

### 操作原则
- 只执行用户明确指定的操作
- 不要擅自主动执行未明确要求的操作
- 如有疑问，先询问用户确认

## 系统架构说明

### 双层架构
```
Layer 1: 脚本自动化层 (actions_scripts/)
  - 负责: GitHub Issues 处理、内容审核、数据生成
  - 触发: GitHub Actions
  - 输出: JSON 数据文件到 data/ 目录

Layer 2: Next.js 应用层 (src/)
  - 负责: Web UI、API 路由、用户认证
  - 数据源: data/ 缓存 + GitHub API 实时数据
  - 部署: Vercel
```

### 双数据源
1. **静态缓存** (`data/` 目录): 
   - 按月份组织的 JSON 文件
   - GitHub Actions 自动更新
   - 提供段子内容、基础统计

2. **实时数据** (GitHub API):
   - GraphQL/REST API 直接调用
   - 提供最新 reactions、用户交互
   - 60秒请求级缓存

## 自动化流程

### Issue 标签系统
- `文案` - 有效内容标识
- `收录` - 审核通过
- `重复` - 重复内容
- `违规` - 违规内容
- `待审` - 需人工审核

### 审核流程 (actions_scripts/src/moderationLogic.ts)

**触发**: Issue 添加 `文案` 标签 → `.github/workflows/issue_moderation.yml`

**步骤**:
1. 重复检测
   - 算法: 编辑距离 (Levenshtein)
   - 阈值: `distance / maxLength < 0.2`
   - 数据源: `data/` 目录所有现有文案
   - 结果: 重复 → 添加 `重复` 标签 → 关闭

2. AI 内容审核
   - API: AI 审核服务
   - 检测: 仇恨/色情/暴力/自残
   - 结果:
     - 违规 → `违规` 标签 → 关闭
     - 可能违规 → `待审` 标签
     - 通过 → `收录` 标签 → 关闭 → 触发数据更新

3. 数据更新
   - 触发: `create_data.yml` workflow
   - 操作: 重新生成 `data/{YYYY-MM}.json`

### 核心函数参考

```typescript
// 重复检测
function minDistance(word1: string, word2: string): number
function isSimilar(str1: string, str2: string): boolean
function findSimilarIssue(newIssue: string, currentIssueId?: string): Promise<IssueNode | null>

// 标签管理
function addLabelsToIssue(issueNumber: number, labels: string[])
function removeLabelFromIssue(issueNumber: number, label: string)
function getIssueLabels(issueNumber: number): Promise<string[]>

// Issue 操作
function addCommentToIssue(issueNumber: number, comment: string)
function closeIssue(issueNumber: number)
function dispatchWorkflow(workflow_id: string, ref: string)
```

### 手动审核工具
- 文件: `actions_scripts/src/manualModeration.ts`
- 触发: 手动运行 `manual_moderation.yml`
- 功能: 批量处理所有 `文案` 标签的开放 Issue
- 试运行: `DRY_RUN=true`

### 环境变量
- `GITHUB_TOKEN` - GitHub API 令牌
- `AI_API_KEY` - AI 审核 API 密钥
- `DRY_RUN` - 试运行模式（可选）

## 开发命令

```bash
# Next.js 应用
npm run dev          # 开发服务器
npm run build        # 构建生产版本
npm run lint         # ESLint 检查

# 脚本系统 (actions_scripts/)
cd actions_scripts
npm run build        # 构建脚本
npm test            # 运行测试

# 环境配置
cp env.local.example .env.local
```

## 目录结构

### 脚本层 (actions_scripts/)
```
actions_scripts/
├── src/
│   ├── createData.ts          # 数据文件生成
│   ├── moderateIssue.ts       # Issue 审查
│   ├── manualModeration.ts    # 手动审查
│   ├── moderationLogic.ts     # 审查逻辑
│   └── utils/                 # 工具函数
└── dist/                      # 编译输出
```

### 应用层 (src/)
```
src/
├── app/
│   ├── api/                   # API 路由
│   │   ├── auth/             # 认证
│   │   ├── items/            # 段子数据
│   │   ├── random/           # 随机段子
│   │   ├── like/             # 点赞
│   │   └── submit/           # 提交
│   ├── jokes/                # 段子列表页
│   ├── leaderboard/          # 排行榜页
│   └── submit/               # 提交页
├── components/
│   ├── client/               # 客户端组件
│   └── server/               # 服务端组件
├── lib/                      # 工具库
└── types/                    # 类型定义
```

## API 接口说明

### 数据源分类

**使用 data/ 缓存**:
- `GET /api/items` - 所有段子 (1小时缓存)
- `GET /api/items/page` - 分页数据 (60秒缓存)

**调用 GitHub API**:
- `GET /api/random` - 随机段子 + 实时 reactions
- `GET /api/reactions/[issueId]` - 实时 reactions (60秒缓存)
- `POST /api/like` - 点赞操作 (需认证)
- `POST /api/submit` - 提交文案 (需认证，标题≤100，内容≤2000)
- `/api/auth/[...nextauth]` - OAuth 认证

## 数据结构

### data/ 目录
```
data/
├── summary.json          # 全局统计 {totalItems, months[], updatedAt}
└── {YYYY-MM}.json        # 按月份存储的段子数据
```

### Issue 数据字段
```typescript
{
  id: string              // Issue 编号
  title: string           // 标题
  body: string            // 内容
  author: {
    login: string         // 用户名
    avatar_url: string
    html_url: string
  }
  created_at: string      // ISO 8601
  reactions: {
    "+1": number
    "heart": number
    "laugh": number
  }
  html_url: string
  labels: string[]
}
```

## 环境变量

```bash
# GitHub
GITHUB_TOKEN=ghp_xxxx                   # PAT (权限: repo, read:user)
GITHUB_CLIENT_ID=Iv1.xxxx               # OAuth App ID
GITHUB_CLIENT_SECRET=xxxx               # OAuth Secret

# NextAuth
NEXTAUTH_SECRET=your-secret-key         # 32+ 字符
NEXTAUTH_URL=http://localhost:3000      # 生产环境需更改
```

获取方式: GitHub Settings > Developer settings
模板文件: `env.local.example`

## 设计系统

### 主题色彩
- 主红色: `#E02020` (KFC 红)
- 主黄色: `#FFC72C` (KFC 黄)
- 渐变: 红黄渐变

### 字体
- 主字体: Inter
- 展示字体: Mona Sans
- 中文: 系统默认

## 开发注意事项

### TypeScript
- 严格模式启用
- 类型定义: `src/types/`
- Props 接口必须定义

### 性能
- 列表页: 使用 RSC
- API缓存: 60秒 (reactions), 1小时 (items)
- 图片: Next.js Image 组件
- 代码分割: 客户端组件按需加载

### 错误处理
- 统一错误响应格式
- GitHub API 限制需降级处理
- 生产环境记录日志

## 部署

### Vercel (推荐)
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署 main 分支

### GitHub Actions
- Issue 变更 → 触发数据更新
- PR → 运行测试
- main 分支 → 自动部署

---

**文档版本**: 2025-10-01  
**AI 开发者**: 阅读此文件后，按照规范进行开发，遇到未明确的情况，参考现有代码实现。