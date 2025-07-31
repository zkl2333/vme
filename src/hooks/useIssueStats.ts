import { useState, useEffect, useCallback } from 'react'

interface IssueStats {
  id: string
  reactions: number
  comments: number
}

interface UseIssueStatsReturn {
  stats: Map<string, IssueStats>
  loading: boolean
  error: string | null
  fetchStats: (issueIds: string[]) => Promise<void>
}

export function useIssueStats(): UseIssueStatsReturn {
  const [stats, setStats] = useState<Map<string, IssueStats>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(
    async (issueIds: string[]) => {
      if (issueIds.length === 0) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ issueIds }),
        })

        if (!response.ok) {
          const errorData = await response.json()

          // 如果是GitHub Token配置问题，静默处理，不显示错误
          if (
            response.status === 500 &&
            errorData.error?.includes('GitHub token')
          ) {
            console.warn(
              'GitHub token not configured. Issue statistics will show as 0.',
            )
            return
          }

          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.stats && Array.isArray(data.stats)) {
          const newStats = new Map(stats)
          data.stats.forEach((stat: IssueStats) => {
            newStats.set(stat.id, stat)
          })
          setStats(newStats)
        }
      } catch (err) {
        console.error('Failed to fetch issue stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    },
    [stats],
  )

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}
