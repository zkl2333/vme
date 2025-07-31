import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import JokesPagination from '../JokesPagination'
import { getJokeStats, getKfcItemsWithPagination } from '@/lib/server-utils'

interface JokesServerProps {
  currentPage: number
}

export default async function JokesServer({ currentPage }: JokesServerProps) {
  const { items, totalPages, total } = await getKfcItemsWithPagination(
    currentPage,
    10,
  )

  // 获取统计数据
  const stats = await getJokeStats(items)

  return (
    <section id="jokes-list" className="mb-12">
      {/* 段子列表标题 */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-800">段子总库</h2>
        <p className="text-gray-600">精选肯德基疯狂星期四段子，让你笑出腹肌</p>
      </div>

      {/* 段子列表 */}
      <div className="space-y-6">
        {items.map((item) => {
          const itemStats = stats.get(item.id)
          const likes = itemStats?.reactions || item.reactions?.totalCount || 0
          const comments = itemStats?.comments || item.comments?.totalCount || 0
          const isHot = likes >= 10 || comments >= 5

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
              <p className="mb-4 overflow-auto whitespace-pre-wrap leading-5">
                {item.body}
              </p>

              {/* 作者信息和互动数据 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2">
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
                  <div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <i className="fa fa-calendar"></i>{' '}
                        <FormattedDate date={item.createdAt} />
                      </span>
                      <span
                        className={`flex items-center gap-1 ${isHot ? 'text-kfc-red' : ''}`}
                      >
                        <i className="fa fa-thumbs-up"></i> {likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fa fa-comment"></i> {comments}
                      </span>
                    </div>
                  </div>
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
