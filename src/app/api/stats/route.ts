import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/core'

// 缓存结果，避免频繁请求GitHub API
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

interface IssueStats {
  id: string
  reactions: number
  comments: number
}

export async function POST(request: NextRequest) {
  try {
    const { issueIds } = await request.json()

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json({ error: 'Invalid issue IDs' }, { status: 400 })
    }

    // 检查GitHub Token是否配置
    if (!process.env.GITHUB_TOKEN) {
      console.warn('GitHub token not configured. Statistics will show as 0.')
      return NextResponse.json(
        {
          error:
            'GitHub token not configured. Please set GITHUB_TOKEN environment variable.',
          hint: 'Copy env.local.example to .env and add your GitHub token',
        },
        { status: 500 },
      )
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })

    const results: IssueStats[] = []

    for (const issueId of issueIds) {
      // 检查缓存
      const cached = cache.get(issueId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        results.push(cached.data)
        continue
      }

      try {
        // 使用GitHub GraphQL API获取单个Issue的统计数据
        const query = `
          query GetIssueStats($issueId: ID!) {
            node(id: $issueId) {
              ... on Issue {
                id
                reactions {
                  totalCount
                }
                comments {
                  totalCount
                }
              }
            }
          }
        `

        const response = await octokit.graphql<{
          node: {
            id: string
            reactions: { totalCount: number }
            comments: { totalCount: number }
          }
        }>(query, { issueId })

        if (response.node) {
          const stats: IssueStats = {
            id: response.node.id,
            reactions: response.node.reactions.totalCount,
            comments: response.node.comments.totalCount,
          }

          // 缓存结果
          cache.set(issueId, {
            data: stats,
            timestamp: Date.now(),
          })

          results.push(stats)
        }
      } catch (error) {
        console.error(`Failed to fetch stats for issue ${issueId}:`, error)
        // 如果单个请求失败，返回默认值
        results.push({
          id: issueId,
          reactions: 0,
          comments: 0,
        })
      }
    }

    return NextResponse.json({ stats: results })
  } catch (error) {
    console.error('Error fetching issue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issue statistics' },
      { status: 500 },
    )
  }
}

// 清理过期缓存的函数
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key)
    }
  }
}, CACHE_DURATION)
