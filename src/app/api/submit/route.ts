import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { Octokit } from '@octokit/core'
import { SubmitJokeRequest, SubmitJokeResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 获取用户session
    const session = await getServerSession(authOptions)

    if (!session?.user?.username) {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '请先登录GitHub账号',
      }, { status: 401 })
    }

    // 从JWT token中获取access token
    const secret = process.env.NEXTAUTH_SECRET
    const token = await getToken({ req: request, secret })
    const accessToken = token?.accessToken

    if (!accessToken) {
      return NextResponse.json<SubmitJokeResponse>({
        success: false,
        message: '认证信息无效，请重新登录',
      }, { status: 401 })
    }

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

    // 创建Octokit实例
    const octokit = new Octokit({
      auth: accessToken,
    })

    // 获取仓库信息
    const repoOwner = 'zkl2333'  // 根据 CLAUDE.md 中的信息
    const repoName = 'vme'       // 根据项目结构推断

    try {
      // 创建GitHub Issue
      const response = await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: repoOwner,
        repo: repoName,
        title: title.trim(),
        body: content.trim(),
        labels: ['文案'],  // 自动添加"文案"标签
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      const issueData = response.data

      console.log('Issue创建成功:', {
        number: issueData.number,
        url: issueData.html_url,
        user: session.user.username
      })

      return NextResponse.json<SubmitJokeResponse>({
        success: true,
        message: '文案提交成功！感谢您的贡献，您的文案正在等待审核。',
        issueUrl: issueData.html_url,
        issueNumber: issueData.number,
      })

    } catch (githubError: any) {
      console.error('GitHub API错误:', {
        error: githubError.message,
        status: githubError.status,
        data: githubError.response?.data,
        user: session.user.username
      })

      // 处理常见的GitHub API错误
      if (githubError.status === 403) {
        return NextResponse.json<SubmitJokeResponse>({
          success: false,
          message: '权限不足，请确保已授权访问仓库',
        }, { status: 403 })
      }

      if (githubError.status === 404) {
        return NextResponse.json<SubmitJokeResponse>({
          success: false,
          message: '仓库不存在或无权访问',
        }, { status: 404 })
      }

      if (githubError.status === 422) {
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

  } catch (error: any) {
    console.error('提交文案失败:', {
      error: error.message,
      stack: error.stack
    })

    return NextResponse.json<SubmitJokeResponse>({
      success: false,
      message: '服务器错误，请稍后重试',
    }, { status: 500 })
  }
}