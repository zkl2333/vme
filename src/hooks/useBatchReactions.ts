import useSWR, { mutate as globalMutate } from 'swr'
import { useEffect } from 'react'

interface BatchReactionsResponse {
  data: Record<string, {
    reactions: number
    details: any[]
    nodes: any[]
  }>
  errors: Record<string, string>
  metadata: {
    total: number
    successful: number
    failed: number
    processedAt: string
  }
}

const fetcher = async (url: string, issueIds: string[]): Promise<BatchReactionsResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ issueIds }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function useBatchReactions(issueIds: string[]) {
  const shouldFetch = issueIds.length > 0
  
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? ['batch-reactions', issueIds] : null,
    ([_, ids]) => fetcher('/api/reactions/batch', ids),
    {
      dedupingInterval: 30000, // 30秒去重，避免重复请求
      revalidateOnFocus: false,
      revalidateOnMount: true, // 自动加载数据
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  // 当批量数据加载完成后，填充到各个单独的 SWR 缓存中
  // 这样 InteractiveReactions 就能直接从缓存读取，不会发起重复请求
  useEffect(() => {
    if (data?.data) {
      Object.entries(data.data).forEach(([issueId, reactionData]) => {
        // 填充单个 issue 的缓存
        globalMutate(
          `/api/reactions/${issueId}`,
          {
            totalCount: reactionData.reactions,
            details: reactionData.details,
            nodes: reactionData.nodes,
            warning: null,
          },
          false // 不触发重新验证
        )
      })
    }
  }, [data])

  // 获取单个Issue的反应数据
  const getReactionData = (issueId: string) => {
    return data?.data?.[issueId] || null
  }

  // 检查单个Issue是否有错误
  const getError = (issueId: string) => {
    return data?.errors?.[issueId] || null
  }

  // 手动触发数据刷新
  const refresh = () => {
    return mutate()
  }

  return {
    data: data?.data || {},
    errors: data?.errors || {},
    metadata: data?.metadata,
    isLoading,
    error,
    getReactionData,
    getError,
    refresh,
    hasData: !!data,
  }
}

// 单个Issue的反应数据Hook（基于批量Hook的简化版本）
export function useIssueReactions(issueId: string) {
  const { getReactionData, getError, isLoading, hasData, refresh } = useBatchReactions([issueId])
  
  return {
    data: getReactionData(issueId),
    error: getError(issueId),
    isLoading,
    hasData,
    refresh,
  }
}