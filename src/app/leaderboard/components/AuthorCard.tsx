import Image from 'next/image'
import Link from 'next/link'

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

interface AuthorCardProps {
  author: AuthorStats
  rank: number
  variant: 'podium' | 'list'
}

export default function AuthorCard({ author, rank, variant }: AuthorCardProps) {
  if (variant === 'podium') {
    const getRankStyle = (rank: number) => {
      switch (rank) {
        case 1:
          return {
            border: 'border-yellow-200',
            bg: 'bg-gradient-to-b from-yellow-50 to-white',
            badgeBg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
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
            badgeBg: 'bg-gradient-to-r from-orange-400 to-orange-500',
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

    const style = getRankStyle(rank)

    return (
      <div className={`relative rounded-xl border-2 ${style.border} ${style.bg} p-6 text-center shadow-lg transition-transform hover:scale-105`}>
        {/* 排名徽章 */}
        <div className={`absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full ${style.badgeBg} text-sm font-bold text-white shadow-md`}>
          {rank}
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
          <div>获得 {author.totalReactions.toLocaleString()} 个赞</div>
          <div>收到 {author.totalComments} 条评论</div>
        </div>

        {/* 综合评分 */}
        <div className={`rounded-full px-4 py-2 text-sm font-bold ${style.textColor} bg-opacity-20`} style={{ backgroundColor: style.textColor.replace('text-', '').replace('-700', '') + '20' }}>
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
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    )
  }

  // List variant
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        {/* 排名 */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
          {rank}
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
          <h3 className="font-semibold text-gray-900">@{author.username}</h3>
          <div className="text-sm text-gray-500">
            {author.totalPosts} 个段子 • 评分 {Math.round(author.score)}
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
  )
}