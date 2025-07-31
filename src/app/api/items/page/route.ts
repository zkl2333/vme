import { NextRequest, NextResponse } from 'next/server'
import { getKfcItemsWithPagination } from '@/lib/server-utils'

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

    // 获取分页数据
    const data = await getKfcItemsWithPagination(page, pageSize)
    return NextResponse.json(data, { headers })
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
