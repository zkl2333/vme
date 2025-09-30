/**
 * GitHub API 统一导出
 * 提供清晰的 API 接口
 */

// ==================== 客户端管理 ====================
export {
  getOctokitInstance,
  createOctokitInstance,
  getSystemOctokitInstance,
} from './client'

// ==================== 类型定义 ====================
export type {
  GitHubAuthor,
  ReactionGroup,
  ReactionNode,
  IssueStats,
  GraphQLRepoResult,
  GitHubIssueNode,
  GraphQLSinceResult,
  AddReactionResponse,
  RemoveReactionResponse,
  UserReactionQueryResponse,
  GraphQLQueryOptions,
  BatchQueryOptions,
} from './types'

// ==================== 查询操作 ====================
export {
  buildRepoIssuesQuery,
  queryRepoIssues,
  buildRepoIssuesSinceQuery,
  queryRepoIssuesSince,
  queryIssueStats,
  queryBatchIssueStats,
  queryUserReaction,
  GET_ISSUE_STATS_QUERY,
  GET_BATCH_ISSUE_STATS_QUERY,
  GET_USER_REACTION_QUERY,
} from './queries'

// ==================== 变更操作 ====================
export {
  addReaction,
  removeReaction,
  toggleReaction,
  ADD_REACTION_MUTATION,
  REMOVE_REACTION_MUTATION,
} from './mutations'

// ==================== 便捷函数 ====================

/**
 * 使用统一客户端快速查询 Issue 统计
 */
import { getOctokitInstance } from './client'
import { queryIssueStats, queryBatchIssueStats } from './queries'
import type { IssueStats, BatchQueryOptions } from './types'

export async function getIssueStats(
  issueId: string,
  request?: Request
): Promise<IssueStats> {
  const octokit = await getOctokitInstance(request)
  return queryIssueStats(octokit, issueId)
}

export async function getBatchIssueStats(
  options: BatchQueryOptions,
  request?: Request
): Promise<Map<string, IssueStats>> {
  const octokit = await getOctokitInstance(request)
  return queryBatchIssueStats(octokit, options)
}
