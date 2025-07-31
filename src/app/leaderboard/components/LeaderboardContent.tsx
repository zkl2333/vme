import { Octokit } from '@octokit/core'
import { getAllKfcItems } from '@/app/lib/utils'
import { getBatchIssueStats } from '@/app/lib/github-stats'
import AuthorCard from './AuthorCard'
import SortButtons from './SortButtons'
import StatsOverview from './StatsOverview'

interface AuthorStats {
  username: string
  avatarUrl: string
  url: string
  totalPosts: number
  totalReactions: number
  totalComments: number
  score: number
  posts: Array<{
    id: string
    title: string
    reactions: number
    comments: number
    createdAt: string
  }>
}

interface LeaderboardContentProps {
  sortBy: string
  limit: number
}

async function getLeaderboardData(sortBy: string, limit: number) {
  // 检查是否有GitHub Token
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GitHub token not configured')
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
      reactions: 0,
      comments: 0,
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
    author.score = totalReactions * 1.5 + totalComments * 2 + author.totalPosts * 5

    // 按热度排序作者的段子
    author.posts.sort((a, b) => {
      const scoreA = a.reactions * 1.5 + a.comments * 2
      const scoreB = b.reactions * 1.5 + b.comments * 2
      return scoreB - scoreA
    })
  }

  // 转换为数组并排序
  const authorsList = Array.from(authorMap.values())

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

  // 计算统计数据
  const stats = {
    totalPosts: allItems.length,
    totalReactions: authorsList.reduce((sum, author) => sum + author.totalReactions, 0),
    totalComments: authorsList.reduce((sum, author) => sum + author.totalComments, 0),
    totalAuthors: authorsList.length,
  }

  return {
    authors: topAuthors,
    stats,
    sortBy,
    limit,
    updatedAt: new Date().toISOString(),
  }
}

export default async function LeaderboardContent({ sortBy, limit }: LeaderboardContentProps) {
  try {
    const data = await getLeaderboardData(sortBy, limit)

    return (
      <div className="space-y-8">
        {/* 排序控制 */}
        <SortButtons currentSort={sortBy} />

        {/* 统计概览 */}
        <StatsOverview stats={data.stats} />

        {/* Top 3 特殊展示 */}
        {data.authors.length >= 3 && (
          <div className="mb-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              🥇 殿堂级梗王 🥇
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.authors.slice(0, 3).map((author, index) => (
                <AuthorCard
                  key={author.username}
                  author={author}
                  rank={index + 1}
                  variant="podium"
                />
              ))}
            </div>
          </div>
        )}

        {/* 完整排行榜 */}
        {data.authors.length > 3 && (
          <div>
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              📊 完整排行榜
            </h2>
            <div className="space-y-4">
              {data.authors.slice(3).map((author, index) => (
                <AuthorCard
                  key={author.username}
                  author={author}
                  rank={index + 4}
                  variant="list"
                />
              ))}
            </div>
          </div>
        )}

        {/* 更新时间 */}
        <div className="text-center text-sm text-gray-500">
          最后更新: {new Date(data.updatedAt).toLocaleString('zh-CN')}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
    
    return (
      <div className="rounded-lg bg-red-50 p-8 text-center">
        <div className="text-6xl">😅</div>
        <h2 className="mt-4 text-2xl font-bold text-red-600">排行榜暂时无法加载</h2>
        <p className="mt-2 text-red-500">
          {error instanceof Error ? error.message : '请稍后再试'}
        </p>
      </div>
    )
  }
}