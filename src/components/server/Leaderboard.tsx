import { Octokit } from '@octokit/core'
import Image from 'next/image'
import Link from 'next/link'
import LeaderboardSortTabs from '../LeaderboardSortTabs'

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

// 设置组件级别的缓存时间（30分钟）
export const revalidate = 1800

export default async function LeaderboardServer({
  sortBy = 'score',
}: LeaderboardServerProps) {
  const data = await getLeaderboardData(sortBy)

  if (!data) {
    return (
      <div className="rounded-lg bg-red-50 p-8 text-center">
        <div className="text-6xl">😅</div>
        <h2 className="mt-4 text-2xl font-bold text-red-600">
          排行榜暂时无法加载
        </h2>
        <p className="mt-2 text-red-500">请稍后再试或检查 GitHub Token 配置</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <i className="fa fa-book text-kfc-red"></i> 梗王排行榜
        </h2>

        {/* 排序选择 */}
        <LeaderboardSortTabs currentSort={data.sortBy} />
      </div>

      <div className="space-y-8 rounded-2xl bg-white p-6 shadow-kfc">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: '总段子数',
              value: data.stats.totalPosts.toLocaleString(),
              icon: '📝',
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
            },
            {
              label: '总点赞数',
              value: data.stats.totalReactions.toLocaleString(),
              icon: '👍',
              color: 'text-red-600',
              bgColor: 'bg-red-50',
            },
            {
              label: '总评论数',
              value: data.stats.totalComments.toLocaleString(),
              icon: '💬',
              color: 'text-green-600',
              bgColor: 'bg-green-50',
            },
            {
              label: '贡献者数',
              value: data.stats.totalAuthors.toLocaleString(),
              icon: '👥',
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`rounded-lg border border-gray-200 ${item.bgColor} p-4 text-center shadow-sm`}
            >
              <div className="text-2xl">{item.icon}</div>
              <div className={`mt-2 text-2xl font-bold ${item.color}`}>
                {item.value}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 特殊展示 */}
        {data.authors.length >= 3 && (
          <div className="mb-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              🥇 殿堂级梗王 🥇
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.authors.slice(0, 3).map((author, index) => {
                const getRankStyle = (rank: number) => {
                  switch (rank) {
                    case 1:
                      return {
                        border: 'border-yellow-200',
                        bg: 'bg-gradient-to-b from-yellow-50 to-white',
                        badgeBg:
                          'bg-gradient-to-r from-yellow-400 to-yellow-500',
                        avatarBorder: 'border-yellow-400',
                        textColor: 'text-yellow-700',
                      }
                    case 2:
                      return {
                        border: 'border-gray-200',
                        bg: 'bg-gradient-to-b from-gray-50 to-white',
                        badgeBg: 'bg-gradient-to-r from-gray-400 to-gray-500',
                        avatarBorder: 'border-gray-400',
                        textColor: 'text-gray-700',
                      }
                    case 3:
                      return {
                        border: 'border-orange-200',
                        bg: 'bg-gradient-to-b from-orange-50 to-white',
                        badgeBg:
                          'bg-gradient-to-r from-orange-400 to-orange-500',
                        avatarBorder: 'border-orange-400',
                        textColor: 'text-orange-700',
                      }
                    default:
                      return {
                        border: 'border-gray-200',
                        bg: 'bg-white',
                        badgeBg: 'bg-gray-400',
                        avatarBorder: 'border-gray-300',
                        textColor: 'text-gray-700',
                      }
                  }
                }

                const style = getRankStyle(index + 1)

                return (
                  <div
                    key={author.username}
                    className={`relative rounded-xl border-2 ${style.border} ${style.bg} p-6 text-center shadow-lg transition-transform hover:scale-105`}
                  >
                    {/* 排名徽章 */}
                    <div
                      className={`absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full ${style.badgeBg} text-sm font-bold text-white shadow-md`}
                    >
                      {index + 1}
                    </div>

                    {/* 头像 */}
                    <div className="mb-4 flex justify-center">
                      <Image
                        src={author.avatarUrl}
                        alt={`${author.username}的头像`}
                        width={80}
                        height={80}
                        className={`h-20 w-20 rounded-full border-4 ${style.avatarBorder} shadow-md`}
                      />
                    </div>

                    {/* 用户信息 */}
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      @{author.username}
                    </h3>

                    <div className="mb-4 space-y-1 text-sm text-gray-600">
                      <div>发布 {author.totalPosts} 个段子</div>
                      <div>
                        获得 {author.totalReactions.toLocaleString()} 个赞
                      </div>
                      <div>收到 {author.totalComments} 条评论</div>
                    </div>

                    {/* 综合评分 */}
                    <div
                      className={`rounded-full px-4 py-2 text-sm font-bold ${style.textColor} bg-opacity-20`}
                      style={{
                        backgroundColor:
                          style.textColor
                            .replace('text-', '')
                            .replace('-700', '') + '20',
                      }}
                    >
                      综合评分: {Math.round(author.score)}
                    </div>

                    {/* GitHub 链接 */}
                    <Link
                      href={author.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <span>GitHub</span>
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </div>
                )
              })}
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
              {data.authors.slice(3, 10).map((author, index) => (
                <div
                  key={author.username}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {/* 排名 */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {index + 4}
                    </div>

                    {/* 头像 */}
                    <Image
                      src={author.avatarUrl}
                      alt={`${author.username}的头像`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />

                    {/* 用户信息 */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        @{author.username}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {author.totalPosts} 个段子 • 评分{' '}
                        {Math.round(author.score)}
                      </div>
                    </div>
                  </div>

                  {/* 统计数据 */}
                  <div className="text-right">
                    <div className="font-semibold text-kfc-red">
                      {author.totalReactions.toLocaleString()} 赞
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

        {/* 更新时间 */}
        <div className="text-center text-sm text-gray-500">
          最后更新: {new Date(data.updatedAt).toLocaleString('zh-CN')}
        </div>
      </div>
    </>
  )
}
