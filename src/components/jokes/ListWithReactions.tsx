'use client'

import { IKfcItem } from '@/types'
import JokeCard from './Card'
import { useBatchReactions } from '@/hooks/useBatchReactions'
import { useSession } from 'next-auth/react'

interface ListWithReactionsProps {
  items: IKfcItem[]
}

/**
 * 段子列表（带批量反应数据注入）
 * 职责：批量获取所有段子的互动数据，并注入到各个卡片
 */
export default function ListWithReactions({ items }: ListWithReactionsProps) {
  const { status } = useSession()
  
  // 登录后批量获取所有段子的反应数据
  const issueIds = status === 'authenticated' ? items.map(item => item.id) : []
  const { data, isLoading } = useBatchReactions(issueIds)

  // 判断是否需要等待批量数据：
  // 1. 会话加载中：需要等待（不知道用户是否登录）
  // 2. 用户已登录且数据正在加载中：需要等待
  const waitForBatchData = status === 'loading' || (status === 'authenticated' && isLoading)

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const reactionData = data[item.id]
        return (
          <JokeCard 
            key={item.id}
            item={item}
            // 将批量获取的数据注入到卡片
            initialReactionDetails={reactionData?.details || []}
            initialReactionNodes={reactionData?.nodes || []}
            waitForBatchData={waitForBatchData}
          />
        )
      })}
    </div>
  )
}

