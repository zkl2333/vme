import { Octokit } from '@octokit/core'
import Image from 'next/image'
import { IKfcItem } from '@/types'
import LeaderboardSortTabs from '../LeaderboardSortTabs'
import LeaderboardPagination from '../LeaderboardPagination'

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

interface LeaderboardServerProps {
  sortBy?: string
}

async function getLeaderboardData(sortBy: string = 'score') {
  // 检查是否有GitHub Token
  if (!process.env.GITHUB_TOKEN) {
    console.warn(
      'GitHub token not configured. Leaderboard will show basic data only.',
    )
    return null
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })

    // 动态导入服务端工具函数，避免客户端bundle包含fs模块
    const { getAllKfcItems } = await import('@/lib/server-utils')

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

    // 动态导入GitHub统计工具函数
    const { getBatchIssueStats: serverGetBatchIssueStats } = await import(
      '@/app/lib/github-stats'
    )

    // 获取GitHub统计数据
    const allIssueIds = allItems.map((item) => item.id)
    const statsMap = await serverGetBatchIssueStats(octokit, allIssueIds)

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

    authorsList.sort((a, b) => {
      switch (sortBy) {
        case 'reactions':
          return b.totalReactions - a.totalReactions
        case 'comments':
          return b.totalComments - a.totalComments
        case 'posts':
          return b.totalPosts - a.totalPosts
        case 'recent':
          // 按最新发布排序
          const aLatest = Math.max(
            ...a.posts.map((p) => new Date(p.createdAt).getTime()),
          )
          const bLatest = Math.max(
            ...b.posts.map((p) => new Date(p.createdAt).getTime()),
          )
          return bLatest - aLatest
        case 'active':
          // 按活跃度排序（评论数+点赞数）
          return (
            b.totalReactions +
            b.totalComments -
            (a.totalReactions + a.totalComments)
          )
        case 'score':
        default:
          return b.score - a.score
      }
    })

    // 只取前10名
    const topAuthors = authorsList.slice(0, 10)

    // 计算统计数据
    const stats = {
      totalPosts: allItems.length,
      totalReactions: authorsList.reduce(
        (sum, author) => sum + author.totalReactions,
        0,
      ),
      totalComments: authorsList.reduce(
        (sum, author) => sum + author.totalComments,
        0,
      ),
      totalAuthors: authorsList.length,
    }

    return {
      authors: topAuthors,
      stats,
      sortBy,
      totalAuthors: authorsList.length,
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to load leaderboard data:', error)
    return null
  }
}

export default async function LeaderboardServer({
  sortBy = 'score',
}: LeaderboardServerProps) {
  const data = await getLeaderboardData(sortBy)

  if (!data) {
    return (
      <div className="py-8 text-center">
        <div className="text-6xl">😅</div>
        <h3 className="mt-4 text-xl font-bold text-gray-600">
          排行榜暂时无法加载
        </h3>
        <p className="mt-2 text-gray-500">请稍后再试或检查 GitHub Token 配置</p>
      </div>
    )
  }

  // 获取排序标题
  const getSortTitle = (sortBy: string) => {
    switch (sortBy) {
      case 'score':
        return '综合排名榜'
      case 'reactions':
        return '点赞王排行榜'
      case 'posts':
        return '产量王排行榜'
      case 'comments':
        return '互动王排行榜'
      case 'active':
        return '活跃王排行榜'
      case 'recent':
        return '新锐王排行榜'
      default:
        return '综合排名榜'
    }
  }

  // 获取排序描述
  const getSortDescription = (sortBy: string) => {
    switch (sortBy) {
      case 'score':
        return '根据发布数量、点赞和评论综合评分'
      case 'reactions':
        return '获得点赞数最多的用户'
      case 'posts':
        return '发布段子数量最多的用户'
      case 'comments':
        return '获得评论数最多的用户'
      case 'active':
        return '点赞+评论总数最高的用户'
      case 'recent':
        return '最近发布段子的活跃用户'
      default:
        return '根据发布数量、点赞和评论综合评分'
    }
  }

  // 获取统计值显示
  const getStatValue = (author: AuthorStats, sortBy: string) => {
    switch (sortBy) {
      case 'reactions':
        return `${author.totalReactions.toLocaleString()} 赞`
      case 'posts':
        return `${author.totalPosts} 个段子`
      case 'comments':
        return `${author.totalComments} 评论`
      case 'active':
        return `${(author.totalReactions + author.totalComments).toLocaleString()} 互动`
      case 'recent':
        return `${author.totalPosts} 个段子`
      case 'score':
      default:
        return `${author.totalReactions.toLocaleString()} 赞`
    }
  }

  return (
    <>
      {/* 排序选择 */}
      <LeaderboardSortTabs currentSort={data.sortBy} />

      {/* 当前排行榜标题 */}
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-2xl font-bold text-gray-800">
          {getSortTitle(data.sortBy)}
        </h3>
        <p className="text-gray-600">{getSortDescription(data.sortBy)}</p>
      </div>

      {/* Top 3 特殊展示 */}
      {data.authors.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.authors.slice(0, 3).map((author, index) => {
            const badgeColors = [
              'bg-kfc-yellow',
              'bg-gray-400',
              'bg-orange-600',
            ]
            const borderColors = [
              'border-kfc-yellow',
              'border-gray-200',
              'border-orange-300',
            ]
            const bgColors = [
              'from-yellow-50',
              'from-gray-50',
              'from-orange-50',
            ]
            const statColors = [
              'bg-yellow-100 text-yellow-800',
              'bg-gray-100 text-gray-700',
              'bg-orange-100 text-orange-700',
            ]

            return (
              <div
                key={author.username}
                className={`flex flex-col items-center bg-gradient-to-b p-4 ${bgColors[index]} rounded-xl border to-white ${borderColors[index]}`}
              >
                <div
                  className={`h-12 w-12 rounded-full ${badgeColors[index]} mb-3 flex items-center justify-center font-bold text-white`}
                >
                  {index + 1}
                </div>
                <Image
                  src={author.avatarUrl}
                  alt={`${author.username}的头像`}
                  width={80}
                  height={80}
                  className={`h-16 w-16 rounded-full border-2 ${borderColors[index]} mb-3`}
                />
                <h3 className="mb-1 font-bold">@{author.username}</h3>
                <p className="mb-2 text-sm text-gray-500">
                  发布 {author.totalPosts} 个段子
                </p>
                <div
                  className={`${statColors[index]} rounded-full px-3 py-1 text-xs`}
                >
                  {getStatValue(author, data.sortBy)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4-10名列表 */}
      {data.authors.length > 3 && (
        <div className="mb-8">
          <h4 className="mb-4 text-lg font-semibold text-gray-800">
            完整排行榜
          </h4>
          <div className="space-y-3">
            {data.authors.slice(3, 10).map((author, index) => (
              <div
                key={author.username}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                    {index + 4}
                  </div>
                  <Image
                    src={author.avatarUrl}
                    alt={`${author.username}的头像`}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">@{author.username}</div>
                    <div className="text-sm text-gray-500">
                      {author.totalPosts} 个段子
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-kfc-red">
                    {getStatValue(author, data.sortBy)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {author.totalComments} 评论
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 统计概览 */}
      <div className="mt-8 rounded-lg bg-gray-50 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-kfc-red">
              {data.stats.totalPosts}
            </div>
            <div className="text-sm text-gray-600">总段子数</div>
          </div>
          <div>
            <div className="text-xl font-bold text-kfc-red">
              {data.stats.totalReactions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">总点赞数</div>
          </div>
          <div>
            <div className="text-xl font-bold text-kfc-red">
              {data.stats.totalComments.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">总评论数</div>
          </div>
        </div>
      </div>

      {/* 更新时间 */}
      <div className="mt-4 text-center text-xs text-gray-400">
        最后更新: {new Date(data.updatedAt).toLocaleString('zh-CN')}
      </div>
    </>
  )
}
