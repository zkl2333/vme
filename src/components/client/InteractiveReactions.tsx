'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import LikeButton from './LikeButton'
import useSWR from 'swr'
import { showLoginDialog } from './LoginConfirmDialogContent'

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
  /** 外部已获取的 warning 信息 */
  externalWarning?: string | null
  /** 是否禁用内部的数据请求（当外部已经获取时） */
  disableInternalFetch?: boolean
}

// 可用的反应类型
const availableReactions = [
  { key: 'THUMBS_UP', emoji: '👍', label: '点赞' },
  { key: 'HEART', emoji: '❤️', label: '爱心' },
  { key: 'LAUGH', emoji: '😄', label: '大笑' },
  { key: 'HOORAY', emoji: '🎉', label: '庆祝' },
  { key: 'ROCKET', emoji: '🚀', label: '火箭' },
  { key: 'EYES', emoji: '👀', label: '眼睛' },
]

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

export default function InteractiveReactions({
  issueId,
  initialReactionDetails = [],
  initialReactionNodes = [],
  className = '',
  externalWarning = null,
  disableInternalFetch = false,
}: InteractiveReactionsProps) {
  const { data: session, status } = useSession()

  // 使用 SWR 获取实时 reactions 数据（仅在已登录时）
  const { data: liveData, mutate: refreshReactions } = useSWR(
    // 未登录或禁用内部获取时，key 为 null，不发起请求
    disableInternalFetch || status === 'unauthenticated'
      ? null
      : `/api/reactions/${issueId}`,
    reactionsFetcher,
    {
      refreshInterval: 30000, // 30秒自动刷新
      revalidateOnFocus: false,
      revalidateOnMount: false, // 不自动加载，懒加载
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    },
  )

  // 优先使用实时数据，降级到初始数据
  const reactionDetails = liveData?.details || initialReactionDetails
  const reactionNodes = liveData?.nodes || initialReactionNodes
  const warning = externalWarning || liveData?.warning || null

  // 数据处理逻辑
  const { reactionCounts, userReactionMap, reactionUsers } = useMemo(() => {
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

    return { reactionCounts: counts, userReactionMap, reactionUsers: users }
  }, [reactionDetails, reactionNodes, session?.user?.username])

  // 处理用户交互后的数据刷新
  const handleDataRefresh = () => {
    refreshReactions()
  }

  // 未登录时显示提示
  if (status === 'unauthenticated') {
    return (
      <div className={`relative flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-400">互动:</span>
        <div className="flex items-center gap-1">
          {availableReactions.map(({ key, emoji }) => (
            <div key={key} className="relative flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 transition-all duration-200">
              <span className="text-base">{emoji}</span>
              <span className="text-xs font-medium text-gray-400 blur-sm select-none">88</span>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            showLoginDialog({
              title: '互动需要登录',
              message: '登录后即可查看和添加表情反应，还能提交自己的创意文案！',
            })
          }
          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded bg-black/0 text-xs text-transparent backdrop-blur-0 transition-all hover:bg-black/60 hover:text-white hover:backdrop-blur-sm"
        >
          登录后可查看和添加表情反应
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {warning && (
        <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-xs text-amber-700">
          {warning}
        </span>
      )}
      <span className="text-xs text-gray-400">互动:</span>
      <div className="flex items-center gap-1">
        {availableReactions.map(({ key, emoji, label }) => {
          const count = reactionCounts.get(key) || 0
          const isUserReacted = userReactionMap.has(key)
          const users = reactionUsers.get(key) || []

          return (
            <LikeButton
              key={key}
              issueId={issueId}
              reaction={key}
              emoji={emoji}
              count={count}
              isUserReacted={isUserReacted}
              onDataRefresh={handleDataRefresh}
              className={`hover:scale-105 ${isUserReacted ? 'ring-1 ring-kfc-red/30' : ''}`}
              users={users}
            />
          )
        })}
      </div>
    </div>
  )
}
