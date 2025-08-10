import { Suspense } from 'react'
import Image from 'next/image'
import LeaderboardServer from '@/components/server/Leaderboard'
import RandomJoke from '@/components/RandomJoke'
import JokesServer from '@/components/server/Jokes'

// 获取URL参数的类型定义
interface PageProps {
  searchParams: {
    sortBy?: string
    page?: string
  }
}

// 启用ISR - 每30分钟重新生成页面，包含排行榜数据
export const revalidate = 1800 // 30分钟重新验证，用于排行榜数据

export default async function Page({ searchParams }: PageProps) {
  // 从URL参数获取页码和排序方式
  const page = parseInt(searchParams.page || '1')
  const sortBy = searchParams.sortBy || 'score'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 顶部Banner（强化梗氛围） */}
      <div className="relative mb-10 overflow-hidden rounded-2xl shadow-kfc">
        <div className="bg-gradient-to-r from-kfc-red to-kfc-darkRed p-6 text-white md:p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="max-w-lg animate-slide-up">
              <h2 className="mb-3 text-2xl font-bold md:text-3xl">
                今天，你v50了吗？
              </h2>
              <p className="mb-4 text-white/90">
                肯德基疯狂星期四的精髓，不止于炸鸡，更在于每一个让你笑出腹肌的段子
              </p>
              <div className="flex gap-3">
                <a
                  href="#jokes-list"
                  className="flex items-center gap-1 rounded-full bg-white px-4 py-2 font-bold text-kfc-red transition-colors duration-300 hover:bg-kfc-cream"
                >
                  <i className="fa fa-list"></i> 看段子
                </a>
                <a
                  href="https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title="
                  target="_blank"
                  className="flex items-center gap-1 rounded-full bg-kfc-yellow px-4 py-2 font-bold text-kfc-red transition-colors duration-300 hover:brightness-110"
                >
                  <i className="fa fa-pencil"></i> 写段子
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 随机段子展示 */}
      <RandomJoke />

      {/* 段子列表 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
            <span className="ml-2 text-gray-600">加载段子中...</span>
          </div>
        }
      >
        <JokesServer currentPage={page} />
      </Suspense>

      {/* 梗王排行榜 - 服务端渲染 */}
      <section className="mb-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
              <span className="ml-2 text-gray-600">加载排行榜中...</span>
            </div>
          }
        >
          <LeaderboardServer sortBy={sortBy} />
        </Suspense>
      </section>

      {/* 提交段子区（强化参与引导） */}
      <section id="submit-joke" className="mb-12">
        <div className="relative overflow-hidden rounded-2xl shadow-kfc">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <Image
              src="https://picsum.photos/seed/kfcbg/400/400"
              alt=""
              width={400}
              height={400}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-kfc-red to-kfc-darkRed p-6 text-white md:p-8">
            <div className="max-w-xl">
              <h2 className="mb-4 text-2xl font-bold md:text-3xl">
                成为下一个梗王
              </h2>
              <p className="mb-6 text-white/90">
                分享你的疯狂星期四段子，让全网为你笑出声，说不定还能收获一群愿意v你50的朋友
              </p>

              <a
                href="https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title="
                target="_blank"
                className="shine-effect flex items-center gap-2 rounded-full bg-white px-6 py-3 text-lg font-bold text-kfc-red shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <i className="fa fa-paper-plane"></i> 提交我的段子
              </a>

              <div className="mt-6 flex items-center gap-2 text-sm">
                <i className="fa fa-lightbulb-o text-kfc-yellow"></i>
                <span>
                  提示：段子越贴近&quot;v50&quot;和&quot;疯狂星期四&quot;梗，越容易被推荐
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
