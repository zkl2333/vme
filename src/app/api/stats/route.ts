import { NextRequest, NextResponse } from 'next/server'
import { getIssueStats } from '@/app/lib/github-stats'
import { getOctokitInstance } from '@/lib/server-utils'

interface IssueStats {
  id: string
  reactions: number
  reactionDetails: any[]
  reactionNodes: any[]
}

export async function POST(request: NextRequest) {
  try {
    const { issueIds } = await request.json()

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json({ error: 'Invalid issue IDs' }, { status: 400 })
    }

    // 检查GitHub Token是否配置
    if (!process.env.GITHUB_TOKEN) {
      console.warn('GitHub token not configured. Statistics will show as 0.')
      return NextResponse.json(
        {
          error:
            'GitHub token not configured. Please set GITHUB_TOKEN environment variable.',
          hint: 'Copy env.local.example to .env and add your GitHub token',
        },
        { status: 500 },
      )
    }

    // 优先使用用户权限
    const octokit = await getOctokitInstance(request)

    const results: IssueStats[] = []

    for (const issueId of issueIds) {
      try {
        // 使用封装的函数获取Issue统计数据
        const stats = await getIssueStats(octokit, issueId)
        results.push(stats)
      } catch (error) {
        console.error(`Failed to fetch stats for issue ${issueId}:`, error)
        // 如果单个请求失败，返回默认值
        results.push({
          id: issueId,
          reactions: 0,
          reactionDetails: [],
          reactionNodes: [],
        })
      }
    }

    return NextResponse.json({ stats: results })
  } catch (error) {
    console.error('Error fetching issue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issue statistics' },
      { status: 500 },
    )
  }
}
