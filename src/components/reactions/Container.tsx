'use client'

import { ReactNode } from 'react'

interface ReactionsContainerProps {
  children: ReactNode
  className?: string
}

/**
 * 互动反应容器组件
 * 职责：提供统一的布局和滚动行为
 */
export default function ReactionsContainer({
  children,
  className = '',
}: ReactionsContainerProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span className="shrink-0 text-xs text-gray-400">互动:</span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-2">
          {children}
        </div>
      </div>
    </div>
  )
}
