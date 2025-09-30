/**
 * GitHub API 类型定义
 * 统一管理所有 GitHub API 相关的 TypeScript 类型
 */

// ==================== GraphQL 响应类型 ====================

/**
 * GitHub Issue 作者信息
 */
export interface GitHubAuthor {
  login: string
  avatarUrl: string
  url: string
}

/**
 * GitHub Reaction 分组统计
 */
export interface ReactionGroup {
  content: string
  users: {
    totalCount: number
  }
}

/**
 * GitHub Reaction 节点详情
 */
export interface ReactionNode {
  id: string
  content: string
  user: {
    login: string
  }
}

/**
 * GitHub Issue 统计信息
 */
export interface IssueStats {
  id: string
  reactions: number
  reactionDetails: ReactionGroup[]
  reactionNodes: ReactionNode[]
}

/**
 * GraphQL 仓库查询结果
 */
export interface GraphQLRepoResult {
  repository: {
    issues: {
      totalCount: number
      pageInfo: {
        hasNextPage: boolean
        endCursor: string
      }
      nodes: GitHubIssueNode[]
    }
  }
}

/**
 * GraphQL Issue 节点
 */
export interface GitHubIssueNode {
  id: string
  number: number
  title: string
  body: string
  createdAt: string
  updatedAt: string
  author: GitHubAuthor
  url: string
  reactions: {
    totalCount: number
  }
}

/**
 * GraphQL 增量同步查询结果
 */
export interface GraphQLSinceResult {
  repository: {
    issues: {
      nodes: GitHubIssueNode[]
    }
  }
}

// ==================== Mutation 类型 ====================

/**
 * 添加 Reaction 的响应
 */
export interface AddReactionResponse {
  addReaction: {
    reaction: {
      id: string
      content: string
    }
  }
}

/**
 * 删除 Reaction 的响应
 */
export interface RemoveReactionResponse {
  removeReaction: {
    reaction: {
      id: string
    }
  }
}

/**
 * 查询用户 Reaction 的响应
 */
export interface UserReactionQueryResponse {
  node: {
    id: string
    reactions: {
      nodes: ReactionNode[]
    }
  }
}

// ==================== 配置类型 ====================

/**
 * GraphQL 查询选项
 */
export interface GraphQLQueryOptions {
  owner: string
  name: string
  cursor?: string | null
  pageSize?: number
  label?: string
  state?: 'OPEN' | 'CLOSED' | 'ALL'
}

/**
 * 批量查询选项
 */
export interface BatchQueryOptions {
  issueIds: string[]
  batchSize?: number
  delayMs?: number
}
