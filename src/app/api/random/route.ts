import { NextRequest, NextResponse } from 'next/server'
import { getRandomKfcItem, getOctokitInstance } from '@/lib/server-utils'
import { getIssueStats } from '@/app/lib/github-stats'

export async function GET(request: NextRequest) {
  // 处理跨域请求
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  try {
    // 获取随机文案
    const randomItem = await getRandomKfcItem()

    if (!randomItem) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404, headers },
      )
    }

    // 获取详细的reactions信息 - 优先使用用户权限
    const octokit = await getOctokitInstance(request)
    const stats = await getIssueStats(octokit, randomItem.id)

    // 合并数据
    const enrichedItem = {
      ...randomItem,
      reactions: {
        totalCount: stats.reactions,
        details: stats.reactionDetails || [],
        nodes: stats.reactionNodes || [],
      },
    }

    if (format === 'text') {
      return new NextResponse(randomItem.body || '暂无数据', { headers })
    } else {
      // 默认返回 JSON 格式
      return NextResponse.json(enrichedItem, { headers })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers },
    )
  }
}

export function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return new NextResponse(null, { status: 200, headers })
}
