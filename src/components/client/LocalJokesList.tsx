/**
 * 本地数据库分页组件
 * 使用 useLocalKfcData Hook 实现高性能本地分页
 */

'use client'

import { useState, useCallback } from 'react'
import { useLocalKfcData } from '@/hooks/useLocalKfcData'
import { LocalKfcItem } from '@/lib/local-db'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface LocalJokesListProps {
  initialPage?: number
  initialPageSize?: number
  enableAutoSync?: boolean
  className?: string
}

export default function LocalJokesList({
  initialPage = 1,
  initialPageSize = 20,
  enableAutoSync = false,
  className = ''
}: LocalJokesListProps) {

  // 本地状态
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showSyncModal, setShowSyncModal] = useState(false)

  // 使用本地数据库 Hook
  const {
    items,
    pagination,
    isLoading,
    syncStatus,
    hasUpdates,
    error,
    loadPage,
    checkUpdates,
    syncData,
    search,
    getRandomItem,
    resetDatabase,
    getStats
  } = useLocalKfcData({
    autoInit: true,
    enableAutoSync,
    initialPage: currentPage,
    initialPageSize: pageSize,
    onSyncUpdate: (result) => {
      console.log('🔔 发现更新:', result)
      // 可以在这里显示通知
    },
    onError: (error) => {
      console.error('❌ 数据库错误:', error)
    }
  })

  // 加载指定页面
  const handleLoadPage = useCallback(async (page: number) => {
    setCurrentPage(page)
    await loadPage({
      page,
      pageSize,
      repoKey: selectedRepo || undefined,
      searchKeyword: searchKeyword || undefined
    })
  }, [loadPage, pageSize, selectedRepo, searchKeyword])

  // 更改页面大小
  const handlePageSizeChange = useCallback(async (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // 重置到第一页
    await loadPage({
      page: 1,
      pageSize: newPageSize,
      repoKey: selectedRepo || undefined,
      searchKeyword: searchKeyword || undefined
    })
  }, [loadPage, selectedRepo, searchKeyword])

  // 仓库过滤
  const handleRepoChange = useCallback(async (repo: string) => {
    setSelectedRepo(repo)
    setCurrentPage(1)
    await loadPage({
      page: 1,
      pageSize,
      repoKey: repo || undefined,
      searchKeyword: searchKeyword || undefined
    })
  }, [loadPage, pageSize, searchKeyword])

  // 搜索
  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword)
    setCurrentPage(1)
    await loadPage({
      page: 1,
      pageSize,
      repoKey: selectedRepo || undefined,
      searchKeyword: keyword || undefined
    })
  }, [loadPage, pageSize, selectedRepo])

  // 手动检查更新
  const handleCheckUpdates = useCallback(async () => {
    await checkUpdates()
  }, [checkUpdates])

  // 手动同步
  const handleSync = useCallback(async () => {
    setShowSyncModal(true)
    try {
      await syncData()
    } finally {
      setShowSyncModal(false)
    }
  }, [syncData])

  // 随机段子
  const handleRandomJoke = useCallback(async () => {
    const randomItem = await getRandomItem(selectedRepo || undefined)
    if (randomItem) {
      // 这里可以显示随机段子的模态框或跳转
      console.log('🎲 随机段子:', randomItem)
    }
  }, [getRandomItem, selectedRepo])

  // 格式化时间
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN
      })
    } catch {
      return dateString
    }
  }

  // 渲染单个段子项
  const renderJokeItem = (item: LocalKfcItem) => (
    <div key={item.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {item.title}
      </h3>

      {/* 内容 */}
      <div className="text-gray-600 mb-4 whitespace-pre-wrap line-clamp-3">
        {item.body}
      </div>

      {/* 元信息 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {/* 作者 */}
          <div className="flex items-center space-x-2">
            <img
              src={item.authorAvatarUrl}
              alt={item.authorUsername}
              className="w-5 h-5 rounded-full"
            />
            <span>{item.authorUsername}</span>
          </div>

          {/* 仓库 */}
          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
            {item.repoKey}
          </span>

          {/* 时间 */}
          <span>{formatTime(item.createdAt)}</span>
        </div>

        {/* 同步状态 */}
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${
            item.syncStatus === 'synced' ? 'bg-green-400' : 'bg-yellow-400'
          }`}></span>
          <span className="text-xs">{
            item.syncStatus === 'synced' ? '已同步' : '待同步'
          }</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* 头部控制区 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col space-y-4">
          {/* 第一行：搜索和同步 */}
          <div className="flex items-center space-x-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索段子..."
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* 同步控制 */}
            <div className="flex items-center space-x-2">
              {hasUpdates && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  有更新
                </span>
              )}

              <button
                onClick={handleCheckUpdates}
                disabled={syncStatus !== 'idle'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {syncStatus === 'checking' ? '检查中...' : '检查更新'}
              </button>

              <button
                onClick={handleSync}
                disabled={syncStatus !== 'idle'}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {syncStatus === 'syncing' ? '同步中...' : '同步'}
              </button>
            </div>
          </div>

          {/* 第二行：过滤和控制 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 仓库选择 */}
              <select
                value={selectedRepo}
                onChange={(e) => handleRepoChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">所有仓库</option>
                <option value="zkl2333/vme">zkl2333/vme</option>
                <option value="whitescent/KFC-Crazy-Thursday">whitescent/KFC-Crazy-Thursday</option>
              </select>

              {/* 页面大小 */}
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
                <option value={100}>100条/页</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRandomJoke}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                🎲 随机段子
              </button>

              <button
                onClick={resetDatabase}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                🗑️ 重置数据库
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>错误：</strong> {error}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            <span>加载中...</span>
          </div>
        </div>
      )}

      {/* 段子列表 */}
      {!isLoading && items.length > 0 && (
        <div>
          {items.map(renderJokeItem)}
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p>没有找到段子数据</p>
          <p className="text-sm mt-2">
            {searchKeyword ? '尝试修改搜索关键词' : '点击"同步"按钮获取最新数据'}
          </p>
        </div>
      )}

      {/* 分页控制 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
          <div className="flex items-center justify-between">
            {/* 分页信息 */}
            <div className="text-sm text-gray-600">
              显示第 {pagination.startIndex} - {pagination.endIndex} 条，
              共 {pagination.totalCount} 条数据
            </div>

            {/* 分页按钮 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleLoadPage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>

              <span className="px-4 py-2 bg-red-500 text-white rounded-lg">
                {currentPage} / {pagination.totalPages}
              </span>

              <button
                onClick={() => handleLoadPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 同步模态框 */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">正在同步数据...</h3>
              <p className="text-gray-600">请稍等，正在从服务器获取最新数据</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 性能统计组件
export function LocalDatabaseStats() {
  const { getStats } = useLocalKfcData({ autoInit: false })
  const [stats, setStats] = useState<any>(null)

  const loadStats = async () => {
    const result = await getStats()
    setStats(result)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">数据库统计</h3>
        <button
          onClick={loadStats}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          刷新
        </button>
      </div>

      {stats && (
        <div className="space-y-2 text-sm">
          <div>总数据量: {stats.local?.totalItems || 0}</div>
          <div>仓库数量: {Object.keys(stats.local?.repoStats || {}).length}</div>
          <div>最后更新: {stats.local?.lastUpdated ? new Date(stats.local.lastUpdated).toLocaleString() : '未知'}</div>
          <div>同步状态: {stats.sync?.isInProgress ? '进行中' : '空闲'}</div>
        </div>
      )}
    </div>
  )
}