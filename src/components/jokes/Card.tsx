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
    <div className="group relative border-3 border-black bg-white p-4 transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-xl shadow-neo md:p-6">
      {/* 热门标签 - 暴躁风 */}
      {isHot && (
        <div className="absolute -right-2 -top-2 z-10 -rotate-3 border-2 border-black bg-kfc-yellow px-3 py-1 text-xs font-black uppercase italic text-black shadow-neo-sm">
          HOT! 爆款
        </div>
      )}

      {/* 段子内容 */}
      <div className="mb-4">
        <p className="text-justify-cn text-base font-bold leading-snug text-black whitespace-pre-wrap line-clamp-6 md:text-lg">
          {item.body}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Link
            href={`/jokes/${item.id}`}
            className="border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-tighter transition-all hover:bg-black hover:text-white"
          >
            Read More / 详情
          </Link>
          <CopyButton text={item.body} />
        </div>
      </div>

      {/* 作者信息和互动数据 */}
      <div className="flex flex-col gap-3 border-t-2 border-black pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="border-2 border-black shadow-neo-sm">
              <Image
                src={item.author.avatarUrl}
                alt={`${item.author.username}的头像`}
                width={40}
                height={40}
                className="h-8 w-8 object-cover md:h-10 md:w-10"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black text-black">
                @{item.author.username}
              </span>
              <div className="mt-1 text-[10px] font-bold uppercase text-gray-500">
                <FormattedDate date={item.createdAt} />
              </div>
            </div>
          </div>
        </div>

        {/* 互动数据展示 */}
        <div className="min-w-0 overflow-hidden pt-1">
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