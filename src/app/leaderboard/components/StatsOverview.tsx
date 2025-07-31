interface StatsOverviewProps {
  stats: {
    totalPosts: number
    totalReactions: number
    totalComments: number
    totalAuthors: number
  }
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const statItems = [
    {
      label: '总段子数',
      value: stats.totalPosts.toLocaleString(),
      icon: '📝',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: '总点赞数',
      value: stats.totalReactions.toLocaleString(),
      icon: '👍',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: '总评论数',
      value: stats.totalComments.toLocaleString(),
      icon: '💬',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: '贡献者数',
      value: stats.totalAuthors.toLocaleString(),
      icon: '👥',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`rounded-lg border border-gray-200 ${item.bgColor} p-4 text-center shadow-sm`}
        >
          <div className="text-2xl">{item.icon}</div>
          <div className={`mt-2 text-2xl font-bold ${item.color}`}>
            {item.value}
          </div>
          <div className="text-sm font-medium text-gray-600">{item.label}</div>
        </div>
      ))}
    </div>
  )
}