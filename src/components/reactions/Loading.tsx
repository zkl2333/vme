'use client'

interface ReactionsLoadingProps {
  className?: string
}

/**
 * 互动反应 - 加载状态UI
 */
export default function ReactionsLoading({
  className = '',
}: ReactionsLoadingProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-400">互动:</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-7 w-12 animate-pulse rounded-full bg-gray-200"
          />
        ))}
      </div>
    </div>
  )
}

