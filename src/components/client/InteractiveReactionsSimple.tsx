'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import LikeButton from './LikeButton'
import useSWR from 'swr'

interface InteractiveReactionsSimpleProps {
  issueId: string
  initialReactionDetails: Array<{
    content: string
    users: {
      totalCount: number
    }
  }>
  initialReactionNodes?: any[]
  className?: string
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

// SWR fetcher - 只在需要时调用
const reactionsFetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function InteractiveReactionsSimple({
  issueId,
  initialReactionDetails,
  initialReactionNodes = [],
  className = '',
}: InteractiveReactionsSimpleProps) {
  const { data: session } = useSession()

  // 只有在用户交互后才会实际调用API (懒加载)
  const { data: liveData, mutate } = useSWR(
    null, // 默认不加载，只有在mutate时才会真正请求
    () => reactionsFetcher(`/api/reactions/${issueId}`),
    {
      revalidateOnFocus: false,
      revalidateOnMount: false, // 不自动加载
    }
  )

  // 手动刷新函数 - 只在用户交互后调用
  const refreshData = async () => {
    await mutate(reactionsFetcher(`/api/reactions/${issueId}`))
  }

  // 使用实时数据（如果有）或初始数据
  const reactionDetails = liveData?.details || initialReactionDetails
  const reactionNodes = liveData?.nodes || initialReactionNodes

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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
              onDataRefresh={refreshData} // 只在用户点击后才刷新
              className={`hover:scale-105 ${isUserReacted ? 'ring-1 ring-kfc-red/30' : ''}`}
              users={users}
            />
          )
        })}
      </div>
    </div>
  )
}