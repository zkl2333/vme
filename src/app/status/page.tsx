import { Suspense } from 'react'
import StatusDashboard from '@/components/status/Dashboard'

export default function StatusPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">
          系统状态监控
        </h1>
        <p className="text-lg text-gray-600">
          GitHub API 限流状态、环境配置和系统健康度检查
        </p>
      </div>

      {/* 状态仪表板 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
            <span className="ml-2 text-gray-600">检查系统状态中...</span>
          </div>
        }
      >
        <StatusDashboard />
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