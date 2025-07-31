'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sortOptions = [
  {
    key: 'score',
    label: '综合排名',
    icon: 'fa-trophy',
    description: '根据发布数量、点赞和评论综合评分',
  },
  {
    key: 'reactions',
    label: '点赞王',
    icon: 'fa-thumbs-up',
    description: '获得点赞数最多的用户',
  },
  {
    key: 'posts',
    label: '产量王',
    icon: 'fa-pencil',
    description: '发布段子数量最多的用户',
  },
  {
    key: 'comments',
    label: '互动王',
    icon: 'fa-comment',
    description: '获得评论数最多的用户',
  },
  {
    key: 'active',
    label: '活跃王',
    icon: 'fa-fire',
    description: '点赞+评论总数最高的用户',
  },
  {
    key: 'recent',
    label: '新锐王',
    icon: 'fa-clock-o',
    description: '最近发布段子的活跃用户',
  },
]

interface LeaderboardSortTabsProps {
  currentSort: string
}

export default function LeaderboardSortTabs({
  currentSort,
}: LeaderboardSortTabsProps) {
  return (
    <div className="mb-6">
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">
          选择排行榜类型
        </h3>
        <p className="text-sm text-gray-600">
          不同的排序方式展示不同维度的榜单数据
        </p>
      </div>

      {/* 移动端下拉选择 */}
      <div className="mb-4 block md:hidden">
        <select
          value={currentSort}
          onChange={(e) => {
            window.location.href = `?sortBy=${e.target.value}&page=1`
          }}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-kfc-red"
        >
          {sortOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </div>

      {/* 桌面端标签页 */}
      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-3">
        {sortOptions.map((option) => {
          const isActive = currentSort === option.key
          return (
            <Link
              key={option.key}
              href={`?sortBy=${option.key}&page=1`}
              className={`relative rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-md ${
                isActive
                  ? 'border-kfc-red bg-kfc-red text-white shadow-kfc'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-kfc-yellow hover:bg-kfc-yellow/5'
              }`}
            >
              <div className="mb-2 flex items-center gap-3">
                <i
                  className={`fa ${option.icon} text-lg ${isActive ? 'text-white' : 'text-kfc-red'}`}
                ></i>
                <span className="font-semibold">{option.label}</span>
                {isActive && (
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-1 text-xs">
                    当前
                  </span>
                )}
              </div>
              <p
                className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-500'}`}
              >
                {option.description}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
