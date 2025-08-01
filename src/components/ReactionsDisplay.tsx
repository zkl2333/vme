// Reaction emoji映射
const reactionEmojis: { [key: string]: string } = {
  '+1': '👍',
  '-1': '👎',
  laugh: '😄',
  hooray: '🎉',
  confused: '😕',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
  // 支持大写格式
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  LAUGH: '😄',
  HOORAY: '🎉',
  CONFUSED: '😕',
  HEART: '❤️',
  ROCKET: '🚀',
  EYES: '👀',
}

interface ReactionGroup {
  content: string
  users: {
    totalCount: number
  }
}

interface ReactionsDisplayProps {
  reactionDetails: ReactionGroup[]
  totalInteractions: number
  className?: string
}

export default function ReactionsDisplay({
  reactionDetails,
  className = '',
}: ReactionsDisplayProps) {
  // 过滤出有数量的reactions
  const activeReactions = reactionDetails.filter(
    (reaction) => reaction.users.totalCount > 0,
  )

  if (activeReactions.length > 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-400">互动:</span>
        <div className="flex items-center gap-1">
          {activeReactions.map((reaction) => (
            <span
              key={reaction.content}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
              title={`${reaction.content}: ${reaction.users.totalCount}`}
            >
              <span className="text-sm">
                {reactionEmojis[reaction.content] || reaction.content}
              </span>
              <span className="font-medium text-gray-700">
                {reaction.users.totalCount}
              </span>
            </span>
          ))}
        </div>
      </div>
    )
  }

  // 当没有active reactions时，不显示任何内容
  return null
}
