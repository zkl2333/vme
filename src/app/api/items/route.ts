import { NextResponse } from 'next/server'
import { getAllKfcItems } from '@/lib/server-utils'

export const revalidate = 3600 // 设置重新验证间隔为1小时

export async function GET() {
  // 处理跨域请求
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const items = await getAllKfcItems()
    return NextResponse.json({ items, total: items.length }, { headers })
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
