'use client'

import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import CopyButton from './CopyButton'
import InteractiveReactions from './InteractiveReactions'
import { IKfcItem } from '@/types'

interface JokeCardProps {
  item: IKfcItem
  initialReactionDetails?: any[]
  initialReactionNodes?: any[]
}

export default function JokeCard({ 
  item, 
  initialReactionDetails = [], 
  initialReactionNodes = [] 
}: JokeCardProps) {
  // 计算热门状态
  const totalReactions = item.reactions?.totalCount || 0
  const isHot = totalReactions >= 10

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* 热门标签 */}
      {isHot && (
        <div className="absolute -right-2 -top-2 z-10 rounded-full bg-kfc-red px-3 py-1 text-xs font-bold text-white shadow-lg">
          热门
        </div>
      )}

      {/* 段子内容 */}
      <div className="mb-4">
        <p className="overflow-auto whitespace-pre-wrap leading-5">
          {item.body}
        </p>
        <div className="mt-2 flex justify-end">
          <CopyButton text={item.body} />
        </div>
      </div>

      {/* 作者信息和互动数据 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <Image
            src={item.author.avatarUrl}
            alt={`${item.author.username}的头像`}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border-2 border-gray-200"
          />
          <span className="text-sm text-gray-700">
            @{item.author.username}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <i className="fa fa-calendar"></i>
            <FormattedDate date={item.createdAt} />
          </span>

          <InteractiveReactions
            issueId={item.id}
            initialReactionDetails={initialReactionDetails}
            initialReactionNodes={initialReactionNodes}
          />
        </div>
      </div>
    </div>
  )
}