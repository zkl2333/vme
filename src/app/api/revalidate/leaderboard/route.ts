import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源或添加安全检查
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 重新验证排行榜页面
    revalidatePath('/leaderboard')
    
    console.log('Leaderboard revalidated successfully')
    
    return NextResponse.json({ 
      message: 'Leaderboard revalidated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to revalidate leaderboard:', error)
    return NextResponse.json(
      { message: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}