import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { Octokit } from '@octokit/core'
import { LikeRequest, LikeResponse } from '@/types'
import { ServerSession } from '@/types/server-auth'

export async function POST(request: NextRequest) {
  try {
    // 获取用户session
    const session = await getServerSession(authOptions) as ServerSession | null

    if (!session?.accessToken) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
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
      auth: session.accessToken,
    })

    // 使用GraphQL API通过issue ID获取issue信息
    const graphqlQuery = `
      query GetIssue($id: ID!) {
        node(id: $id) {
          ... on Issue {
            repository {
              owner {
                login
              }
              name
            }
            number
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
      if (!issueData || !issueData.repository) {
        console.log('Issue数据无效:', issueData)
        return NextResponse.json<LikeResponse>({
          success: false,
          message: 'Issue不存在或无权访问',
        }, { status: 404 })
      }

      const owner = issueData.repository.owner.login
      const repo = issueData.repository.name
      const issueNumber = issueData.number

      console.log('解析的issue信息:', { owner, repo, issueNumber })

      if (!owner || !repo || !issueNumber) {
        console.log('缺少必要的issue信息')
        return NextResponse.json<LikeResponse>({
          success: false,
          message: '无法获取issue信息',
        }, { status: 400 })
      }

      // 添加reaction到GitHub issue
      const response = await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/reactions', {
        owner,
        repo,
        issue_number: issueNumber,
        content: reaction,
        headers: {
          accept: 'application/vnd.github.squirrel-girl-preview+json',
        },
      })

      console.log('Reaction添加成功:', response.data)

      return NextResponse.json<LikeResponse>({
        success: true,
        message: '点赞成功',
        reactionId: response.data.id?.toString(),
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
    const session = await getServerSession(authOptions) as ServerSession | null

    if (!session?.accessToken) {
      return NextResponse.json<LikeResponse>({
        success: false,
        message: '请先登录GitHub',
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
      auth: session.accessToken,
    })

    // 首先获取issue的reactions信息，找到用户要删除的reaction
    const reactionsQuery = `
      query GetIssueReactions($id: ID!) {
        node(id: $id) {
          ... on Issue {
            repository {
              owner {
                login
              }
              name
            }
            number
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
      if (!issueData || !issueData.repository) {
        return NextResponse.json<LikeResponse>({
          success: false,
          message: 'Issue不存在或无权访问',
        }, { status: 404 })
      }

      const owner = issueData.repository.owner.login
      const repo = issueData.repository.name
      const issueNumber = issueData.number
      const reactions = issueData.reactions.nodes || []

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

      // 删除reaction
      const response = await octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}', {
        owner,
        repo,
        issue_number: issueNumber,
        reaction_id: userReaction.id,
        headers: {
          accept: 'application/vnd.github.squirrel-girl-preview+json',
        },
      })

      console.log('Reaction删除成功')

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
