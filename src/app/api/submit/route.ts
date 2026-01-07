import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, GitHubServiceError, getCurrentUser, requireUserAuth } from '@/lib/github-service'
import { SubmitJokeRequest, SubmitJokeResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 获取用户认证状态
    const user = await getCurrentUser(request)
    requireUserAuth(user)

    const body: SubmitJokeRequest = await request.json()
    const { title, content } = body

    // 验证输入
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '标题和内容不能为空',
      }, { status: 400 })
    }

    if (title.length > 100) {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '标题不能超过100个字符',
      }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '内容不能超过2000个字符',
      }, { status: 400 })
    }

    // 创建 GitHub 服务实例（使用用户token）
    const githubService = await GitHubService.createWithUserToken(request)

    try {
      // 创建 GitHub Issue
      const issueData = await githubService.createJokeIssue(title, content)

      console.log('Issue创建成功:', {
        number: issueData.number,
        url: issueData.html_url,
        user: user.username
      })

      return NextResponse.json<SubmitJokeResponse>({
        success: true,
        message: '文案提交成功！感谢您的贡献，您的文案正在等待审核。',
        issueUrl: issueData.html_url,
        issueNumber: issueData.number,
        issueId: issueData.id,
        detailPath: `/jokes/${issueData.number}`,
      })

    } catch (githubError: any) {
      if (githubError instanceof GitHubServiceError) {
        console.error('GitHub API错误:', {
          code: githubError.code,
          message: githubError.message,
          status: githubError.status,
          user: user.username
        })

        // 处理限流错误
        if (githubError.code === 'RATE_LIMIT_FORCE_LOGIN') {
          return NextResponse.json<SubmitJokeResponse>({
            success: false,
            message: 'API调用频率过高，请稍后重试或联系管理员',
          }, { status: 429 })
        }

        // 处理常见的GitHub API错误
        if (githubError.code === 'FORBIDDEN') {
          return NextResponse.json<SubmitJokeResponse>({
            success: false,
            message: '权限不足，请确保已授权访问仓库',
          }, { status: 403 })
        }

        if (githubError.code === 'NOT_FOUND') {
          return NextResponse.json<SubmitJokeResponse>({
            success: false,
            message: '仓库不存在或无权访问',
          }, { status: 404 })
        }

        if (githubError.code === 'INVALID_DATA') {
          return NextResponse.json<SubmitJokeResponse>({
            success: false,
            message: '提交数据格式错误，请检查内容后重试',
          }, { status: 422 })
        }

        return NextResponse.json<SubmitJokeResponse>({
          success: false,
          message: `GitHub API错误: ${githubError.message}`,
        }, { status: githubError.status || 500 })
      }

      throw githubError
    }

  } catch (error: any) {
    console.error('提交文案失败:', {
      error: error.message,
      stack: error.stack
    })

    // 处理认证错误
    if (error instanceof GitHubServiceError && error.code === 'AUTHENTICATION_REQUIRED') {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '请先登录GitHub账号',
      }, { status: 401 })
    }

    if (error instanceof GitHubServiceError && error.code === 'NOT_AUTHENTICATED') {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '请先登录GitHub账号',
      }, { status: 401 })
    }

    if (error instanceof GitHubServiceError && error.code === 'INVALID_TOKEN') {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '认证信息无效，请重新登录',
      }, { status: 401 })
    }

    return NextResponse.json<SubmitJokeResponse>({
      success: false,
      message: '服务器错误，请稍后重试',
    }, { status: 500 })
  }
}
