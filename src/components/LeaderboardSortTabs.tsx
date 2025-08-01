'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sortOptions = [
  { key: 'score', label: '综合评分', icon: '🏆' },
  { key: 'reactions', label: '点赞数', icon: '👍' },
  { key: 'posts', label: '段子数', icon: '📝' },
]

interface LeaderboardSortTabsProps {
  currentSort: string
}

export default function LeaderboardSortTabs({
  currentSort,
}: LeaderboardSortTabsProps) {
  const searchParams = useSearchParams()

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <span className="flex items-center text-sm font-medium text-gray-600">
        排序方式:
      </span>
      {sortOptions.map(({ key, label, icon }) => {
        const isActive = currentSort === key

        const href = new URLSearchParams(searchParams)
        href.set('sortBy', key)

        return (
          <Link
            key={key}
            scroll={false}
            href={`?${href.toString()}`}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-kfc-red text-white shadow-md'
                : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md'
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        )
      })}
    </div>
  )
}
