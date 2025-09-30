/**
 * GitHub GraphQL 查询
 * 统一管理所有 GraphQL 查询语句和执行逻辑
 */

import { Octokit } from '@octokit/core'
import {
  GraphQLRepoResult,
  GraphQLSinceResult,
  IssueStats,
  ReactionGroup,
  ReactionNode,
  GraphQLQueryOptions,
  BatchQueryOptions,
  UserReactionQueryResponse,
} from './types'

/**
 * 获取仓库 Issues 的 GraphQL 查询
 */
export function buildRepoIssuesQuery(options: GraphQLQueryOptions): string {
  const { label = '文案', state = 'ALL' } = options
  
  const statesFilter = state === 'ALL'
    ? 'states: [OPEN, CLOSED]'
    : `states: [${state}]`

  return `
    query GetRepoIssues($owner: String!, $name: String!, $cursor: String, $pageSize: Int!) {
      repository(owner: $owner, name: $name) {
        issues(
          first: $pageSize
          after: $cursor
          labels: ["${label}"]
          ${statesFilter}
          orderBy: {field: CREATED_AT, direction: DESC}
        ) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            number
            title
            body
            createdAt
            updatedAt
            author {
              login
              avatarUrl
              url
            }
            url
            reactions {
              totalCount
            }
          }
        }
      }
    }
  `
}

/**
 * 执行仓库 Issues 查询
 */
export async function queryRepoIssues(
  octokit: Octokit,
  options: GraphQLQueryOptions
): Promise<GraphQLRepoResult> {
  const query = buildRepoIssuesQuery(options)
  
  return await octokit.graphql<GraphQLRepoResult>(query, {
    owner: options.owner,
    name: options.name,
    cursor: options.cursor || null,
    pageSize: options.pageSize || 100,
  })
}

/**
 * 获取仓库 Issues（增量同步）的 GraphQL 查询
 */
export function buildRepoIssuesSinceQuery(options: GraphQLQueryOptions): string {
  const { label = '文案', state = 'ALL' } = options
  
  const statesFilter = state === 'ALL'
    ? 'states: [OPEN, CLOSED]'
    : `states: [${state}]`

  return `
    query GetRepoIssuesSince($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        issues(
          first: 20
          labels: ["${label}"]
          ${statesFilter}
          orderBy: {field: CREATED_AT, direction: DESC}
        ) {
          nodes {
            id
            title
            body
            createdAt
            updatedAt
            author {
              login
              avatarUrl
              url
            }
            url
            reactions {
              totalCount
            }
          }
        }
      }
    }
  `
}

/**
 * 执行增量同步 Issues 查询
 */
export async function queryRepoIssuesSince(
  octokit: Octokit,
  options: GraphQLQueryOptions
): Promise<GraphQLSinceResult> {
  const query = buildRepoIssuesSinceQuery(options)
  
  return await octokit.graphql<GraphQLSinceResult>(query, {
    owner: options.owner,
    name: options.name,
  })
}

/**
 * 获取单个 Issue 统计数据的 GraphQL 查询
 */
export const GET_ISSUE_STATS_QUERY = `
  query GetIssueStats($issueId: ID!) {
    node(id: $issueId) {
      ... on Issue {
        id
        reactions(first: 100) {
          totalCount
          nodes {
            id
            content
            user {
              login
            }
          }
        }
        reactionGroups {
          content
          users {
            totalCount
          }
        }
      }
    }
  }
`

/**
 * 执行获取单个 Issue 统计数据
 */
export async function queryIssueStats(
  octokit: Octokit,
  issueId: string
): Promise<IssueStats> {
  const response = await octokit.graphql<{
    node: {
      id: string
      reactions: {
        totalCount: number
        nodes: ReactionNode[]
      }
      reactionGroups: ReactionGroup[]
    }
  }>(GET_ISSUE_STATS_QUERY, { issueId })

  if (!response.node) {
    throw new Error(`Issue ${issueId} not found`)
  }

  return {
    id: response.node.id,
    reactions: response.node.reactions.totalCount,
    reactionDetails: response.node.reactionGroups || [],
    reactionNodes: response.node.reactions.nodes || [],
  }
}

/**
 * 批量获取 Issues 统计数据的 GraphQL 查询
 */
export const GET_BATCH_ISSUE_STATS_QUERY = `
  query GetBatchIssueStats($issueIds: [ID!]!) {
    nodes(ids: $issueIds) {
      ... on Issue {
        id
        reactions(first: 100) {
          totalCount
          nodes {
            id
            content
            user {
              login
            }
          }
        }
        reactionGroups {
          content
          users {
            totalCount
          }
        }
      }
    }
  }
`

/**
 * 执行批量获取 Issues 统计数据
 */
export async function queryBatchIssueStats(
  octokit: Octokit,
  options: BatchQueryOptions
): Promise<Map<string, IssueStats>> {
  const { issueIds, batchSize = 50, delayMs = 100 } = options
  const statsMap = new Map<IssueStats>()

  // 分批处理
  const batches: string[][] = []
  for (let i = 0; i < issueIds.length; i += batchSize) {
    batches.push(issueIds.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    try {
      const response = await octokit.graphql<{
        nodes: Array<{
          id: string
          reactions: {
            totalCount: number
            nodes: ReactionNode[]
          }
          reactionGroups: ReactionGroup[]
        }>
      }>(GET_BATCH_ISSUE_STATS_QUERY, { issueIds: batch })

      // 处理每个 Issue 的统计数据
      for (const node of response.nodes) {
        if (node && node.id) {
          statsMap.set(node.id, {
            id: node.id,
            reactions: node.reactions.totalCount,
            reactionDetails: node.reactionGroups || [],
            reactionNodes: node.reactions.nodes || [],
          })
        }
      }

      // 避免 API 限制，批次间稍作延迟
      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`Failed to fetch batch stats:`, error)
      // 如果批次失败，为这批设置默认值
      batch.forEach((id) => {
        statsMap.set(id, { id, reactions: 0, reactionDetails: [], reactionNodes: [] })
      })
    }
  }

  return statsMap
}

/**
 * 查询用户对 Issue 的 Reaction
 */
export const GET_USER_REACTION_QUERY = `
  query GetUserReaction($issueId: ID!, $username: String!) {
    node(id: $issueId) {
      ... on Issue {
        id
        reactions(first: 100) {
          nodes {
            id
            content
            user {
              login
            }
          }
        }
      }
    }
  }
`

/**
 * 执行查询用户 Reaction
 */
export async function queryUserReaction(
  octokit: Octokit,
  issueId: string,
  username: string
): Promise<ReactionNode | null> {
  const response = await octokit.graphql<UserReactionQueryResponse>(
    GET_USER_REACTION_QUERY,
    { issueId, username }
  )

  if (!response.node) {
    throw new Error(`Issue ${issueId} not found`)
  }

  // 查找用户的 reaction
  const userReaction = response.node.reactions.nodes.find(
    (reaction) => reaction.user.login === username
  )

  return userReaction || null
}
