import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LikeRequest, LikeResponse } from '@/types'
import { getOctokitInstance, addReaction, removeReaction, queryUserReaction } from '@/lib/github'



export async function POST(request: NextRequest) {
  try {
    // 获取用户session
    const session = await getServerSession(authOptions)

    if (!session?.user?.username) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
      }, { status: 401 })
    }

    const body: LikeRequest = await request.json()
    const { issueId, reaction } = body

    console.log('收到点赞请求:', { issueId, reaction, username: session.user.username })

    if (!issueId || !reaction) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '缺少必要参数',
      }, { status: 400 })
    }

    // 使用统一的 Octokit 实例（自动选择用户 token）
    const octokit = await getOctokitInstance(request)

    try {
      // 使用统一的 addReaction 函数
      const reactionId = await addReaction(octokit, issueId, reaction)

      console.log('✅ 点赞成功:', { issueId, reaction, reactionId })

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '点赞成功',
        reactionId,
      })

    } catch (graphqlError: any) {
      console.error('❌ GraphQL 操作失败:', {
        error: graphqlError.message,
        status: graphqlError.status,
        issueId,
        reaction
      })

      // 处理已存在的 reaction
      if (graphqlError.message?.includes('already exists')) {
        return NextResponse.json<LikeResponse>({
          success: false,
          message: '已经点过这个反应了',
        }, { status: 422 })
      }

      return NextResponse.json<LikeResponse>({
        success: false,
        message: `GraphQL 操作失败: ${graphqlError.message}`,
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('❌ 点赞失败:', error)

    // 处理 GitHub API 错误
    if (error.status === 404) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: 'Issue不存在或无权访问',
      }, { status: 404 })
    }

    if (error.status === 422) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '已经点过这个反应了',
      }, { status: 422 })
    }

    return NextResponse.json<LikeResponse>({
      success: false,
      message: '点赞失败，请稍后重试',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 获取用户session
    const session = await getServerSession(authOptions)

    if (!session?.user?.username) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
      }, { status: 401 })
    }

    const body: LikeRequest = await request.json()
    const { issueId, reaction } = body

    console.log('收到取消点赞请求:', { issueId, reaction, username: session.user.username })

    if (!issueId || !reaction) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '缺少必要参数',
      }, { status: 400 })
    }

    // 使用统一的 Octokit 实例（自动选择用户 token）
    const octokit = await getOctokitInstance(request)

    try {
      // 查询用户的 reaction（可选：验证用户是否已点赞）
      const userReaction = await queryUserReaction(octokit, issueId, session.user.username)

      if (!userReaction || userReaction.content !== reaction) {
        return NextResponse.json<LikeResponse>({
          success: false,
          message: '未找到要删除的reaction',
        }, { status: 404 })
      }

      // 使用统一的 removeReaction 函数
      const reactionId = await removeReaction(octokit, issueId, reaction)

      console.log('✅ 取消点赞成功:', { issueId, reaction, reactionId })

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '取消点赞成功',
      })

    } catch (graphqlError: any) {
      console.error('❌ GraphQL 操作失败:', graphqlError)
      
      return NextResponse.json<LikeResponse>({
        success: false,
        message: `GraphQL 操作失败: ${graphqlError.message}`,
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('❌ 取消点赞失败:', error)

    return NextResponse.json<LikeResponse>({
      success: false,
      message: '取消点赞失败，请稍后重试',
    }, { status: 500 })
  }
}
