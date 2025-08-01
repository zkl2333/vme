'use client'

import { useState, useEffect } from 'react'
import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import { IKfcItem } from '@/types'

export default function RandomJoke() {
  const [joke, setJoke] = useState<IKfcItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取随机段子的函数
  const fetchRandomJoke = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/random')
      if (!response.ok) {
        throw new Error('获取随机段子失败')
      }
      const data = await response.json()
      setJoke(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取段子失败')
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取第一个段子
  useEffect(() => {
    fetchRandomJoke()
  }, [])

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
          </div>

          <div className="mb-6 min-h-[120px] whitespace-pre-wrap border-l-4 border-kfc-yellow px-1 text-lg leading-relaxed md:text-xl">
            {joke.body}
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
                  <FormattedDate date={joke.createdAt} /> ·{' '}
                  {joke.reactions?.totalCount || 0}人笑了
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-gray-500 transition-colors hover:text-kfc-red">
                <i className="fa fa-thumbs-up"></i>
                <span>{joke.reactions?.totalCount || 0}</span>
              </button>
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
