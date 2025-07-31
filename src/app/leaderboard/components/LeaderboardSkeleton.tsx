export default function LeaderboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 排序按钮骨架 */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 rounded-full bg-gray-200" />
        ))}
      </div>

      {/* 统计概览骨架 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="h-8 w-8 mx-auto bg-gray-200 rounded" />
            <div className="mt-2 h-6 bg-gray-200 rounded" />
            <div className="mt-1 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Top 3 骨架 */}
      <div>
        <div className="mb-6 h-8 bg-gray-200 rounded w-64 mx-auto" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border-2 border-gray-200 bg-white p-6 text-center">
              <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
              <div className="mt-4 h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 排行榜列表骨架 */}
      <div>
        <div className="mb-6 h-8 bg-gray-200 rounded w-48 mx-auto" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-12 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}