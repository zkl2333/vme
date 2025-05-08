'use client'

import { Layout } from '@/components/Layout'
import { IKfcItem } from './lib/utils'
import { KfcItem } from '@/components/KfcItem'
import { useEffect, useState, useRef, useCallback } from 'react'

export default function Page() {
  const [kfcItems, setKfcItems] = useState<IKfcItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

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

      setHasMore(page < data.totalPages)
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore])

  useEffect(() => {
    loadMoreItems()
  }, [loadMoreItems])

  useEffect(() => {
    if (loadingRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loading && hasMore) {
            loadMoreItems()
          }
        },
        { threshold: 1.0 },
      )

      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMoreItems, loading, hasMore])

  return (
    <Layout>
      {kfcItems.map((kfcItem) => (
        <KfcItem key={kfcItem.id} item={kfcItem}></KfcItem>
      ))}

      <div ref={loadingRef} className="py-4 text-center">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
            <span className="ml-2">加载中...</span>
          </div>
        ) : hasMore ? (
          <span className="text-gray-500">向下滚动加载更多</span>
        ) : (
          <span className="text-gray-500">没有更多内容了</span>
        )}
      </div>
    </Layout>
  )
}
