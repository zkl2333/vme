'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SortButtonsProps {
  currentSort: string
}

export default function SortButtons({ currentSort }: SortButtonsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortOptions = [
    { key: 'score', label: '综合评分', icon: '🏆' },
    { key: 'reactions', label: '点赞数', icon: '👍' },
    { key: 'comments', label: '评论数', icon: '💬' },
    { key: 'posts', label: '段子数', icon: '📝' },
  ]

  const handleSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', sortBy)
    router.push(`/leaderboard?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <span className="flex items-center text-sm font-medium text-gray-600">
        排序方式:
      </span>
      {sortOptions.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => handleSortChange(key)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            currentSort === key
              ? 'bg-kfc-red text-white shadow-md'
              : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md'
          }`}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
