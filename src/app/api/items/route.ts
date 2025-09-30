import { NextResponse } from 'next/server'
import { getAllKfcItems } from '@/lib/github-server-utils'

export const revalidate = 3600 // 设置重新验证间隔为1小时

export async function GET() {
  // 处理跨域请求
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    console.log('🚀 API: 获取所有段子列表...')
    const items = await getAllKfcItems()

    console.log(`✅ API: 返回 ${items.length} 个段子`)
    return NextResponse.json({
      items,
      total: items.length,
      source: 'github-issues',
      repos: items.reduce((acc, item) => {
        if (item.repository) {
          const repoKey = `${item.repository.owner}/${item.repository.name}`
          acc[repoKey] = (acc[repoKey] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }, { headers })
  } catch (error) {
    console.error('❌ API: 获取段子列表失败:', error)
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
