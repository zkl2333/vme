import { useState, useCallback } from 'react'
import { ReactionNode } from '@/types'

interface ReactionGroup {
  content: string
  users: {
    totalCount: number
  }
}

interface ReactionData {
  reactionDetails: ReactionGroup[]
  reactionNodes: ReactionNode[]
}

export function useReactionData(issueId: string, initialData: ReactionData) {
  const [data, setData] = useState<ReactionData>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      // 通过API获取最新的统计数据
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueIds: [issueId],
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        const stats = responseData.stats?.[0]
        
        if (stats) {
          // 更新本地数据
          setData({
            reactionDetails: stats.reactionDetails || [],
            reactionNodes: stats.reactionNodes || [],
          })
        }
      }
    } catch (error) {
      console.error('刷新reaction数据失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [issueId, isRefreshing])

  return {
    data,
    isRefreshing,
    refreshData,
  }
}
