import { NextRequest, NextResponse } from 'next/server'
import { getItemsByRepo, getReposConfig } from '@/lib/github-server-utils'

export const revalidate = 300 // 5分钟缓存

export async function GET(request: NextRequest) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { searchParams } = new URL(request.url)
    const repo = searchParams.get('repo')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    if (!repo) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: '缺少 repo 参数',
          usage: 'GET /api/repos?repo=owner/name&page=1&pageSize=20'
        },
        { status: 400, headers }
      )
    }

    console.log(`📦 API: 获取仓库 ${repo} 的数据...`)

    const data = await getItemsByRepo(repo, page, pageSize)

    console.log(`✅ API: 返回仓库 ${repo} 的 ${data.items.length}/${data.total} 个段子`)

    return NextResponse.json({
      ...data,
      source: 'github-issues',
      repository: repo
    }, { headers })

  } catch (error) {
    console.error('❌ API: 获取仓库数据失败:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : '未知错误',
        source: 'github-issues'
      },
      { status: 500, headers }
    )
  }
}

// 获取所有配置的仓库列表
export async function POST() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const repos = getReposConfig()

    return NextResponse.json({
      repos: repos.map(repo => ({
        key: `${repo.owner}/${repo.name}`,
        owner: repo.owner,
        name: repo.name,
        label: repo.label || '文案',
        url: `https://github.com/${repo.owner}/${repo.name}`
      })),
      total: repos.length,
      source: 'github-issues'
    }, { headers })

  } catch (error) {
    console.error('❌ API: 获取仓库配置失败:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500, headers }
    )
  }
}

export function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return new NextResponse(null, { status: 200, headers })
}