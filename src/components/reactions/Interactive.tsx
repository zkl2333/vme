'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import ReactionsUI from './UI'
import ReactionsLoading from './Loading'
import ReactionsLogin from './Login'

interface InteractiveReactionsProps {
  issueId: string
  initialReactionDetails?: Array<{
    content: string
    users: {
      totalCount: number
    }
  }>
  initialReactionNodes?: any[]
  className?: string
}

// 获取 reactions 数据的 fetcher
const reactionsFetcher = async (url: string) => {
  const res = await fetch(url)

  if (res.ok) {
    const data = await res.json()
    return {
      totalCount: data.totalCount,
      details: data.details || [],
      nodes: data.nodes || [],
      warning: null,
    }
  } else {
    // 处理各种错误情况
    const errorData = await res.json().catch(() => ({}))

    let warning = null
    if (res.status === 429) {
      warning = 'API 调用频率限制，显示缓存数据'
    } else if (res.status === 503) {
      warning = 'GitHub 未配置，显示基础数据'
    }

    return {
      totalCount: 0,
      details: [],
      nodes: [],
      warning,
      ...(errorData.fallback || {}),
    }
  }
}

/**
 * 互动反应容器组件
 * 职责：管理数据获取、状态、用户会话
 */
export default function InteractiveReactions({
  issueId,
  initialReactionDetails = [],
  initialReactionNodes = [],
  className = '',
}: InteractiveReactionsProps) {
  const { data: session, status } = useSession()

  // 检查是否有初始数据（来自批量请求）
  const hasInitialData = initialReactionDetails.length > 0 || initialReactionNodes.length > 0
  
  // 使用 SWR 获取 reactions 数据
  // 策略：
  // 1. 列表页（有批量数据）：使用批量数据，不自动请求
  // 2. 详情页：无批量数据，自动请求
  const shouldAutoFetch = !hasInitialData
  
  const { data: liveData, mutate: refreshReactions } = useSWR(
    // 会话加载中或未登录时，不初始化 SWR
    status === 'loading' || status === 'unauthenticated' ? null : `/api/reactions/${issueId}`,
    reactionsFetcher,
    {
      refreshInterval: 30000, // 30秒自动刷新
      revalidateOnFocus: false,
      revalidateOnMount: shouldAutoFetch, // 只有在不等待批量且无数据时才自动请求
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      keepPreviousData: true,
      // 使用初始数据作为 fallback
      fallbackData: hasInitialData ? {
        totalCount: initialReactionDetails.reduce((sum, r) => sum + r.users.totalCount, 0),
        details: initialReactionDetails,
        nodes: initialReactionNodes,
        warning: null,
      } : undefined,
    },
  )

  // 数据处理逻辑
  const { reactionCounts, userReactionMap, reactionUsers, warning } = useMemo(() => {
    const reactionDetails = liveData?.details || []
    const reactionNodes = liveData?.nodes || []
    
    const counts = new Map<string, number>()
    const userReactionMap = new Map<string, string>()
    const users = new Map<string, string[]>()

    // 从reactionDetails获取计数
    reactionDetails.forEach((reaction: any) => {
      counts.set(reaction.content, reaction.users.totalCount)
    })

    // 从reactionNodes获取用户状态
    if (session?.user?.username) {
      reactionNodes.forEach((reaction: any) => {
        if (reaction.user.login === session.user.username) {
          userReactionMap.set(reaction.content, reaction.id)
        }

        if (!users.has(reaction.content)) {
          users.set(reaction.content, [])
        }
        users.get(reaction.content)!.push(reaction.user.login)
      })
    } else {
      reactionNodes.forEach((reaction: any) => {
        if (!users.has(reaction.content)) {
          users.set(reaction.content, [])
        }
        users.get(reaction.content)!.push(reaction.user.login)
      })
    }

    return { 
      reactionCounts: counts, 
      userReactionMap, 
      reactionUsers: users,
      warning: liveData?.warning || null
    }
  }, [liveData, session?.user?.username])

  // 处理用户交互后的数据刷新
  const handleDataRefresh = () => {
    refreshReactions()
  }

  // 1. 未登录状态
  if (status === 'unauthenticated') {
    return <ReactionsLogin className={className} />
  }

  // 2. 会话加载中
  if (status === 'loading') {
    return <ReactionsLoading className={className} />
  }

  // 3. 已登录 - 渲染UI（数据由SWR + 批量缓存提供）
  return (
    <ReactionsUI
      issueId={issueId}
      reactionCounts={reactionCounts}
      userReactionMap={userReactionMap}
      reactionUsers={reactionUsers}
      onDataRefresh={handleDataRefresh}
      className={className}
      warning={warning}
    />
  )
}

