import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { Octokit } from '@octokit/core'
import { LikeRequest, LikeResponse } from '@/types'



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

    // 从JWT token中获取access token（仅在服务器端）
    const secret = process.env.NEXTAUTH_SECRET
    const token = await getToken({ req: request, secret })
    const accessToken = token?.accessToken

    if (!accessToken) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '认证信息无效，请重新登录',
      }, { status: 401 })
    }

    const body: LikeRequest = await request.json()
    const { issueId, reaction } = body

    console.log('收到点赞请求:', { issueId, reaction })

    if (!issueId || !reaction) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '缺少必要参数',
      }, { status: 400 })
    }

    // 创建Octokit实例，使用用户的access token
    const octokit = new Octokit({
      auth: accessToken,
    })

    // 验证issue是否存在
    const graphqlQuery = `
      query GetIssue($id: ID!) {
        node(id: $id) {
          ... on Issue {
            id
          }
        }
      }
    `

    try {
      console.log('执行GraphQL查询，issueId:', issueId)
      const graphqlResponse = await octokit.graphql(graphqlQuery, {
        id: issueId,
      })

      console.log('GraphQL响应:', JSON.stringify(graphqlResponse, null, 2))

      const issueData = (graphqlResponse as any).node
      if (!issueData) {
        console.log('Issue不存在:', issueId)
        return NextResponse.json<LikeResponse>({
          success: false,
          message: 'Issue不存在或无权访问',
        }, { status: 404 })
      }

      console.log('Issue验证成功:', issueId)

      // 使用GraphQL Mutation添加reaction
      const addReactionMutation = `
        mutation AddReaction($input: AddReactionInput!) {
          addReaction(input: $input) {
            reaction {
              id
              content
            }
            subject {
              id
            }
          }
        }
      `

      const mutationResponse = await octokit.graphql(addReactionMutation, {
        input: {
          subjectId: issueId,
          content: reaction,
        },
      })

      console.log('GraphQL Mutation响应:', JSON.stringify(mutationResponse, null, 2))

      const reactionData = (mutationResponse as any).addReaction?.reaction
      if (!reactionData) {
        throw new Error('添加reaction失败：GraphQL响应无效')
      }

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '点赞成功',
        reactionId: reactionData.id,
      })

    } catch (graphqlError: any) {
      console.error('GraphQL查询失败:', {
        error: graphqlError.message,
        status: graphqlError.status,
        data: graphqlError.data,
        issueId
      })
      return NextResponse.json<LikeResponse>({
        success: false,
        message: `GraphQL查询失败: ${graphqlError.message}`,
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('点赞失败:', error)

    // 处理GitHub API错误
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

    // 从JWT token中获取access token（仅在服务器端）
    const secret = process.env.NEXTAUTH_SECRET
    const token = await getToken({ req: request, secret })
    const accessToken = token?.accessToken

    if (!accessToken) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '认证信息无效，请重新登录',
      }, { status: 401 })
    }

    const body: LikeRequest = await request.json()
    const { issueId, reaction } = body




    console.log('收到取消点赞请求:', { issueId, reaction })

    if (!issueId || !reaction) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '缺少必要参数',
      }, { status: 400 })
    }

    // 创建Octokit实例，使用用户的access token
    const octokit = new Octokit({
      auth: accessToken,
    })

    // 获取issue的reactions信息，找到用户要删除的reaction
    const reactionsQuery = `
      query GetIssueReactions($id: ID!) {
        node(id: $id) {
          ... on Issue {
            reactions(first: 100) {
              nodes {
                id
                content
                user {
                  login
                }
              }
            }
          }
        }
      }
    `

    try {
      const graphqlResponse = await octokit.graphql(reactionsQuery, {
        id: issueId,
      })

      const issueData = (graphqlResponse as any).node
      if (!issueData) {
        return NextResponse.json<LikeResponse>({
          success: false,
          message: 'Issue不存在或无权访问',
        }, { status: 404 })
      }

      const reactions = issueData.reactions.nodes || []

      console.log('session.user.username', session.user.username)
      console.log('r.content', reaction)
      console.log('reactions', reactions)

      // 找到当前用户要删除的reaction
      const userReaction = reactions.find((r: any) =>
        r.user.login === session.user.username && r.content === reaction
      )

      if (!userReaction) {
        return NextResponse.json<LikeResponse>({
          success: false,
          message: '未找到要删除的reaction',
        }, { status: 404 })
      }

      // 使用GraphQL Mutation删除reaction
      const removeReactionMutation = `
        mutation RemoveReaction($input: RemoveReactionInput!) {
          removeReaction(input: $input) {
            subject {
              id
            }
          }
        }
      `

      const mutationResponse = await octokit.graphql(removeReactionMutation, {
        input: {
          subjectId: issueId,
          content: reaction,
        },
      })

      console.log('GraphQL Mutation响应:', JSON.stringify(mutationResponse, null, 2))

      const mutationData = (mutationResponse as any).removeReaction
      if (!mutationData) {
        throw new Error('删除reaction失败：GraphQL响应无效')
      }

      console.log('删除reaction成功:', mutationData)

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '取消点赞成功',
      })

    } catch (graphqlError: any) {
      console.error('GraphQL查询失败:', graphqlError)
      return NextResponse.json<LikeResponse>({
        success: false,
        message: `GraphQL查询失败: ${graphqlError.message}`,
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('取消点赞失败:', error)

    return NextResponse.json<LikeResponse>({
      success: false,
      message: '取消点赞失败，请稍后重试',
    }, { status: 500 })
  }
}
