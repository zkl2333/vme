import Pagination from '@/components/shared/Pagination'
import { getKfcItemsWithPagination } from '@/lib/server-utils'
import ListWithReactions from './ListWithReactions'

interface JokesListProps {
  currentPage: number
}

/**
 * 段子列表容器（服务端组件）
 * 职责：获取分页数据，渲染列表结构
 */
export default async function JokesList({ currentPage }: JokesListProps) {
  const { items, totalPages, total } = await getKfcItemsWithPagination(
    currentPage,
    10,
  )

  return (
    <section id="jokes-list" className="mb-12">
      {/* 列表标题 */}
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

      {/* 段子列表（含批量反应数据注入） */}
      <ListWithReactions items={items} />

      {/* 分页 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={total}
        pageSize={10}
      />
    </section>
  )
}
