import { Suspense } from 'react'
import { headers } from 'next/headers'
import LeaderboardList from '@/components/leaderboard/List'

// 获取URL参数的类型定义
interface PageProps {
  searchParams: {
    sortBy?: string
  }
}

// 启用ISR - 每30分钟重新生成页面，包含排行榜数据
export const revalidate = 1800 // 30分钟重新验证，用于排行榜数据

export default async function LeaderboardPage({ searchParams }: PageProps) {
  // 从URL参数获取排序方式
  const sortBy = searchParams.sortBy || 'score'

  // 获取headers以构建request对象
  const headersList = await headers()
  const request = new Request('http://localhost', {
    headers: headersList,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">
          V50 英雄榜
        </h1>
        <p className="text-lg text-gray-600">
          看看谁是真正的文案鬼才，谁的文案最能打
        </p>
      </div>

      {/* 梗王排行榜 - 服务端渲染 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
            <span className="ml-2 text-gray-600">正在加载英雄榜...</span>
          </div>
        }
      >
        <LeaderboardList sortBy={sortBy} />
      </Suspense>

      {/* 返回首页 */}
      <div className="mt-12 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-kfc-red px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-kfc-darkRed"
        >
          <i className="fa fa-home"></i>
          返回首页
        </a>
      </div>
    </div>
  )
}
