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
      <div className="mb-8 flex items-center justify-between border-b-4 border-black pb-4">
        <h2 className="flex items-center gap-2 text-2xl font-black uppercase italic text-black md:text-3xl">
          <i className="fa fa-folder-open text-kfc-red"></i> All Entries
        </h2>
        <div className="flex items-center gap-2 border-2 border-black bg-kfc-yellow px-4 py-1 shadow-neo-sm">
          <span className="text-sm font-bold uppercase text-black">
            Total: <span className="font-black">{total}</span>
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
