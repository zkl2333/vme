import { NextRequest, NextResponse } from 'next/server'
import { getKfcItemsWithPagination } from '@/lib/github-server-utils'

export const revalidate = 60 // 设置重新验证间隔为60秒

export async function GET(request: NextRequest) {
  // 处理跨域请求
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { searchParams } = new URL(request.url)
    // 从查询参数中获取分页信息
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const repo = searchParams.get('repo') // 新增：按仓库过滤

    console.log(`📄 API: 获取分页数据 page=${page}, pageSize=${pageSize}, repo=${repo}`)

    // 获取分页数据
    const data = await getKfcItemsWithPagination(page, pageSize)

    // 如果指定了仓库，则过滤数据
    if (repo) {
      const filteredItems = data.items.filter(item =>
        item.repository && `${item.repository.owner}/${item.repository.name}` === repo
      )

      console.log(`🔍 API: 按仓库 ${repo} 过滤，返回 ${filteredItems.length} 个段子`)

      return NextResponse.json({
        ...data,
        items: filteredItems,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / pageSize),
        source: 'github-issues',
        filter: { repo }
      }, { headers })
    }

    console.log(`✅ API: 返回分页数据 ${data.items.length}/${data.total}`)

    return NextResponse.json({
      ...data,
      source: 'github-issues'
    }, { headers })
  } catch (error) {
    console.error('❌ API: 获取分页数据失败:', error)
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
