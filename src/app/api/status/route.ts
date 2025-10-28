import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, GitHubServiceError } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  try {
    const status: any = {
      timestamp: new Date().toISOString(),
      github: {
        userToken: {
          available: false,
          status: 'unknown',
          rateLimit: null,
          error: null,
        }
      }
    }

    // 检查用户token状态
    try {
      const userService = await GitHubService.createWithUserToken(request)
      const userRateLimit = await userService.checkRateLimit()
      
      // 使用core API的限流信息（主要API）
      const coreLimit = userRateLimit.core
      
      // 检查返回的数据是否有效（limit为0通常表示token无效）
      if (coreLimit.limit === 0 && coreLimit.remaining === 0) {
        throw new Error('User token appears to be invalid - received zero rate limits')
      }
      
      status.github.userToken.available = true
      status.github.userToken.status = 'working'
      status.github.userToken.rateLimit = {
        remaining: coreLimit.remaining,
        limit: coreLimit.limit,
        resetTime: new Date(coreLimit.reset * 1000).toISOString(), // 转换Unix时间戳为ISO字符串
        percentage: Math.round((coreLimit.remaining / coreLimit.limit) * 100),
        isNearLimit: userRateLimit.isNearLimit,
      }
    } catch (error: any) {
      status.github.userToken.available = false
      
      // 详细的错误分类
      if (error instanceof GitHubServiceError) {
        if (error.code === 'NOT_AUTHENTICATED') {
          status.github.userToken.status = 'not_authenticated'
          status.github.userToken.error = '用户未登录'
        } else if (error.code === 'INVALID_TOKEN') {
          status.github.userToken.status = 'invalid_token'
          status.github.userToken.error = '用户token无效或已过期'
        } else {
          status.github.userToken.status = 'error'
          status.github.userToken.error = error.message
        }
      } else if (error?.status === 401 || error.message?.includes('invalid')) {
        status.github.userToken.status = 'expired'
        status.github.userToken.error = '用户token已过期 (401 Bad credentials)'
      } else if (error.message?.includes('zero rate limits')) {
        status.github.userToken.status = 'invalid_token'
        status.github.userToken.error = '用户token无效 - 接收到零配额限制'
      } else {
        status.github.userToken.status = 'not_available'
        const statusCode = error?.status || error?.response?.status || 'Unknown'
        status.github.userToken.error = error instanceof Error 
          ? `${error.message} (${statusCode})`
          : 'Unknown error'
      }
    }

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('Error checking system status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check system status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}