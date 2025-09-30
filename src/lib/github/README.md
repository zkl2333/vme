# GitHub API 统一架构

这是一个重构后的 GitHub API 统一管理模块，解决了原有代码中 GitHub API 使用分散、重复的问题。

## 📁 目录结构

```
src/lib/github/
├── client.ts          # Octokit 实例管理
├── queries.ts         # GraphQL 查询
├── mutations.ts       # GraphQL 变更操作
├── types.ts           # TypeScript 类型定义
├── index.ts           # 统一导出
└── README.md          # 本文档
```

## 🎯 设计目标

### 解决的问题
1. ❌ **代码重复**：`getOctokitInstance()` 在多个文件中重复实现
2. ❌ **分散管理**：GraphQL 查询分散在各个文件中
3. ❌ **类型混乱**：类型定义重复且不统一
4. ❌ **难以维护**：修改 API 调用需要改多个地方

### 达成的效果
1. ✅ **统一管理**：所有 GitHub API 相关代码集中管理
2. ✅ **类型安全**：完整的 TypeScript 类型定义
3. ✅ **易于使用**：简洁的 API 接口
4. ✅ **便于维护**：修改只需要在一处进行

## 📖 使用指南

### 1. 客户端管理 (`client.ts`)

#### 获取 Octokit 实例（自动选择 token）

```typescript
import { getOctokitInstance } from '@/lib/github'

// 在 API Route 中使用（优先使用用户 token）
export async function GET(request: Request) {
  const octokit = await getOctokitInstance(request)
  // 使用 octokit...
}

// 在 Server Component 中使用（使用环境变量 token）
export default async function Page() {
  const octokit = await getOctokitInstance()
  // 使用 octokit...
}
```

#### 创建指定 token 的实例

```typescript
import { createOctokitInstance } from '@/lib/github'

const octokit = createOctokitInstance('ghp_yourtoken')
```

#### 获取系统级实例（仅用于后台任务）

```typescript
import { getSystemOctokitInstance } from '@/lib/github'

// 在 cron job 或后台任务中
const octokit = getSystemOctokitInstance()
```

### 2. GraphQL 查询 (`queries.ts`)

#### 查询仓库 Issues

```typescript
import { queryRepoIssues } from '@/lib/github'

const result = await queryRepoIssues(octokit, {
  owner: 'zkl2333',
  name: 'vme',
  label: '收录',
  state: 'ALL',
  pageSize: 100,
  cursor: null
})

console.log(result.repository.issues.nodes)
```

#### 查询单个 Issue 统计

```typescript
import { queryIssueStats } from '@/lib/github'

const stats = await queryIssueStats(octokit, 'issue-id')
console.log(stats.reactions) // 总 reactions 数
console.log(stats.reactionDetails) // 分类统计
console.log(stats.reactionNodes) // 详细列表
```

#### 批量查询 Issues 统计

```typescript
import { queryBatchIssueStats } from '@/lib/github'

const statsMap = await queryBatchIssueStats(octokit, {
  issueIds: ['id1', 'id2', 'id3'],
  batchSize: 50,
  delayMs: 100
})

statsMap.forEach((stats, issueId) => {
  console.log(`${issueId}: ${stats.reactions} reactions`)
})
```

#### 便捷函数（自动获取 octokit）

```typescript
import { getIssueStats, getBatchIssueStats } from '@/lib/github'

// 在 API Route 中
const stats = await getIssueStats('issue-id', request)

// 批量获取
const statsMap = await getBatchIssueStats({
  issueIds: ['id1', 'id2']
}, request)
```

### 3. GraphQL Mutations (`mutations.ts`)

#### 添加 Reaction

```typescript
import { addReaction } from '@/lib/github'

const reactionId = await addReaction(octokit, issueId, 'THUMBS_UP')
console.log(`Added reaction: ${reactionId}`)
```

#### 删除 Reaction

```typescript
import { removeReaction } from '@/lib/github'

const reactionId = await removeReaction(octokit, issueId, 'THUMBS_UP')
console.log(`Removed reaction: ${reactionId}`)
```

#### 切换 Reaction（智能添加/删除）

```typescript
import { toggleReaction } from '@/lib/github'

const result = await toggleReaction(
  octokit,
  issueId,
  'THUMBS_UP',
  existingReactionId // 如果有的话
)

console.log(`${result.action}: ${result.reactionId}`)
// 输出: "added: xxx" 或 "removed: xxx"
```

### 4. 类型定义 (`types.ts`)

所有 GitHub API 相关类型都已定义并导出：

```typescript
import type {
  GitHubAuthor,
  ReactionGroup,
  ReactionNode,
  IssueStats,
  GraphQLRepoResult,
  GraphQLQueryOptions,
  BatchQueryOptions
} from '@/lib/github'
```

## 🔄 迁移指南

### 从旧代码迁移

#### Before (旧代码)

```typescript
// ❌ 多处重复的 getOctokitInstance 实现
async function getOctokitInstance(request?: Request): Promise<Octokit> {
  // ... 大量重复代码
}

// ❌ 分散的 GraphQL 查询
const query = `
  query GetIssueStats($issueId: ID!) {
    // ...
  }
`
const result = await octokit.graphql(query, { issueId })
```

#### After (新代码)

```typescript
// ✅ 统一导入
import { getOctokitInstance, queryIssueStats } from '@/lib/github'

// ✅ 简洁使用
const octokit = await getOctokitInstance(request)
const stats = await queryIssueStats(octokit, issueId)
```

### 需要更新的文件

以下文件应该更新为使用新架构：

1. ✅ `src/lib/multi-repo-github-db.ts`
   - 使用 `createOctokitInstance` 替代 `new Octokit()`
   - 使用 `queryRepoIssues`, `queryRepoIssuesSince`

2. ✅ `src/lib/github-server-utils.ts`
   - 删除重复的 `getOctokitInstance`
   - 从 `@/lib/github` 导入

3. ✅ `src/lib/server-utils.ts`
   - 删除重复的 `getOctokitInstance`
   - 从 `@/lib/github` 导入

4. ✅ `src/app/lib/github-stats.ts`
   - 使用 `queryIssueStats`, `queryBatchIssueStats`
   - 可以直接删除此文件（功能已在 queries.ts 中）

5. ✅ `src/app/api/like/route.ts`
   - 使用 `addReaction`, `removeReaction`
   - 使用 `getOctokitInstance`

## 🎨 最佳实践

### 1. 选择正确的客户端函数

```typescript
// ✅ API Route - 优先使用用户 token
const octokit = await getOctokitInstance(request)

// ✅ Server Component - 使用环境变量 token
const octokit = await getOctokitInstance()

// ✅ 后台任务 - 显式使用系统 token
const octokit = getSystemOctokitInstance()

// ✅ 自定义 token
const octokit = createOctokitInstance(customToken)
```

### 2. 错误处理

```typescript
try {
  const stats = await queryIssueStats(octokit, issueId)
  // 处理数据
} catch (error) {
  if (error instanceof Error) {
    console.error('GraphQL 错误:', error.message)
  }
  // 降级处理
}
```

### 3. 批量操作优化

```typescript
// ✅ 使用批量查询而非循环单次查询
const stats = await queryBatchIssueStats(octokit, {
  issueIds: allIssueIds,
  batchSize: 50,  // 控制批次大小
  delayMs: 100    // 避免 API 限制
})

// ❌ 避免这样做
for (const id of issueIds) {
  await queryIssueStats(octokit, id) // 太慢！
}
```

### 4. 类型安全

```typescript
// ✅ 使用导出的类型
import type { IssueStats, GraphQLQueryOptions } from '@/lib/github'

function processStats(stats: IssueStats) {
  // TypeScript 自动补全和类型检查
  console.log(stats.reactions)
  console.log(stats.reactionDetails)
}
```

## 📊 架构对比

### 重构前

```
各个文件中分散的代码
├── src/lib/server-utils.ts (getOctokitInstance)
├── src/lib/github-server-utils.ts (getOctokitInstance, 重复！)
├── src/app/lib/github-stats.ts (queries, types)
├── src/app/api/like/route.ts (mutations, 直接 new Octokit)
└── src/lib/multi-repo-github-db.ts (queries, 直接 new Octokit)
```

### 重构后

```
统一的 GitHub API 模块
src/lib/github/
├── client.ts (所有 Octokit 实例管理)
├── queries.ts (所有 GraphQL 查询)
├── mutations.ts (所有 GraphQL 变更)
├── types.ts (所有类型定义)
└── index.ts (统一导出)
```

## 🔍 调试

### 查看使用的 Token

所有客户端函数都会打印日志：

```bash
✅ 使用用户 access token
✅ 使用环境变量 token
⚠️  用户已登录，但无法获取 access token，使用环境变量 token
⚠️  获取用户 session 失败，使用环境变量 token: ...
```

### GraphQL 查询调试

```typescript
import { GET_ISSUE_STATS_QUERY } from '@/lib/github'

// 查看完整查询语句
console.log(GET_ISSUE_STATS_QUERY)

// 或使用 builder 函数
import { buildRepoIssuesQuery } from '@/lib/github'
const query = buildRepoIssuesQuery({ 
  owner: 'zkl2333', 
  name: 'vme', 
  label: '收录' 
})
console.log(query)
```

## 🚀 下一步

1. 更新所有使用旧代码的文件
2. 删除重复的代码和文件
3. 运行测试确保功能正常
4. 更新文档说明新架构

## 📝 相关文档

- [GitHub GraphQL API 文档](https://docs.github.com/en/graphql)
- [Octokit Core 文档](https://github.com/octokit/core.js)
- [项目 CLAUDE.md](../../CLAUDE.md)
