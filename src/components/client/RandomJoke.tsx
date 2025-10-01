'use client'

import { useState, useEffect } from 'react'
import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import { IKfcItem } from '@/types'
import CopyButton from './CopyButton'
import InteractiveReactions from './InteractiveReactions'

interface ReactionsData {
  totalCount: number
  details: any[]
  nodes: any[]
}

export default function RandomJoke() {
  const [joke, setJoke] = useState<IKfcItem | null>(null)
  const [reactions, setReactions] = useState<ReactionsData>({
    totalCount: 0,
    details: [],
    nodes: [],
  })
  const [loading, setLoading] = useState(true)
  const [reactionsLoading, setReactionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)

  // 获取 reactions 数据的函数
  const fetchReactions = async (issueId: string) => {
    setReactionsLoading(true)
    setRateLimitWarning(null)
    
    try {
      const response = await fetch(`/api/reactions/${issueId}`)
      
      if (response.ok) {
        const data = await response.json()
        setReactions({
          totalCount: data.totalCount,
          details: data.details || [],
          nodes: data.nodes || [],
        })
      } else {
        // 处理各种错误情况
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          setRateLimitWarning('API 调用频率限制，显示缓存数据')
          console.warn('Rate limit hit, using fallback data')
        } else if (response.status === 503) {
          console.warn('GitHub token not configured, using basic data')
        } else {
          console.warn('Failed to fetch reactions:', errorData)
        }
        
        // 使用降级数据
        if (errorData.fallback) {
          setReactions(errorData.fallback)
        }
      }
    } catch (err) {
      console.error('Error fetching reactions:', err)
      // 保持默认的空状态
    } finally {
      setReactionsLoading(false)
    }
  }

  // 获取随机段子的函数
  const fetchRandomJoke = async () => {
    setLoading(true)
    setError(null)
    setRateLimitWarning(null)
    
    try {
      // 首先获取基础段子数据（快速响应）
      const response = await fetch('/api/random')
      
      if (!response.ok) {
        throw new Error('获取随机段子失败')
      }
      
      const jokeData = await response.json()
      setJoke(jokeData)
      
      // 使用基础数据的 reactions 作为初始值
      setReactions({
        totalCount: jokeData.reactions?.totalCount || 0,
        details: [],
        nodes: [],
      })
      
      // 异步获取增强的 reactions 数据
      if (jokeData.id) {
        fetchReactions(jokeData.id)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取段子失败')
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取第一个段子
  useEffect(() => {
    fetchRandomJoke()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 处理换段子按钮点击
  const handleRefresh = () => {
    fetchRandomJoke()
  }

  // 错误状态
  if (error && !joke) {
    return (
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded bg-kfc-red px-2 py-1 text-xs text-white">
                今日推荐
              </span>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                让你笑到拍桌的段子
              </h2>
            </div>
            <div className="text-center text-gray-500">
              <i className="fa fa-exclamation-circle mb-4 text-4xl"></i>
              <p>{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 flex items-center gap-2 rounded-full bg-kfc-yellow px-6 py-2 font-bold text-kfc-red shadow-md transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg"
              >
                <i className="fa fa-refresh"></i>
                重试
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 加载状态
  if (loading && !joke) {
    return (
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded bg-kfc-red px-2 py-1 text-xs text-white">
                今日推荐
              </span>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                让你笑到拍桌的段子
              </h2>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
              <span className="ml-2 text-gray-600">加载段子中...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 正常显示段子
  if (!joke) {
    return null
  }

  return (
    <section className="mb-12">
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-2">
            <span className="rounded bg-kfc-red px-2 py-1 text-xs text-white">
              今日推荐
            </span>
            <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
              让你笑到拍桌的段子
            </h2>
            
            {/* 限流警告提示 */}
            {rateLimitWarning && (
              <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                {rateLimitWarning}
              </span>
            )}
          </div>

          <div className="mb-6 min-h-[120px] whitespace-pre-wrap border-l-4 border-kfc-yellow px-1 text-lg leading-relaxed md:text-xl">
            {joke.body}
            <div className="mt-3 flex justify-end">
              <CopyButton text={joke.body} />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src={joke.author.avatarUrl}
                alt="用户头像"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-kfc-yellow"
              />
              <div>
                <div className="font-medium">
                  贡献者:{' '}
                  <span className="text-kfc-red">@{joke.author.username}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <FormattedDate date={joke.createdAt} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Reactions 区域 */}
              <div className="relative">
                {reactionsLoading && (
                  <div className="absolute right-0 top-0 -mt-1 -mr-1">
                    <div className="h-3 w-3 animate-spin rounded-full border border-kfc-red border-t-transparent"></div>
                  </div>
                )}
                <InteractiveReactions
                  issueId={joke.id}
                  reactionDetails={reactions.details}
                  reactionNodes={reactions.nodes}
                  className="flex-wrap"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-kfc-yellow px-6 py-2 font-bold text-kfc-red shadow-md transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
                加载中...
              </>
            ) : (
              <>
                <i className="fa fa-refresh"></i>
                换个段子乐一乐
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
