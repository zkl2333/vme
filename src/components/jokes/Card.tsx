'use client'

import { FormattedDate } from '@/components/shared/FormattedDate'
import Image from 'next/image'
import Link from 'next/link'
import CopyButton from '@/components/shared/CopyButton'
import InteractiveReactions from '@/components/reactions/Interactive'
import ReactionsLoading from '@/components/reactions/Loading'
import { IKfcItem } from '@/types'

interface JokeCardProps {
  item: IKfcItem
  initialReactionDetails?: any[]
  initialReactionNodes?: any[]
  waitForBatchData?: boolean // 是否等待批量数据
}

/**
 * 段子卡片组件
 * 职责：展示单个段子的内容、作者信息和互动数据
 */
export default function JokeCard({ 
  item, 
  initialReactionDetails = [], 
  initialReactionNodes = [],
  waitForBatchData = false
}: JokeCardProps) {
  // 计算热门状态
  const totalReactions = item.reactions?.totalCount || 0
  const isHot = totalReactions >= 10

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg md:p-6">
      {/* 热门标签 - 优化位置避免被裁剪 */}
      {isHot && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-kfc-red px-2.5 py-1 text-xs font-bold text-white shadow-lg md:px-3">
          热门
        </div>
      )}

      {/* 段子内容 */}
      <div className="mb-4">
        <p className="overflow-auto text-sm leading-relaxed whitespace-pre-wrap line-clamp-6 md:text-base">
          {item.body}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Link
            href={`/jokes/${item.id}`}
            className="inline-flex items-center gap-1 text-sm text-kfc-red transition-colors hover:text-kfc-darkRed hover:underline"
          >
            <span>查看详情</span>
            <i className="fa fa-arrow-right text-xs"></i>
          </Link>
          <CopyButton text={item.body} />
        </div>
      </div>

      {/* 作者信息和互动数据 - 优化移动端布局 */}
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <Image
            src={item.author.avatarUrl}
            alt={`${item.author.username}的头像`}
            width={40}
            height={40}
            className="h-8 w-8 rounded-full border-2 border-gray-200 md:h-10 md:w-10"
          />
          <span className="text-sm text-gray-700">
            @{item.author.username}
          </span>
        </div>

        {/* 日期 */}
        <div className="flex items-center gap-1 text-xs text-gray-500 md:text-sm">
          <i className="fa fa-calendar"></i>
          <FormattedDate date={item.createdAt} />
        </div>

        {/* 互动数据展示 - 独立一行避免超出 */}
        <div className="min-w-0 overflow-hidden">
          {waitForBatchData ? (
            <ReactionsLoading />
          ) : (
            <InteractiveReactions
              issueId={item.id}
              initialReactionDetails={initialReactionDetails}
              initialReactionNodes={initialReactionNodes}
            />
          )}
        </div>
      </div>
    </div>
  )
}