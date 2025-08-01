import { Octokit } from '@octokit/core'

interface ReactionGroup {
  content: string
  users: {
    totalCount: number
  }
}

interface IssueStats {
  id: string
  reactions: number
  reactionDetails: ReactionGroup[]
}

/**
 * 获取单个Issue的统计数据
 */
export async function getIssueStats(
  octokit: Octokit,
  issueId: string,
): Promise<IssueStats> {
  const query = `
    query GetIssueStats($issueId: ID!) {
      node(id: $issueId) {
        ... on Issue {
          id
          reactions {
            totalCount
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

  const response = await octokit.graphql<{
    node: {
      id: string
      reactions: { totalCount: number }
      reactionGroups: ReactionGroup[]
    }
  }>(query, { issueId })

  if (!response.node) {
    throw new Error(`Issue ${issueId} not found`)
  }

  return {
    id: response.node.id,
    reactions: response.node.reactions.totalCount,
    reactionDetails: response.node.reactionGroups || [],
  }
}

/**
 * 批量获取多个Issue的统计数据（排除bot评论）
 */
export async function getBatchIssueStats(
  octokit: Octokit,
  issueIds: string[],
): Promise<Map<string, IssueStats>> {
  const statsMap = new Map<string, IssueStats>()

  // 分批处理，每批50个
  const batchSize = 50
  const batches = []
  for (let i = 0; i < issueIds.length; i += batchSize) {
    batches.push(issueIds.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    try {
      const query = `
        query GetBatchIssueStats($issueIds: [ID!]!) {
          nodes(ids: $issueIds) {
            ... on Issue {
              id
              reactions {
                totalCount
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

      const response = await octokit.graphql<{
        nodes: Array<{
          id: string
          reactions: { totalCount: number }
          reactionGroups: ReactionGroup[]
        }>
      }>(query, { issueIds: batch })

      // 处理每个Issue的统计数据
      for (const node of response.nodes) {
        if (node && node.id) {
          statsMap.set(node.id, {
            id: node.id,
            reactions: node.reactions.totalCount,
            reactionDetails: node.reactionGroups || [],
          })
        }
      }

      // 避免API限制，批次间稍作延迟
      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`Failed to fetch batch stats:`, error)
      // 如果批次失败，为这批设置默认值
      batch.forEach((id) => {
        statsMap.set(id, { id, reactions: 0, reactionDetails: [] })
      })
    }
  }

  return statsMap
}
