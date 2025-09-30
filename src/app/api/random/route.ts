import { NextRequest, NextResponse } from 'next/server'
import { getRandomKfcItem, getOctokitInstance } from '@/lib/github-server-utils'
import { queryIssueStats } from '@/lib/github'

export async function GET(request: NextRequest) {
  // 处理跨域请求
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  try {
    console.log('🎲 API: 获取随机段子...')

    // 获取随机文案
    const randomItem = await getRandomKfcItem()

    if (!randomItem) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404, headers },
      )
    }

    console.log(`🎯 API: 随机选中段子 ${randomItem.title}`)

    // 获取详细的reactions信息 - 优先使用用户权限
    const octokit = await getOctokitInstance(request)
    const stats = await queryIssueStats(octokit, randomItem.id)

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
      console.log(`✅ API: 返回随机段子，来自 ${randomItem.repository?.owner}/${randomItem.repository?.name}`)
      return NextResponse.json({
        ...enrichedItem,
        source: 'github-issues',
        repository: randomItem.repository
      }, { headers })
    }
  } catch (error) {
    console.error('❌ API: 获取随机段子失败:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : '未知错误',
        source: 'github-issues'
      },
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
