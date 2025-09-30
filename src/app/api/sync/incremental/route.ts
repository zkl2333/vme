import { NextRequest, NextResponse } from 'next/server'
import { getReposConfig } from '@/lib/github-server-utils'
import { queryRepoIssuesSince, GraphQLQueryOptions } from '@/lib/github'
import type { IKfcItem } from '@/types'

export const revalidate = 0 // 不缓存增量数据

/**
 * 获取增量数据的 API
 * GET /api/sync/incremental?repo=owner/name&since=timestamp&page=1&pageSize=100
 */
export async function GET(request: NextRequest) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { searchParams } = new URL(request.url)
    const repoKey = searchParams.get('repo')
    const since = parseInt(searchParams.get('since') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '100'), 500) // 限制最大500

    if (!repoKey) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: '缺少 repo 参数',
          usage: 'GET /api/sync/incremental?repo=owner/name&since=timestamp&page=1&pageSize=100'
        },
        { status: 400, headers }
      )
    }

    console.log(`📥 增量同步: ${repoKey}, since: ${new Date(since).toISOString()}, page: ${page}`)

    const result = await getIncrementalData(repoKey, {
      since,
      page,
      pageSize
    })

    console.log(`✅ 增量数据: ${result.items.length} 条, hasMore: ${result.hasMore}`)

    return NextResponse.json({
      items: result.items,
      hasMore: result.hasMore,
      currentPage: page,
      pageSize,
      totalEstimated: result.totalEstimated,
      nextPage: result.hasMore ? page + 1 : null,
      syncTime: Date.now(),
      repoKey
    }, { headers })

  } catch (error) {
    console.error('❌ 增量同步失败:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : '未知错误',
        repoKey: new URL(request.url).searchParams.get('repo') || 'unknown'
      },
      { status: 500, headers }
    )
  }
}

/**
 * 获取指定仓库的增量数据
 */
async function getIncrementalData(repoKey: string, options: {
  since: number
  page: number
  pageSize: number
}) {
  const { since, page, pageSize } = options
  const [owner, name] = repoKey.split('/')

  if (!owner || !name) {
    throw new Error(`无效的仓库格式: ${repoKey}`)
  }

  // 从配置中找到对应仓库
  const reposConfig = getReposConfig()
  const repoConfig = reposConfig.find(r => `${r.owner}/${r.name}` === repoKey)
  if (!repoConfig) {
    throw new Error(`未配置的仓库: ${repoKey}`)
  }

  // 获取 Octokit 实例
  const { getSystemOctokitInstance } = await import('@/lib/github')
  const octokit = getSystemOctokitInstance()

  try {
    let allItems: any[] = []
    let cursor: string | null = null
    let hasMore = true
    let currentPage = 1

    // 获取指定页面的数据
    while (currentPage <= page && hasMore) {
      const queryOptions: GraphQLQueryOptions = {
        owner,
        name,
        label: repoConfig.label || '文案',
        state: repoConfig.state || 'ALL',
        cursor,
        pageSize: 100 // GitHub API 每次获取100条
      }

      const result = await queryRepoIssuesSince(octokit, queryOptions)
      const issues = result.repository.issues

      // 过滤出指定时间戳之后的 issues
      const sinceDate = new Date(since).getTime()
      const filteredIssues = issues.nodes.filter((issue: any) =>
        new Date(issue.createdAt).getTime() > sinceDate
      )

      // 转换为 IKfcItem 格式
      const kfcItems: IKfcItem[] = filteredIssues.map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        url: issue.url,
        body: issue.body,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        author: {
          username: issue.author.login,
          avatarUrl: issue.author.avatarUrl,
          url: issue.author.url,
        },
        reactions: {
          totalCount: issue.reactions.totalCount,
        },
        repository: {
          owner,
          name,
          url: `https://github.com/${owner}/${name}`
        }
      }))

      if (currentPage === page) {
        // 当前页面，返回数据
        const startIndex = 0
        const endIndex = Math.min(pageSize, kfcItems.length)
        allItems = kfcItems.slice(startIndex, endIndex)
      }

      hasMore = (issues as any).pageInfo?.hasNextPage && filteredIssues.length > 0
      cursor = (issues as any).pageInfo?.endCursor
      currentPage++

      // 如果没有找到更多的新数据，停止查询
      if (filteredIssues.length === 0) {
        hasMore = false
        break
      }

      // 避免无限循环
      if (currentPage > 50) {
        console.warn(`⚠️ 增量同步页数过多，停止在第 ${currentPage} 页`)
        break
      }
    }

    // 估算总数（这里简化处理）
    const totalEstimated = allItems.length + (hasMore ? pageSize : 0)

    return {
      items: allItems,
      hasMore: hasMore && allItems.length === pageSize,
      totalEstimated,
      repoKey
    }

  } catch (error) {
    console.error(`❌ 获取 ${repoKey} 增量数据失败:`, error)
    throw new Error(`获取仓库 ${repoKey} 增量数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

export function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return new NextResponse(null, { status: 200, headers })
}