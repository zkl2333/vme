import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import JokesPagination from '../client/JokesPagination'
import { getKfcItemsWithPagination } from '@/lib/server-utils'
import { GitHubService } from '@/lib/github-service'
import InteractiveReactionsSimple from '../client/InteractiveReactionsSimple'
import CopyButton from '../client/CopyButton'

interface JokesServerProps {
  currentPage: number
  request?: Request // 添加可选的request参数
}

export default async function JokesServer({ currentPage, request }: JokesServerProps) {
  const { items, totalPages, total } = await getKfcItemsWithPagination(
    currentPage,
    10,
  )

  // 尝试获取统计数据，如果失败则使用默认值
  let stats: { [id: string]: any } = {}
  
  // 安全创建GitHub服务，传入request以使用用户token
  const githubService = await GitHubService.createSafely(request)
  
  if (githubService) {
    try {
      stats = await githubService.getBatchIssueStats(
        items.map((item) => item.id),
      )
    } catch (error) {
      console.warn('Failed to fetch GitHub stats for jokes list:', error instanceof Error ? error.message : error)
      // 设置默认统计数据
      items.forEach(item => {
        stats[item.id] = {
          reactions: 0,
          reactionDetails: [],
          reactionNodes: [],
        }
      })
    }
  } else {
    console.info('GitHub service not available, using default reaction data')
    // GitHub服务不可用时设置默认统计数据
    items.forEach(item => {
      stats[item.id] = {
        reactions: 0,
        reactionDetails: [],
        reactionNodes: [],
      }
    })
  }

  return (
    <section id="jokes-list" className="mb-12">
      {/* 段子列表标题 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <i className="fa fa-book text-kfc-red"></i> 段子总库
        </h2>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm shadow-sm">
          <span>
            共收录: <span className="font-bold text-kfc-red">{total}</span>
            个段子
          </span>
        </div>
      </div>

      {/* 段子列表 */}
      <div className="space-y-6">
        {items.map((item) => {
          const itemStats = stats[item.id]
          const interactions =
            itemStats?.reactions || item.reactions?.totalCount || 0
          const reactionDetails = itemStats?.reactionDetails || []
          const reactionNodes = itemStats?.reactionNodes || []
          const isHot = interactions >= 10

          return (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
            >
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

                  <InteractiveReactionsSimple
                    issueId={item.id}
                    initialReactionDetails={reactionDetails}
                    initialReactionNodes={reactionNodes}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 分页组件 */}
      <JokesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={total}
        pageSize={10}
      />
    </section>
  )
}
