/**
 * 本地数据库演示页面
 * 展示前端本地数据库 + 增量同步的功能
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import LocalJokesList, { LocalDatabaseStats } from '@/components/client/LocalJokesList'

export const metadata: Metadata = {
  title: '本地数据库演示 - KFC疯狂星期四',
  description: '展示前端本地数据库 + 增量同步的高性能分页功能',
}

export default function LocalDatabaseDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 本地数据库演示
              </h1>
              <p className="text-gray-600 mt-1">
                前端 IndexedDB + 增量同步 = 极致性能体验
              </p>
            </div>

            {/* 统计信息 */}
            <div className="hidden md:block">
              <Suspense fallback={<div>加载统计...</div>}>
                <LocalDatabaseStats />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* 特性介绍 */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">✨ 核心特性</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 font-semibold mb-2">⚡ 极速分页</div>
              <div className="text-gray-600">本地数据库毫秒级响应，无需等待网络请求</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold mb-2">🔄 智能同步</div>
              <div className="text-gray-600">增量同步机制，只获取新数据，节省带宽</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 font-semibold mb-2">📱 离线能力</div>
              <div className="text-gray-600">已同步数据支持完全离线浏览</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-orange-600 font-semibold mb-2">🔍 本地搜索</div>
              <div className="text-gray-600">全文搜索功能，瞬间找到想要的内容</div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📖 使用说明</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">首次使用</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>页面加载时自动初始化本地数据库</li>
                <li>如果本地无数据，会自动进行首次同步</li>
                <li>同步完成后即可享受极速浏览体验</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">日常使用</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>点击&quot;检查更新&quot;查看是否有新内容</li>
                <li>有更新时会显示提示，点击&quot;同步&quot;获取</li>
                <li>支持按仓库过滤、搜索、随机浏览等功能</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 性能对比 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 性能对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">指标</th>
                  <th className="text-left py-2">传统服务端分页</th>
                  <th className="text-left py-2">本地数据库分页</th>
                  <th className="text-left py-2">提升</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2">分页响应时间</td>
                  <td>200-1000ms</td>
                  <td>&lt;10ms</td>
                  <td className="text-green-600 font-semibold">20-100倍</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">搜索响应时间</td>
                  <td>300-2000ms</td>
                  <td>&lt;50ms</td>
                  <td className="text-green-600 font-semibold">6-40倍</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">离线可用性</td>
                  <td>❌ 不支持</td>
                  <td>✅ 完全支持</td>
                  <td className="text-green-600 font-semibold">质的飞跃</td>
                </tr>
                <tr>
                  <td className="py-2">服务器压力</td>
                  <td>每次分页都请求</td>
                  <td>只需增量同步</td>
                  <td className="text-green-600 font-semibold">减少90%+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 主要内容区域 */}
      <main>
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              <span className="text-lg">正在初始化本地数据库...</span>
            </div>
          </div>
        }>
          <LocalJokesList
            initialPage={1}
            initialPageSize={20}
            enableAutoSync={true}
            className="pb-12"
          />
        </Suspense>
      </main>

      {/* 页脚说明 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <div className="mb-4">
            <span className="font-semibold">技术栈：</span>
            Next.js 14 + React + TypeScript + Dexie (IndexedDB) + Tailwind CSS
          </div>
          <div>
            <span className="font-semibold">特别说明：</span>
            本演示页面展示的是纯前端本地数据库方案，所有分页、搜索、过滤操作都在浏览器本地完成，
            无需服务器参与，因此响应速度极快。数据通过增量同步 API 与服务器保持一致。
          </div>
        </div>
      </footer>
    </div>
  )
}