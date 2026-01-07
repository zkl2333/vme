import { Suspense } from 'react'
import JokesList from '@/components/jokes/List'

// 获取URL参数的类型定义
interface PageProps {
  searchParams: {
    page?: string
  }
}

export default async function JokesPage({ searchParams }: PageProps) {
  // 从URL参数获取页码
  const page = parseInt(searchParams.page || '1')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 text-center md:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl">
          疯四文案仓库
        </h1>
        <p className="mx-auto max-w-2xl text-base text-gray-600 md:text-lg">
          历年疯四文案大赏，总有一条能骗到v50
        </p>
      </div>

      {/* 段子列表 */}
      <Suspense
        fallback={
        <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-kfc">
          <div className="flex items-center text-kfc-red">
            <i className="fa fa-spinner fa-spin mr-3 text-2xl"></i>
            <span className="ml-2 text-gray-600">正在加载文案...</span>
          </div>
        </div>
        }
      >
        <JokesList currentPage={page} />
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
