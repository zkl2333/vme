import useSWR from 'swr'

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
      revalidateOnMount: false, // 不自动加载，由组件决定何时加载
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

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