'use client'

import { showLoginDialog } from '@/components/shared/LoginDialog'
import ReactionsContainer from './Container'

// 可用的反应类型
const availableReactions = [
  { key: 'THUMBS_UP', emoji: '👍' },
  { key: 'HEART', emoji: '❤️' },
  { key: 'LAUGH', emoji: '😄' },
  { key: 'HOORAY', emoji: '🎉' },
  { key: 'ROCKET', emoji: '🚀' },
  { key: 'EYES', emoji: '👀' },
]

interface ReactionsLoginProps {
  className?: string
}

/**
 * 互动反应 - 未登录状态UI
 * 职责：显示模糊数据和登录提示
 */
export default function ReactionsLogin({
  className = '',
}: ReactionsLoginProps) {
  return (
    <div className="relative">
      <ReactionsContainer className={className}>
        {availableReactions.map(({ key, emoji }) => (
          <div
            key={key}
            className="relative flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-1 transition-all duration-200"
          >
            <span className="text-base">{emoji}</span>
            <span className="select-none text-xs font-medium text-gray-400 blur-sm">
              88
            </span>
          </div>
        ))}
      </ReactionsContainer>
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

