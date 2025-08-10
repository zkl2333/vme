'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import LikeButton from './LikeButton'
import { useReactionData } from '@/hooks/useReactionData'

interface InteractiveReactionsProps {
  issueId: string
  reactionDetails: Array<{
    content: string
    users: {
      totalCount: number
    }
  }>
  reactionNodes?: any[]
  className?: string
}

// 可用的反应类型 - 直接使用GitHub的原始类型
const availableReactions = [
  { key: 'THUMBS_UP', emoji: '👍', label: '点赞' },
  { key: 'HEART', emoji: '❤️', label: '爱心' },
  { key: 'LAUGH', emoji: '😄', label: '大笑' },
  { key: 'HOORAY', emoji: '🎉', label: '庆祝' },
  { key: 'ROCKET', emoji: '🚀', label: '火箭' },
  { key: 'EYES', emoji: '👀', label: '眼睛' },
]

export default function InteractiveReactions({
  issueId,
  reactionDetails,
  reactionNodes = [],
  className = '',
}: InteractiveReactionsProps) {
  const { data: session } = useSession()

  // 使用自定义hook管理reaction数据
  const { data, isRefreshing, refreshData } = useReactionData(issueId, {
    reactionDetails,
    reactionNodes,
  })

  // 使用useMemo优化数据处理，避免重复计算
  const { reactionCounts, userReactionMap, reactionUsers } = useMemo(() => {
    const counts = new Map<string, number>()
    const userReactionMap = new Map<string, string>()
    const users = new Map<string, string[]>() // reactionKey -> [usernames]

    // 从reactionDetails获取计数
    data.reactionDetails.forEach(reaction => {
      counts.set(reaction.content, reaction.users.totalCount)
    })

    // 从reactionNodes获取用户状态和用户列表
    if (session?.user?.username) {
      data.reactionNodes.forEach(reaction => {
        // 记录用户reaction
        if (reaction.user.login === session.user.username) {
          userReactionMap.set(reaction.content, reaction.id)
        }
        
        // 记录所有用户
        if (!users.has(reaction.content)) {
          users.set(reaction.content, [])
        }
        users.get(reaction.content)!.push(reaction.user.login)
      })
    } else {
      // 未登录用户，只记录所有用户
      data.reactionNodes.forEach(reaction => {
        if (!users.has(reaction.content)) {
          users.set(reaction.content, [])
        }
        users.get(reaction.content)!.push(reaction.user.login)
      })
    }

    return { reactionCounts: counts, userReactionMap, reactionUsers: users }
  }, [data, session?.user?.username])

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
              onDataRefresh={refreshData}
              className={`hover:scale-105 ${isUserReacted ? 'ring-1 ring-kfc-red/30' : ''
                }`}
              users={users}
            />
          )
        })}
      </div>
      <button
        onClick={refreshData}
        disabled={isRefreshing}
        className={`ml-2 text-xs transition-colors ${isRefreshing
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-600'
          }`}
        title="刷新数据"
      >
        <i className={`fa fa-refresh ${isRefreshing ? 'animate-spin' : ''}`}></i>
      </button>
    </div>
  )
}
