import { NextResponse } from 'next/server'
import { getCacheStats, healthCheck, refreshCache } from '@/lib/github-server-utils'

export const revalidate = 0 // 不缓存状态信息

export async function GET() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    console.log('🔍 API: 执行系统健康检查...')

    const health = await healthCheck()

    console.log(`📊 API: 系统状态 ${health.status}`)

    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
      source: 'github-issues'
    }, { headers })

  } catch (error) {
    console.error('❌ API: 健康检查失败:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
        source: 'github-issues'
      },
      { status: 500, headers }
    )
  }
}

// 手动刷新缓存
export async function POST() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    console.log('🔄 API: 手动刷新缓存...')

    const startTime = Date.now()
    await refreshCache()
    const duration = Date.now() - startTime

    const newStats = await getCacheStats()

    console.log(`✅ API: 缓存刷新完成，耗时 ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: '缓存刷新成功',
      duration: `${duration}ms`,
      cache: newStats,
      timestamp: new Date().toISOString(),
      source: 'github-issues'
    }, { headers })

  } catch (error) {
    console.error('❌ API: 刷新缓存失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cache refresh failed',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
        source: 'github-issues'
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