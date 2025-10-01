import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, GitHubServiceError } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  try {
    const status: any = {
      timestamp: new Date().toISOString(),
      github: {
        systemToken: {
          configured: !!process.env.GITHUB_TOKEN,
          status: 'unknown',
          rateLimit: null,
          error: null,
        },
        userToken: {
          available: false,
          status: 'unknown',
          rateLimit: null,
          error: null,
        }
      }
    }

    // 检查系统token状态
    if (process.env.GITHUB_TOKEN) {
      try {
        const systemService = GitHubService.createWithSystemToken()
        const systemRateLimit = await systemService.checkRateLimit()
        
        // 使用core API的限流信息（主要API）
        const coreLimit = systemRateLimit.core
        
        // 检查返回的数据是否有效（limit为0通常表示token无效）
        if (coreLimit.limit === 0 && coreLimit.remaining === 0) {
          throw new Error('Token appears to be invalid - received zero rate limits')
        }
        
        status.github.systemToken.status = 'working'
        status.github.systemToken.rateLimit = {
          remaining: coreLimit.remaining,
          limit: coreLimit.limit,
          resetTime: new Date(coreLimit.reset * 1000).toISOString(), // 转换Unix时间戳为ISO字符串
          percentage: Math.round((coreLimit.remaining / coreLimit.limit) * 100),
          shouldForceLogin: systemRateLimit.shouldForceLogin,
          isNearLimit: systemRateLimit.isNearLimit,
        }
      } catch (error: any) {
        status.github.systemToken.status = 'error'
        
        // 详细的错误分类
        if (error?.status === 401 || error.message?.includes('invalid')) {
          status.github.systemToken.error = 'Token 已过期或无效 (401 Bad credentials)'
        } else if (error?.status === 403) {
          status.github.systemToken.error = 'Token 权限不足 (403 Forbidden)'
        } else if (error?.status === 404) {
          status.github.systemToken.error = 'API 端点不存在 (404 Not Found)'
        } else if (error.message?.includes('zero rate limits')) {
          status.github.systemToken.error = 'Token 无效 - 接收到零配额限制'
        } else {
          const statusCode = error?.status || error?.response?.status || 'Unknown'
          status.github.systemToken.error = error instanceof Error 
            ? `${error.message} (${statusCode})`
            : 'Unknown error'
        }
      }
    } else {
      status.github.systemToken.status = 'not_configured'
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
        shouldForceLogin: userRateLimit.shouldForceLogin,
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

    // 智能服务状态
    try {
      const smartService = await GitHubService.createSafely(request)
      status.github.smartService = {
        available: !!smartService,
        // 移除对私有属性的访问，改为通过其他方式判断
        tokenType: smartService ? 'available' : 'none',
      }
    } catch (error) {
      status.github.smartService = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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