import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, GitHubServiceError, getCurrentUser, requireUserAuth } from '@/lib/github-service'
import { LikeRequest, LikeResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 获取用户认证状态
    const user = await getCurrentUser(request)
    requireUserAuth(user)

    const body: LikeRequest = await request.json()
    const { issueId, reaction } = body

    console.log('收到点赞请求:', { issueId, reaction })

    if (!issueId || !reaction) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '缺少必要参数',
      }, { status: 400 })
    }

    // 创建 GitHub 服务实例（使用用户token）
    const githubService = await GitHubService.createWithUserToken(request)

    try {
      // 验证issue是否存在
      const issueExists = await githubService.validateIssue(issueId)
      if (!issueExists) {
        console.log('Issue不存在:', issueId)
        return NextResponse.json<LikeResponse>({
          success: false,
          message: 'Issue不存在或无权访问',
        }, { status: 404 })
      }

      console.log('Issue验证成功:', issueId)

      // 添加反应
      const reactionId = await githubService.addReaction(issueId, reaction as any)

      console.log('反应添加成功:', { reactionId, issueId })

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '点赞成功',
        reactionId,
      })

    } catch (githubError: any) {
      if (githubError instanceof GitHubServiceError) {
        console.error('GitHub API错误:', {
          code: githubError.code,
          message: githubError.message,
          status: githubError.status,
          issueId
        })

        // 处理限流错误
        if (githubError.code === 'RATE_LIMIT_FORCE_LOGIN') {
          return NextResponse.json<LikeResponse>({
            success: false,
            message: 'API调用频率过高，请稍后重试',
          }, { status: 429 })
        }

        if (githubError.code === 'NOT_FOUND') {
          return NextResponse.json<LikeResponse>({
            success: false,
            message: 'Issue不存在或无权访问',
          }, { status: 404 })
        }

        if (githubError.code === 'INVALID_DATA') {
          return NextResponse.json<LikeResponse>({
            success: false,
            message: '已经点过这个反应了',
          }, { status: 422 })
        }

        return NextResponse.json<LikeResponse>({
          success: false,
          message: `操作失败: ${githubError.message}`,
        }, { status: githubError.status || 500 })
      }

      throw githubError
    }

  } catch (error: any) {
    console.error('点赞失败:', error)

    // 处理认证错误
    if (error instanceof GitHubServiceError && error.code === 'AUTHENTICATION_REQUIRED') {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
      }, { status: 401 })
    }

    if (error instanceof GitHubServiceError && error.code === 'NOT_AUTHENTICATED') {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
      }, { status: 401 })
    }

    if (error instanceof GitHubServiceError && error.code === 'INVALID_TOKEN') {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '认证信息无效，请重新登录',
      }, { status: 401 })
    }

    return NextResponse.json<LikeResponse>({
      success: false,
      message: '点赞失败，请稍后重试',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 获取用户认证状态
    const user = await getCurrentUser(request)
    requireUserAuth(user)

    const body: LikeRequest = await request.json()
    const { issueId, reaction } = body

    console.log('收到取消点赞请求:', { issueId, reaction })

    if (!issueId || !reaction) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '缺少必要参数',
      }, { status: 400 })
    }

    // 创建 GitHub 服务实例（使用用户token）
    const githubService = await GitHubService.createWithUserToken(request)

    try {
      // 删除反应
      await githubService.removeReaction(issueId, reaction as any, user.username)

      console.log('删除反应成功:', { issueId, reaction, user: user.username })

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '取消点赞成功',
      })

    } catch (githubError: any) {
      if (githubError instanceof GitHubServiceError) {
        console.error('GitHub API错误:', {
          code: githubError.code,
          message: githubError.message,
          status: githubError.status,
          issueId
        })

        // 处理限流错误
        if (githubError.code === 'RATE_LIMIT_FORCE_LOGIN') {
          return NextResponse.json<LikeResponse>({
            success: false,
            message: 'API调用频率过高，请稍后重试',
          }, { status: 429 })
        }

        if (githubError.code === 'REACTION_NOT_FOUND') {
          return NextResponse.json<LikeResponse>({
            success: false,
            message: '未找到要删除的reaction',
          }, { status: 404 })
        }

        return NextResponse.json<LikeResponse>({
          success: false,
          message: `操作失败: ${githubError.message}`,
        }, { status: githubError.status || 500 })
      }

      throw githubError
    }

  } catch (error: any) {
    console.error('取消点赞失败:', error)

    // 处理认证错误
    if (error instanceof GitHubServiceError && error.code === 'AUTHENTICATION_REQUIRED') {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
      }, { status: 401 })
    }

    if (error instanceof GitHubServiceError && error.code === 'NOT_AUTHENTICATED') {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
      }, { status: 401 })
    }

    if (error instanceof GitHubServiceError && error.code === 'INVALID_TOKEN') {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '认证信息无效，请重新登录',
      }, { status: 401 })
    }

    return NextResponse.json<LikeResponse>({
      success: false,
      message: '取消点赞失败，请稍后重试',
    }, { status: 500 })
  }
}
