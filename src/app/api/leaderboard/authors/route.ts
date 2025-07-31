import { NextRequest, NextResponse } from 'next/server'
import { getAllKfcItems } from '@/lib/server-utils'
import { Octokit } from '@octokit/core'
import { getBatchIssueStats } from '@/app/lib/github-stats'
import { IKfcItem } from '@/types'

// 缓存结果，避免频繁请求GitHub API
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存

interface AuthorStats {
  username: string
  avatarUrl: string
  url: string
  totalPosts: number
  totalReactions: number
  totalComments: number
  score: number // 综合评分
  posts: Array<{
    id: string
    title: string
    reactions: number
    comments: number
    createdAt: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'score' // score, reactions, comments, posts
    const limit = parseInt(searchParams.get('limit') || '50')

    // 生成包含参数的缓存key
    const cacheKey = `authors-leaderboard-${sortBy}-${limit}`

    // 检查缓存
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // 检查GitHub Token是否配置
    if (!process.env.GITHUB_TOKEN) {
      console.warn(
        'GitHub token not configured. Author statistics will show basic data only.',
      )
      return NextResponse.json(
        {
          error:
            'GitHub token not configured. Please set GITHUB_TOKEN environment variable.',
          hint: 'Copy env.local.example to .env and add your GitHub token',
        },
        { status: 500 },
      )
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })

    // 获取所有段子数据
    const allItems = await getAllKfcItems()

    // 按作者分组
    const authorMap = new Map<string, AuthorStats>()

    // 初始化作者统计
    for (const item of allItems) {
      const { username, avatarUrl, url } = item.author

      if (!authorMap.has(username)) {
        authorMap.set(username, {
          username,
          avatarUrl,
          url,
          totalPosts: 0,
          totalReactions: 0,
          totalComments: 0,
          score: 0,
          posts: [],
        })
      }

      const author = authorMap.get(username)!
      author.totalPosts++
      author.posts.push({
        id: item.id,
        title: item.title,
        reactions: 0, // 将通过GitHub API获取
        comments: 0, // 将通过GitHub API获取
        createdAt: item.createdAt,
      })
    }

    // 获取GitHub统计数据
    const allIssueIds = allItems.map((item) => item.id)
    const statsMap = await getBatchIssueStats(octokit, allIssueIds)

    // 更新作者统计数据
    for (const [username, author] of authorMap) {
      let totalReactions = 0
      let totalComments = 0

      // 更新每个段子的统计数据
      author.posts = author.posts.map((post) => {
        const stats = statsMap.get(post.id) || {
          id: post.id,
          reactions: 0,
          comments: 0,
        }
        totalReactions += stats.reactions
        totalComments += stats.comments

        return {
          ...post,
          reactions: stats.reactions,
          comments: stats.comments,
        }
      })

      author.totalReactions = totalReactions
      author.totalComments = totalComments

      // 计算综合评分：点赞数 * 1.5 + 评论数 * 2 + 段子数 * 5
      author.score =
        totalReactions * 1.5 + totalComments * 2 + author.totalPosts * 5

      // 按热度排序作者的段子
      author.posts.sort((a, b) => {
        const scoreA = a.reactions * 1.5 + a.comments * 2
        const scoreB = b.reactions * 1.5 + b.comments * 2
        return scoreB - scoreA
      })
    }

    // 转换为数组并排序
    const authorsList = Array.from(authorMap.values())

    // 执行排序
    authorsList.sort((a, b) => {
      switch (sortBy) {
        case 'reactions':
          return b.totalReactions - a.totalReactions
        case 'comments':
          return b.totalComments - a.totalComments
        case 'posts':
          return b.totalPosts - a.totalPosts
        case 'score':
        default:
          return b.score - a.score
      }
    })

    // 限制返回数量
    const topAuthors = authorsList.slice(0, limit)

    // 计算统计数据（基于所有作者，不只是topAuthors）
    const allStats = {
      totalPosts: allItems.length,
      totalReactions: authorsList.reduce(
        (sum, author) => sum + author.totalReactions,
        0,
      ),
      totalComments: authorsList.reduce(
        (sum, author) => sum + author.totalComments,
        0,
      ),
    }

    const result = {
      authors: topAuthors,
      totalAuthors: authorsList.length,
      sortBy,
      limit,
      updatedAt: new Date().toISOString(),
      stats: allStats,
    }

    // 缓存结果（使用包含参数的key）
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching author leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author leaderboard' },
      { status: 500 },
    )
  }
}

// 清理过期缓存
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key)
    }
  }
}, CACHE_DURATION)
