import { NextResponse } from 'next/server'
import { getRandomKfcItem } from '@/lib/server-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const randomJoke = await getRandomKfcItem()
    return NextResponse.json({ id: randomJoke.id })
  } catch (error) {
    console.error('获取随机段子 ID 失败:', error)
    return NextResponse.json(
      { error: 'Failed to get random joke' },
      { status: 500 }
    )
  }
}
