'use client'

import { Layout } from '@/components/Layout'
import { IKfcItem } from './lib/utils'
import { KfcItem } from '@/components/KfcItem'
import { useEffect, useState, useCallback } from 'react'

export default function Page() {
  const [kfcItems, setKfcItems] = useState<IKfcItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  const loadMoreItems = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/items/page?page=${page}&pageSize=10`)
      const data = await response.json()

      if (page === 1) {
        setKfcItems(data.items)
      } else {
        setKfcItems((prev) => [...prev, ...data.items])
      }

      setTotalPages(data.totalPages)
      setHasMore(page < data.totalPages)
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore])

  // 只在初始加载第一页数据
  useEffect(() => {
    if (page === 1) {
      loadMoreItems()
    }
  }, [loadMoreItems, page])

  return (
    <Layout>
      {kfcItems.map((kfcItem) => (
        <KfcItem key={kfcItem.id} item={kfcItem}></KfcItem>
      ))}

      <div className="mx-auto max-w-7xl px-6 lg:flex lg:px-8">
        <div className="lg:ml-96 lg:flex lg:w-full lg:justify-end lg:pl-32">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
              <span className="ml-2">加载中...</span>
            </div>
          ) : hasMore ? (
            <button
              onClick={loadMoreItems}
              className="my-4 rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
            >
              加载更多 ({page - 1}/{totalPages})
            </button>
          ) : (
            <span className="block py-4 text-gray-500">没有更多内容了</span>
          )}
        </div>
      </div>
    </Layout>
  )
}
