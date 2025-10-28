import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, GitHubServiceError } from '@/lib/github-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  const { issueId } = params

  if (!issueId) {
    return NextResponse.json(
      { error: 'Issue ID is required' },
      { status: 400 }
    )
  }

  try {
    // 检查是否有 GitHub Token 配置
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        {
          error: 'GitHub token not configured',
          hint: 'Set GITHUB_TOKEN environment variable for real-time reactions',
          fallback: {
            totalCount: 0,
            details: [],
            nodes: [],
          }
        },
        { status: 503 }
      )
    }

    // 使用智能服务创建，优先用户 token，降级到系统 token
    const githubService = await GitHubService.createSmart(request)
    
    // 获取实时 reactions 数据
    const stats = await githubService.getIssueStats(issueId)
    
    const response = {
      issueId,
      totalCount: stats.reactions,
      details: stats.reactionDetails,
      nodes: stats.reactionNodes,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    })

  } catch (error) {
    console.error(`Error fetching reactions for issue ${issueId}:`, error)

    if (error instanceof GitHubServiceError) {
      // 处理限流错误
      if (error.code === 'RATE_LIMIT_FORCE_LOGIN') {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'GitHub API rate limit reached. Please login to use your personal quota.',
            code: 'RATE_LIMIT_EXCEEDED',
            rateLimitInfo: error.rateLimitInfo,
            fallback: {
              totalCount: 0,
              details: [],
              nodes: [],
            }
          },
          { 
            status: 429,
            headers: {
              'X-Rate-Limit-Warning': 'GitHub API rate limit reached',
              'Retry-After': '60',
            }
          }
        )
      }

      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'API calls per hour limit reached. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            rateLimitInfo: error.rateLimitInfo,
            fallback: {
              totalCount: 0,
              details: [],
              nodes: [],
            }
          },
          { 
            status: 429,
            headers: {
              'X-Rate-Limit-Warning': 'GitHub API rate limit reached',
              'Retry-After': '3600',
            }
          }
        )
      }

      if (error.code === 'NOT_FOUND') {
        return NextResponse.json(
          {
            error: 'Issue not found',
            message: 'The specified issue does not exist or is not accessible.',
            code: 'ISSUE_NOT_FOUND',
            fallback: {
              totalCount: 0,
              details: [],
              nodes: [],
            }
          },
          { status: 404 }
        )
      }

      // 其他 GitHub 服务错误
      return NextResponse.json(
        {
          error: 'GitHub API error',
          message: error.message,
          code: error.code,
          fallback: {
            totalCount: 0,
            details: [],
            nodes: [],
          }
        },
        { status: error.status || 500 }
      )
    }

    // 未知错误
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch reactions data',
        fallback: {
          totalCount: 0,
          details: [],
          nodes: [],
        }
      },
      { status: 500 }
    )
  }
}