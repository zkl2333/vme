import Image from 'next/image'
import Link from 'next/link'
import SortTabs from './SortTabs'

interface AuthorStats {
  username: string
  avatarUrl: string
  url: string
  totalPosts: number
  totalInteractions: number
  score: number
  posts: Array<{
    id: string
    title: string
    interactions: number
    createdAt: string
  }>
}

interface LeaderboardServerProps {
  sortBy?: string
}

async function getLeaderboardData(sortBy: string = 'score') {
  try {
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
          totalInteractions: 0,
          score: 0,
          posts: [],
        })
      }

      const author = authorMap.get(username)!
      author.totalPosts++
      // 使用静态reactions数据
      author.posts.push({
        id: item.id,
        title: item.title,
        interactions: item.reactions?.totalCount || 0,
        createdAt: item.createdAt,
      })
    }

    // 计算作者总互动数据
    for (const [username, author] of authorMap) {
      let totalInteractions = 0

      // 计算总互动数
      author.posts.forEach((post) => {
        totalInteractions += post.interactions
      })

      author.totalInteractions = totalInteractions

      // 计算综合评分：互动数 * 1.5 + 段子数 * 5
      author.score = totalInteractions * 1.5 + author.totalPosts * 5

      // 按热度排序作者的段子
      author.posts.sort((a, b) => {
        const scoreA = a.interactions
        const scoreB = b.interactions
        return scoreB - scoreA
      })
    }

    // 转换为数组并排序
    const authorsList = Array.from(authorMap.values())

    authorsList.sort((a, b) => {
      switch (sortBy) {
        case 'interactions':
          return b.totalInteractions - a.totalInteractions
        case 'posts':
          return b.totalPosts - a.totalPosts
        case 'score':
        default:
          return b.score - a.score
      }
    })

    // 只取前10名
    const topAuthors = authorsList.slice(0, 10)

    return {
      authors: topAuthors,
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
        <p className="mt-2 text-red-500">请稍后再试</p>
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
        <SortTabs currentSort={data.sortBy} />
      </div>

      <div className="space-y-6 rounded-2xl bg-white p-4 shadow-kfc md:space-y-8 md:p-6">
        {/* Top 3 特殊展示 */}
        {data.authors.length >= 3 && (
          <div className="mb-6 md:mb-8">
            <h2 className="mb-4 text-center text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">
              🥇 殿堂级梗王 🥇
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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
                    className={`relative rounded-xl border-2 ${style.border} ${style.bg} p-4 pt-6 text-center shadow-lg transition-transform hover:scale-105 md:p-6`}
                  >
                    {/* 排名徽章 - 优化位置避免被裁剪 */}
                    <div
                      className={`absolute -top-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full ${style.badgeBg} text-xs font-bold text-white shadow-md md:-top-3 md:h-8 md:w-8 md:text-sm`}
                    >
                      {index + 1}
                    </div>

                    {/* 头像 */}
                    <div className="mb-3 flex justify-center md:mb-4">
                      <Image
                        src={author.avatarUrl}
                        alt={`${author.username}的头像`}
                        width={80}
                        height={80}
                        className={`h-16 w-16 rounded-full border-2 ${style.avatarBorder} shadow-md md:h-20 md:w-20 md:border-4`}
                      />
                    </div>

                    {/* 用户信息 */}
                    <h3 className="mb-2 text-base font-bold text-gray-900 md:text-lg">
                      @{author.username}
                    </h3>

                    <div className="mb-3 space-y-1 text-xs text-gray-600 md:mb-4 md:text-sm">
                      <div>发布 {author.totalPosts} 个段子</div>
                      <div>
                        获得 {author.totalInteractions.toLocaleString()} 次互动
                      </div>
                    </div>

                    {/* 综合评分 */}
                    <div
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${style.textColor} bg-opacity-20 md:px-4 md:py-2 md:text-sm`}
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
                      className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 md:mt-4"
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

        {/* 完整排行榜 - 优化移动端布局 */}
        {data.authors.length > 3 && (
          <div>
            <h2 className="mb-4 text-center text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">
              📊 完整排行榜
            </h2>
            <div className="space-y-3 md:space-y-4">
              {data.authors.slice(3, 10).map((author, index) => (
                <div
                  key={author.username}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center md:justify-between md:p-4"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* 排名 */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {index + 4}
                    </div>

                    {/* 头像 */}
                    <Image
                      src={author.avatarUrl}
                      alt={`${author.username}的头像`}
                      width={48}
                      height={48}
                      className="h-10 w-10 flex-shrink-0 rounded-full md:h-12 md:w-12"
                    />

                    {/* 用户信息 */}
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                        @{author.username}
                      </h3>
                      <div className="text-xs text-gray-500 md:text-sm">
                        {author.totalPosts} 个段子 • 评分{' '}
                        {Math.round(author.score)}
                      </div>
                    </div>
                  </div>

                  {/* 统计数据 */}
                  <div className="text-left md:text-right">
                    <div className="text-sm font-semibold text-kfc-red md:text-base">
                      {author.totalInteractions.toLocaleString()} 次互动
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
