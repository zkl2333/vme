import { NextRequest, NextResponse } from 'next/server'
import { getReposConfig } from '@/lib/github-server-utils'

export const revalidate = 0 // 不缓存检查请求

/**
 * 检查是否有更新的轻量级 API
 * GET /api/sync/check?repo=owner/name&since=timestamp
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

    if (!repoKey) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: '缺少 repo 参数',
          usage: 'GET /api/sync/check?repo=owner/name&since=timestamp'
        },
        { status: 400, headers }
      )
    }

    console.log(`🔍 检查更新: ${repoKey}, since: ${new Date(since).toISOString()}`)

    // 检查指定仓库是否有新数据
    const result = await checkRepoUpdates(repoKey, since)

    console.log(`📊 检查结果: ${result.hasUpdates ? '有' : '无'}更新, 新增 ${result.newItemsCount} 条`)

    return NextResponse.json({
      hasUpdates: result.hasUpdates,
      newItemsCount: result.newItemsCount,
      latestTimestamp: result.latestTimestamp,
      repoKey,
      checkTime: Date.now()
    }, { headers })

  } catch (error) {
    console.error('❌ 检查更新失败:', error)
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
 * 检查指定仓库的更新情况
 */
async function checkRepoUpdates(repoKey: string, since: number) {
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
    // 使用 GraphQL 查询新数据数量和最新时间戳
    const result = await octokit.graphql(`
      query($owner: String!, $name: String!, $since: DateTime!, $label: String!) {
        repository(owner: $owner, name: $name) {
          issues(
            first: 1
            labels: [$label]
            filterBy: { since: $since }
            orderBy: { field: CREATED_AT, direction: DESC }
          ) {
            totalCount
            nodes {
              id
              createdAt
            }
          }
        }
      }
    `, {
      owner,
      name,
      since: new Date(since).toISOString(),
      label: repoConfig.label || '文案'
    })

    const issues = (result as any).repository.issues
    const hasUpdates = issues.totalCount > 0
    const latestTimestamp = issues.nodes[0]
      ? new Date(issues.nodes[0].createdAt).getTime()
      : since

    return {
      hasUpdates,
      newItemsCount: issues.totalCount,
      latestTimestamp,
      repoKey
    }

  } catch (error) {
    console.error(`❌ 查询 ${repoKey} 失败:`, error)
    throw new Error(`查询仓库 ${repoKey} 失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

export function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return new NextResponse(null, { status: 200, headers })
}