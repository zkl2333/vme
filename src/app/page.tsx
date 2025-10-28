import Image from 'next/image'
import JokeDetail from '@/components/jokes/Detail'
import { getAllKfcItems, getRandomKfcItem } from '@/lib/server-utils'
import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: {
    joke?: string
  }
}

export default async function Page({ searchParams }: PageProps) {
  // 如果没有提供 joke 参数，获取随机段子并重定向
  if (!searchParams.joke) {
    const randomJoke = await getRandomKfcItem()
    redirect(`/?joke=${randomJoke.id}`)
  }

  // 验证 jokeId 是否存在
  const allJokes = await getAllKfcItems()
  const jokeExists = allJokes.some((item) => item.id === searchParams.joke)

  // 如果 joke ID 不存在，获取随机段子并重定向
  if (!jokeExists) {
    const randomJoke = await getRandomKfcItem()
    redirect(`/?joke=${randomJoke.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* 随机段子主题区域 */}
      <div className="mb-8 md:mb-10">
        {/* 页面标题 */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 md:mb-3">
            <span className="text-2xl md:text-3xl">🎲</span>
            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl">
              今日份快乐
            </h1>
            <span className="text-2xl md:text-3xl">🍗</span>
          </div>
          <p className="text-base text-gray-600 md:text-lg">
            来点不一样的？这个段子专治不开心
          </p>
        </div>

        {/* 段子展示 */}
        <div className="mb-6">
          <JokeDetail jokeId={searchParams.joke} />
        </div>
      </div>

      {/* 功能导航卡片 */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* 段子列表卡片 */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-kfc transition-all duration-300 hover:shadow-kfc-hover md:p-6">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 hidden h-32 w-32 rounded-full bg-kfc-red/10 transition-all duration-300 group-hover:bg-kfc-red/20 md:block"></div>
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-3 md:mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kfc-red text-white md:h-12 md:w-12">
                <i className="fa fa-list text-lg md:text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 md:text-xl">段子列表</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600 md:text-base">
              浏览所有精选的疯狂星期四段子，按时间排序，找到让你笑出声的梗
            </p>
            <a
              href="/jokes"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-kfc-red px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-kfc-darkRed"
            >
              开始浏览
              <i className="fa fa-arrow-right"></i>
            </a>
          </div>
        </div>

        {/* 排行榜卡片 */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-kfc transition-all duration-300 hover:shadow-kfc-hover md:p-6">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 hidden h-32 w-32 rounded-full bg-kfc-red/10 transition-all duration-300 group-hover:bg-kfc-red/20 md:block"></div>
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-3 md:mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kfc-red text-white md:h-12 md:w-12">
                <i className="fa fa-trophy text-lg md:text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 md:text-xl">梗王排行榜</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600 md:text-base">
              看看谁是真正的梗王，谁的段子最受欢迎，谁最会v50
            </p>
            <a
              href="/leaderboard"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-kfc-red px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-kfc-darkRed"
            >
              查看排行
              <i className="fa fa-crown"></i>
            </a>
          </div>
        </div>
      </div>

      {/* 提交段子区（强化参与引导） */}
      <section id="submit-joke" className="mt-8 md:mt-12">
        <div className="relative overflow-hidden rounded-2xl shadow-kfc">
          <div className="absolute right-0 top-0 hidden h-full w-1/3 opacity-10 md:block">
            <Image
              src="https://picsum.photos/seed/kfcbg/400/400"
              alt=""
              width={400}
              height={400}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-kfc-red to-kfc-darkRed p-4 text-white md:p-6 lg:p-8">
            <div className="max-w-xl">
              <h2 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl lg:text-3xl">
                成为下一个梗王
              </h2>
              <p className="mb-4 text-sm text-white/90 md:mb-6 md:text-base">
                分享你的疯狂星期四段子，让全网为你笑出声，说不定还能收获一群愿意v你50的朋友
              </p>

              <a
                href="/submit"
                className="shine-effect flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-base font-bold text-kfc-red shadow-lg transition-all duration-300 hover:shadow-xl md:px-6 md:py-3 md:text-lg"
              >
                <i className="fa fa-paper-plane"></i> 提交我的段子
              </a>

              <div className="mt-4 flex items-center gap-2 text-xs md:mt-6 md:text-sm">
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
