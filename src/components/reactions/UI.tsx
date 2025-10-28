'use client'

import LikeButton from './LikeButton'
import ReactionsContainer from './Container'

// 可用的反应类型
const availableReactions = [
  { key: 'THUMBS_UP', emoji: '👍', label: '点赞' },
  { key: 'HEART', emoji: '❤️', label: '爱心' },
  { key: 'LAUGH', emoji: '😄', label: '大笑' },
  { key: 'HOORAY', emoji: '🎉', label: '庆祝' },
  { key: 'ROCKET', emoji: '🚀', label: '火箭' },
  { key: 'EYES', emoji: '👀', label: '眼睛' },
]

interface ReactionsUIProps {
  issueId: string
  reactionCounts: Map<string, number>
  userReactionMap: Map<string, string>
  reactionUsers: Map<string, string[]>
  onDataRefresh: () => void
  className?: string
  warning?: string | null
}

/**
 * 互动反应 - 纯UI组件
 * 职责：展示反应按钮和数据
 */
export default function ReactionsUI({
  issueId,
  reactionCounts,
  userReactionMap,
  reactionUsers,
  onDataRefresh,
  className = '',
  warning,
}: ReactionsUIProps) {
  return (
    <>
      {warning && (
        <span className="mb-2 inline-block rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-xs text-amber-700">
          {warning}
        </span>
      )}
      <ReactionsContainer className={className}>
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
              onDataRefresh={onDataRefresh}
              className={`shrink-0 hover:scale-105 ${isUserReacted ? 'ring-1 ring-kfc-red/30' : ''}`}
              users={users}
            />
          )
        })}
      </ReactionsContainer>
    </>
  )
}

