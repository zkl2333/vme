import { Suspense } from 'react'
import { Metadata } from 'next'
import LeaderboardContent from './components/LeaderboardContent'
import LeaderboardSkeleton from './components/LeaderboardSkeleton'

// 页面元数据
export const metadata: Metadata = {
  title: '梗王排行榜 | 肯德基疯狂星期四段子收集站',
  description:
    '查看最受欢迎的段子创作者排行榜，按点赞数、评论数、段子数等维度排序',
  keywords: '排行榜,梗王,作者排行,疯狂星期四,肯德基段子',
}

// 启用 ISR - 每30分钟重新生成页面
export const revalidate = 1800 // 30分钟

interface PageProps {
  searchParams: {
    sortBy?: string
    limit?: string
  }
}

export default function LeaderboardPage({ searchParams }: PageProps) {
  const sortBy = searchParams.sortBy || 'score'
  const limit = parseInt(searchParams.limit || '20')

  return (
    <div className="min-h-screen bg-gradient-to-br from-kfc-red/5 to-kfc-yellow/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            🏆 梗王排行榜
          </h1>
          <p className="text-lg text-gray-600">
            发现最受欢迎的段子创作者，见证疯狂星期四的传奇
          </p>
        </div>

        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardContent sortBy={sortBy} limit={limit} />
        </Suspense>
      </div>
    </div>
  )
}
