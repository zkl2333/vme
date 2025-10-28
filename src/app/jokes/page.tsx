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
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">
          疯狂星期四段子库
        </h1>
        <p className="text-lg text-gray-600">
          精选最搞笑的疯狂星期四段子，让你笑到停不下来
        </p>
      </div>

      {/* 段子列表 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
            <span className="ml-2 text-gray-600">加载段子中...</span>
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
