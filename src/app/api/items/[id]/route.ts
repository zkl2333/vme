import { NextRequest, NextResponse } from 'next/server'
import { getAllKfcItems } from '@/lib/server-utils'

export const revalidate = 60 // 60秒缓存

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { id } = params
    const items = await getAllKfcItems()
    const item = items.find((item) => item.id === id)

    if (!item) {
      return NextResponse.json(
        { error: 'Joke not found' },
        { status: 404, headers }
      )
    }

    return NextResponse.json(item, { headers })
  } catch (error) {
    console.error('获取段子失败:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers }
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
