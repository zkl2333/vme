/**
 * 动态数据集成组件
 * 结合本地静态数据与后端实时 reactions 数据
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { LocalKfcItem } from '@/lib/local-db'
import type { ReactionGroup } from '@/types'

// 扩展的段子项接口，包含动态数据
interface EnhancedKfcItem extends LocalKfcItem {
  // 实时动态数据
  liveReactions?: ReactionGroup[]
  userReaction?: string | null
  // 数据状态
  reactionsLoading?: boolean
  reactionsError?: string | null
}

// 组件 Props
interface JokeItemWithReactionsProps {
  item: LocalKfcItem
  showReactions?: boolean
  enableInteraction?: boolean
  className?: string
}

export default function JokeItemWithReactions({
  item,
  showReactions = true,
  enableInteraction = true,
  className = ''
}: JokeItemWithReactionsProps) {

  const { data: session } = useSession()
  const [enhancedItem, setEnhancedItem] = useState<EnhancedKfcItem>({
    ...item,
    liveReactions: undefined,
    userReaction: null,
    reactionsLoading: false,
    reactionsError: null
  })

  // 获取实时 reactions 数据
  const fetchReactions = useCallback(async () => {
    if (!showReactions || !item.id) return

    setEnhancedItem(prev => ({ ...prev, reactionsLoading: true, reactionsError: null }))

    try {
      // 批量获取 reactions 统计
      const statsResponse = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueIds: [item.id]
        })
      })

      if (!statsResponse.ok) {
        throw new Error(`获取统计失败: ${statsResponse.status}`)
      }

      const statsData = await statsResponse.json()
      const reactionStats = statsData.reactions?.[item.id]

      // 如果用户已登录，获取用户的 reaction 状态
      let userReaction = null
      if (session?.accessToken && enableInteraction) {
        try {
          const userReactionResponse = await fetch(`/api/reaction-status?issueId=${item.id}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`
            }
          })

          if (userReactionResponse.ok) {
            const userReactionData = await userReactionResponse.json()
            userReaction = userReactionData.userReaction
          }
        } catch (error) {
          console.warn('获取用户 reaction 状态失败:', error)
        }
      }

      setEnhancedItem(prev => ({
        ...prev,
        liveReactions: reactionStats?.reactions || [],
        userReaction,
        reactionsLoading: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取动态数据失败'
      setEnhancedItem(prev => ({
        ...prev,
        reactionsLoading: false,
        reactionsError: errorMessage
      }))
      console.error('获取 reactions 失败:', error)
    }
  }, [item.id, showReactions, session?.accessToken, enableInteraction])

  // 点赞操作
  const handleReaction = useCallback(async (reactionType: string) => {
    if (!session?.accessToken || !enableInteraction) {
      // 未登录，跳转到登录页面
      window.location.href = '/auth/signin'
      return
    }

    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          issueId: item.id,
          reactionType,
          action: enhancedItem.userReaction === reactionType ? 'remove' : 'add'
        })
      })

      if (!response.ok) {
        throw new Error(`操作失败: ${response.status}`)
      }

      // 操作成功，重新获取数据
      await fetchReactions()

    } catch (error) {
      console.error('Reaction 操作失败:', error)
      const errorMessage = error instanceof Error ? error.message : '操作失败'
      setEnhancedItem(prev => ({
        ...prev,
        reactionsError: errorMessage
      }))
    }
  }, [session?.accessToken, enableInteraction, item.id, enhancedItem.userReaction, fetchReactions])

  // 组件挂载时获取动态数据
  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  // Reaction 按钮组件
  const ReactionButton = ({ type, emoji, count }: {
    type: string
    emoji: string
    count: number
  }) => {
    const isActive = enhancedItem.userReaction === type
    const isLoading = enhancedItem.reactionsLoading

    return (
      <button
        onClick={() => handleReaction(type)}
        disabled={isLoading || !enableInteraction}
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-all
          ${isActive
            ? 'bg-red-100 text-red-600 border border-red-300'
            : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${!enableInteraction ? 'cursor-default' : ''}
        `}
      >
        <span className="text-base">{emoji}</span>
        <span className="font-medium">{count}</span>
      </button>
    )
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffDays > 0) {
        return `${diffDays}天前`
      } else if (diffHours > 0) {
        return `${diffHours}小时前`
      } else {
        return '刚刚'
      }
    } catch {
      return dateString
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      {/* 段子内容 */}
      <div className="p-6">
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
          {enhancedItem.title}
        </h3>

        {/* 正文 */}
        <div className="text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">
          {enhancedItem.body}
        </div>

        {/* 作者信息 */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={enhancedItem.authorAvatarUrl}
            alt={enhancedItem.authorUsername}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-800">{enhancedItem.authorUsername}</div>
            <div className="text-sm text-gray-500">
              {formatTime(enhancedItem.createdAt)} · {enhancedItem.repoKey}
            </div>
          </div>
        </div>

        {/* Reactions 区域 */}
        {showReactions && (
          <div className="border-t pt-4">
            {enhancedItem.reactionsLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-sm">加载互动数据...</span>
              </div>
            )}

            {enhancedItem.reactionsError && (
              <div className="text-red-500 text-sm">
                ⚠️ {enhancedItem.reactionsError}
                <button
                  onClick={fetchReactions}
                  className="ml-2 text-blue-500 hover:text-blue-600"
                >
                  重试
                </button>
              </div>
            )}

            {enhancedItem.liveReactions && (
              <div className="space-y-3">
                {/* Reaction 按钮 */}
                <div className="flex items-center space-x-2 flex-wrap">
                  {enhancedItem.liveReactions.map((reaction) => {
                    const emojiMap: Record<string, string> = {
                      '+1': '👍',
                      '-1': '👎',
                      'laugh': '😄',
                      'hooray': '🎉',
                      'confused': '😕',
                      'heart': '❤️',
                      'rocket': '🚀',
                      'eyes': '👀'
                    }

                    return (
                      <ReactionButton
                        key={reaction.content}
                        type={reaction.content}
                        emoji={emojiMap[reaction.content] || '👍'}
                        count={reaction.users.totalCount}
                      />
                    )
                  })}

                  {/* 添加新 reaction 的快捷按钮 */}
                  {enableInteraction && enhancedItem.liveReactions.length < 8 && (
                    <button
                      onClick={() => handleReaction('+1')} // 默认点赞
                      disabled={enhancedItem.reactionsLoading}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                    >
                      <span>👍</span>
                      <span>点赞</span>
                    </button>
                  )}
                </div>

                {/* 登录提示 */}
                {!session && enableInteraction && (
                  <div className="text-sm text-gray-500">
                    <a
                      href="/auth/signin"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      登录
                    </a>
                    {' '}后可以点赞和互动
                  </div>
                )}
              </div>
            )}

            {/* 备用显示：使用本地缓存的基础数据 */}
            {!enhancedItem.liveReactions && !enhancedItem.reactionsLoading && !enhancedItem.reactionsError && item.reactions && (
              <div className="text-sm text-gray-500">
                👍 {item.reactions.totalCount} 个赞
                <span className="ml-2 text-xs">(本地缓存数据)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 数据来源标识 */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              enhancedItem.syncStatus === 'synced' ? 'bg-green-400' : 'bg-yellow-400'
            }`}></span>
            <span>本地数据</span>
            {enhancedItem.liveReactions && (
              <>
                <span>+</span>
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>实时互动</span>
              </>
            )}
          </div>
          <a
            href={`https://github.com/${enhancedItem.repoOwner}/${enhancedItem.repoName}/issues/${enhancedItem.id.split('_').pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-500"
          >
            查看原文 ↗
          </a>
        </div>
      </div>
    </div>
  )
}

// 批量 Reactions 获取 Hook
export function useBatchReactions(itemIds: string[]) {
  const [reactions, setReactions] = useState<Record<string, ReactionGroup[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBatchReactions = useCallback(async () => {
    if (itemIds.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueIds: itemIds
        })
      })

      if (!response.ok) {
        throw new Error(`获取批量统计失败: ${response.status}`)
      }

      const data = await response.json()
      setReactions(data.reactions || {})

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取批量数据失败'
      setError(errorMessage)
      console.error('批量获取 reactions 失败:', err)
    } finally {
      setLoading(false)
    }
  }, [itemIds])

  useEffect(() => {
    fetchBatchReactions()
  }, [fetchBatchReactions])

  return {
    reactions,
    loading,
    error,
    refetch: fetchBatchReactions
  }
}