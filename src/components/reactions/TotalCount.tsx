'use client'

import useSWR from 'swr'

interface TotalReactionsCountProps {
  issueId: string
  fallbackCount?: number
}

// 获取 reactions 总数的 fetcher
const totalCountFetcher = async (url: string) => {
  const res = await fetch(url)
  if (res.ok) {
    const data = await res.json()
    return data.totalCount || 0
  }
  return 0
}

/**
 * 实时显示互动总数组件
 * 使用 SWR 获取最新的互动数据
 */
export default function TotalReactionsCount({
  issueId,
  fallbackCount = 0,
}: TotalReactionsCountProps) {
  const { data: totalCount } = useSWR(
    `/api/reactions/${issueId}`,
    totalCountFetcher,
    {
      refreshInterval: 30000, // 30秒自动刷新
      revalidateOnFocus: false,
      fallbackData: fallbackCount,
      keepPreviousData: true,
    },
  )

  return <span>{totalCount}</span>
}
