'use client'

import { useState, useCallback } from 'react'
import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import { IKfcItem } from '@/types'
import CopyButton from './CopyButton'
import InteractiveReactions from './InteractiveReactions'
import useSWR from 'swr'

interface ReactionsData {
  totalCount: number
  details: any[]
  nodes: any[]
}

// SWR fetcher 函数
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('获取数据失败')
  }
  return res.json()
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

export default function RandomJoke() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 使用 SWR 获取随机段子
  const { 
    data: joke, 
    error: jokeError, 
    isLoading: jokeLoading,
    mutate: mutateJoke 
  } = useSWR<IKfcItem>(
    `/api/random?_=${refreshKey}`, 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000, // 1秒去重间隔，避免过度请求
      keepPreviousData: true, // 保持之前的数据，避免闪烁
    }
  )

  // 使用 SWR 获取 reactions 数据
  const { 
    data: reactionsData, 
    isLoading: reactionsLoading,
    mutate: mutateReactions 
  } = useSWR<ReactionsData & { warning?: string }>(
    joke?.id ? `/api/reactions/${joke.id}` : null,
    reactionsFetcher,
    {
      refreshInterval: 30000, // 30秒自动刷新 reactions
      revalidateOnFocus: true,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      keepPreviousData: true, // 保持之前的数据，避免闪烁
    }
  )

  // 获取新段子
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // 增加 refresh key 强制获取新数据
      const newKey = refreshKey + 1
      setRefreshKey(newKey)
      
      // 重新获取段子数据，不清除当前数据
      await mutateJoke()
    } catch (error) {
      console.error('Failed to refresh joke:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshKey, mutateJoke])

  // 初次加载状态
  const isInitialLoading = jokeLoading && !joke
  const isButtonLoading = isRefreshing || jokeLoading

  // 错误状态
  if (jokeError && !joke) {
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
              <div className="mb-4 text-4xl">😵‍💫</div>
              <p className="mb-4 text-lg">哎呀，段子加载失败了</p>
              <p className="mb-6 text-sm opacity-75">{jokeError.message}</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kfc-red to-orange-500 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <i className="fa fa-refresh"></i>
                重新获取段子
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 加载状态
  if (isInitialLoading) {
    return (
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <span className="animate-pulse rounded bg-kfc-red px-2 py-1 text-xs text-white">
                今日推荐
              </span>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                让你笑到拍桌的段子
              </h2>
            </div>
            
            {/* 骨架屏 */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/6"></div>
            </div>
            
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-kfc-yellow border-t-transparent"></div>
                <span className="text-lg font-medium text-gray-600">
                  正在为您精选段子...
                </span>
              </div>
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
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8 transition-all duration-300 hover:shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gradient-to-r from-kfc-red to-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
                今日推荐
              </span>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                让你笑到拍桌的段子
              </h2>
            </div>
            
            {/* 状态指示器 */}
            <div className="flex items-center gap-2">
              {reactionsData?.warning && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700 border border-amber-200">
                  {reactionsData.warning}
                </span>
              )}
              {reactionsLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-kfc-yellow border-t-transparent"></div>
              )}
            </div>
          </div>

          {/* 段子内容 */}
          <div className="mb-6 group">
            <div className="min-h-[120px] whitespace-pre-wrap border-l-4 border-kfc-yellow px-4 py-2 text-lg leading-relaxed md:text-xl bg-gray-50/50 rounded-r-lg transition-colors duration-300 group-hover:bg-gray-50">
              {joke.body}
            </div>
            <div className="mt-3 flex justify-end">
              <CopyButton text={joke.body} />
            </div>
          </div>

          {/* 作者信息和互动数据 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={joke.author.avatarUrl}
                  alt="用户头像"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border-3 border-kfc-yellow shadow-sm transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  贡献者:{' '}
                  <span className="text-kfc-red hover:text-orange-500 transition-colors duration-300">
                    @{joke.author.username}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <i className="fa fa-calendar text-xs"></i>
                  <FormattedDate date={joke.createdAt} />
                </div>
              </div>
            </div>

            {/* Reactions 区域 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <InteractiveReactions
                  issueId={joke.id}
                  initialReactionDetails={reactionsData?.details || []}
                  initialReactionNodes={reactionsData?.nodes || []}
                  className="flex-wrap"
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleRefresh}
              disabled={isButtonLoading}
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-kfc-yellow to-yellow-400 px-8 py-3 font-bold text-kfc-red shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100"
            >
              {isButtonLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
                  <span>正在获取...</span>
                </>
              ) : (
                <>
                  <i className="fa fa-refresh text-lg transition-transform duration-300 group-hover:rotate-180"></i>
                  <span>换个段子乐一乐</span>
                  <span className="text-sm opacity-75">(≧∇≦)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
