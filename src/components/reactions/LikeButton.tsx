'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { LikeRequest } from '@/types'
import { showLoginDialog } from '@/components/shared/LoginDialog'

interface LikeButtonProps {
  issueId: string
  reaction: string
  emoji: string
  count: number
  isUserReacted?: boolean
  className?: string
  onDataRefresh?: () => void
  users?: string[]
}

/**
 * 点赞按钮组件
 * 职责：处理单个反应的点击、显示和状态管理
 */
export default function LikeButton({
  issueId,
  reaction,
  emoji,
  count,
  isUserReacted = false,
  className = '',
  onDataRefresh,
  users = [],
}: LikeButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleReactionToggle = async () => {
    if (!session?.user?.username) {
      // 显示登录确认弹窗
      showLoginDialog({
        title: '互动需要登录',
        message: '登录后即可互动，还能投稿自己的创意文案！',
      })
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      const method = isUserReacted ? 'DELETE' : 'POST'

      const response = await fetch('/api/like', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId,
          reaction,
        } as LikeRequest),
      })

      const data = await response.json()

      if (data.success) {
        // 通过回调函数刷新数据
        if (onDataRefresh) {
          onDataRefresh()
        }
      } else {
        // 如果是认证错误，重新登录
        if (response.status === 401) {
          const errorMsg = data.message || ''
          const isExpired = errorMsg.includes('无效') || errorMsg.includes('过期')

          showLoginDialog({
            title: isExpired ? '登录已过期' : '需要登录',
            message: isExpired
              ? '您的登录已过期，请重新登录以继续互动'
              : '请登录后继续添加反应',
          })
        } else {
          alert(data.message)
        }
      }
    } catch (error) {
      console.error('Reaction操作失败:', error)
      alert('操作失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 生成title信息
  const getTitle = () => {
    if (users.length === 0) {
      return '暂无操作人'
    } else if (users.length === 1) {
      return `操作人: ${users[0]}`
    } else {
      return `操作人: ${users.slice(0, 3).join(', ')}${users.length > 3 ? ` 等${users.length}人` : ''}`
    }
  }

  return (
    <button
      onClick={handleReactionToggle}
      disabled={isLoading}
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-all duration-200 ${
        isUserReacted
          ? 'bg-kfc-red text-white shadow-md ring-2 ring-kfc-red/20 hover:bg-red-600 hover:ring-red-400/30'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'} ${className}`}
      title={getTitle()}
    >
      <span className={`text-base ${isUserReacted ? 'animate-pulse' : ''}`}>
        {emoji}
      </span>
      <span className={`font-medium ${isUserReacted ? 'font-bold' : ''}`}>
        {count}
      </span>
      {isUserReacted && (
        <span className="ml-1 text-xs opacity-80">✓</span>
      )}
      {isLoading && (
        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"></div>
      )}
    </button>
  )
}
