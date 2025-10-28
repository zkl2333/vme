import JokesPagination from '../client/JokesPagination'
import { getKfcItemsWithPagination } from '@/lib/server-utils'
import JokeCard from '../client/JokeCard'

interface JokesServerProps {
  currentPage: number
}

export default async function JokesServer({ currentPage }: JokesServerProps) {
  const { items, totalPages, total } = await getKfcItemsWithPagination(
    currentPage,
    10,
  )

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
        {items.map((item) => (
          <JokeCard 
            key={item.id}
            item={item}
            // 将静态reactions数据作为初始值传递
            initialReactionDetails={[]}
            initialReactionNodes={[]}
          />
        ))}
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
