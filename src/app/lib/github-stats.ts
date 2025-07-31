import { Octokit } from '@octokit/core'

interface IssueStats {
  id: string
  reactions: number
  comments: number
}

/**
 * 获取单个Issue的统计数据（排除bot评论）
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
          comments(first: 100) {
            nodes {
              author {
                __typename
              }
            }
            pageInfo {
              hasNextPage
              endCursor
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
      comments: {
        nodes: Array<{
          author: {
            __typename: string
          }
        }>
        pageInfo: {
          hasNextPage: boolean
          endCursor: string | null
        }
      }
    }
  }>(query, { issueId })

  if (!response.node) {
    throw new Error(`Issue ${issueId} not found`)
  }

  // 统计非bot评论
  let humanComments = 0
  let hasMoreComments = response.node.comments.pageInfo.hasNextPage
  let cursor = response.node.comments.pageInfo.endCursor

  // 统计当前批次的非bot评论
  humanComments += response.node.comments.nodes.filter(
    (comment) => comment.author && comment.author.__typename !== 'Bot',
  ).length

  // 如果还有更多评论，继续获取
  while (hasMoreComments && cursor) {
    try {
      const moreCommentsQuery = `
        query GetMoreComments($issueId: ID!, $cursor: String!) {
          node(id: $issueId) {
            ... on Issue {
              comments(first: 100, after: $cursor) {
                nodes {
                  author {
                    __typename
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      `

      const moreResponse = await octokit.graphql<{
        node: {
          comments: {
            nodes: Array<{
              author: {
                __typename: string
              }
            }>
            pageInfo: {
              hasNextPage: boolean
              endCursor: string | null
            }
          }
        }
      }>(moreCommentsQuery, { issueId, cursor })

      if (moreResponse.node && moreResponse.node.comments) {
        humanComments += moreResponse.node.comments.nodes.filter(
          (comment) => comment.author && comment.author.__typename !== 'Bot',
        ).length

        hasMoreComments = moreResponse.node.comments.pageInfo.hasNextPage
        cursor = moreResponse.node.comments.pageInfo.endCursor
      } else {
        break
      }
    } catch (error) {
      console.error(
        `Failed to fetch more comments for issue ${issueId}:`,
        error,
      )
      break
    }
  }

  return {
    id: response.node.id,
    reactions: response.node.reactions.totalCount,
    comments: humanComments,
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
              comments(first: 100) {
                nodes {
                  author {
                    __typename
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
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
          comments: {
            nodes: Array<{
              author: {
                __typename: string
              }
            }>
            pageInfo: {
              hasNextPage: boolean
              endCursor: string | null
            }
          }
        }>
      }>(query, { issueIds: batch })

      // 处理每个Issue的统计数据
      for (const node of response.nodes) {
        if (node && node.id) {
          let humanComments = 0
          let hasMoreComments = node.comments.pageInfo.hasNextPage
          let cursor = node.comments.pageInfo.endCursor

          // 统计当前批次的非bot评论
          humanComments += node.comments.nodes.filter(
            (comment) => comment.author && comment.author.__typename !== 'Bot',
          ).length

          // 如果还有更多评论，继续获取
          while (hasMoreComments && cursor) {
            try {
              const moreCommentsQuery = `
                query GetMoreComments($issueId: ID!, $cursor: String!) {
                  node(id: $issueId) {
                    ... on Issue {
                      comments(first: 100, after: $cursor) {
                        nodes {
                          author {
                            __typename
                          }
                        }
                        pageInfo {
                          hasNextPage
                          endCursor
                        }
                      }
                    }
                  }
                }
              `

              const moreResponse = await octokit.graphql<{
                node: {
                  comments: {
                    nodes: Array<{
                      author: {
                        __typename: string
                      }
                    }>
                    pageInfo: {
                      hasNextPage: boolean
                      endCursor: string | null
                    }
                  }
                }
              }>(moreCommentsQuery, { issueId: node.id, cursor })

              if (moreResponse.node && moreResponse.node.comments) {
                humanComments += moreResponse.node.comments.nodes.filter(
                  (comment) =>
                    comment.author && comment.author.__typename !== 'Bot',
                ).length

                hasMoreComments =
                  moreResponse.node.comments.pageInfo.hasNextPage
                cursor = moreResponse.node.comments.pageInfo.endCursor
              } else {
                break
              }

              // 小延迟避免API过载
              await new Promise((resolve) => setTimeout(resolve, 50))
            } catch (error) {
              console.error(
                `Failed to fetch more comments for issue ${node.id}:`,
                error,
              )
              break
            }
          }

          statsMap.set(node.id, {
            id: node.id,
            reactions: node.reactions.totalCount,
            comments: humanComments,
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
        statsMap.set(id, { id, reactions: 0, comments: 0 })
      })
    }
  }

  return statsMap
}
