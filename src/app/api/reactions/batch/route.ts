import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, GitHubServiceError } from '@/lib/github-service'

interface BatchReactionsRequest {
  issueIds: string[]
}

interface BatchReactionsResponse {
  data: Record<string, {
    reactions: number
    details: any[]
    nodes: any[]
  }>
  errors: Record<string, string>
  metadata: {
    total: number
    successful: number
    failed: number
    processedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchReactionsRequest = await request.json()
    const { issueIds } = body

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json(
        { error: 'issueIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (issueIds.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 issues can be queried at once' },
        { status: 400 }
      )
    }

    // 使用用户 token 查询 reactions
    const githubService = await GitHubService.createWithUserToken(request)

    const data: Record<string, any> = {}
    const errors: Record<string, string> = {}

    // 批量处理，每批最多10个，避免GraphQL复杂度限制
    const batchSize = 10
    const batches = []
    for (let i = 0; i < issueIds.length; i += batchSize) {
      batches.push(issueIds.slice(i, i + batchSize))
    }

    for (const [batchIndex, batch] of batches.entries()) {
      // 批次间添加延迟，避免触发rate limiting
      if (batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 并发处理当前批次
      const batchPromises = batch.map(async (issueId) => {
        try {
          const stats = await githubService.getIssueStats(issueId)
          data[issueId] = {
            reactions: stats.reactions,
            details: stats.reactionDetails,
            nodes: stats.reactionNodes,
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors[issueId] = errorMessage
          console.warn(`Failed to fetch reactions for issue ${issueId}:`, errorMessage)
        }
      })

      await Promise.allSettled(batchPromises)
    }

    const response: BatchReactionsResponse = {
      data,
      errors,
      metadata: {
        total: issueIds.length,
        successful: Object.keys(data).length,
        failed: Object.keys(errors).length,
        processedAt: new Date().toISOString(),
      }
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })

  } catch (error) {
    console.error('Error in batch reactions API:', error)
    
    // 处理认证错误
    if (error instanceof GitHubServiceError) {
      if (error.code === 'NOT_AUTHENTICATED' || error.code === 'INVALID_TOKEN') {
        return NextResponse.json(
          {
            error: 'Authentication required',
            message: 'Please login to view reactions',
            code: error.code
          },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}