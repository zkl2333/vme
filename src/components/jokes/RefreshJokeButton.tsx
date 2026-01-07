'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RefreshJokeButtonProps {
  currentJokeId: string
}

/**
 * 刷新段子按钮组件
 * 职责：提供"换个段子"按钮功能，随机切换到新段子
 */
export default function RefreshJokeButton({ currentJokeId }: RefreshJokeButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // 获取随机段子 ID
      const res = await fetch('/api/random/id', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('获取随机段子失败')
      }
      const { id } = await res.json()

      // 如果获取到的是相同的段子，再试一次
      if (id === currentJokeId) {
        const retryRes = await fetch('/api/random/id', { cache: 'no-store' })
        if (retryRes.ok) {
          const retryData = await retryRes.json()
          router.push(`/?joke=${retryData.id}`)
        } else {
          router.push(`/?joke=${id}`)
        }
      } else {
        router.push(`/?joke=${id}`)
      }
    } catch (error) {
      console.error('获取随机段子失败:', error)
      // 降级方案：直接刷新页面
      router.push('/')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-kfc-yellow to-yellow-400 px-8 py-3 font-bold text-kfc-red shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
      >
        <i className={`fa fa-refresh text-lg transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}></i>
        <span>{isLoading ? '正在获取...' : '再来一条'}</span>
        {!isLoading && <span className="text-sm opacity-75">(≧∇≦)</span>}
      </button>
    </div>
  )
}

