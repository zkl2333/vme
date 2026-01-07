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
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* 疯狂星期四海报风格 Hero */}
      <div className="relative mb-16 text-center md:mb-24">
        <div className="absolute -top-10 left-0 -rotate-12 border-2 border-black bg-white px-4 py-1 text-sm font-black uppercase shadow-neo-sm md:text-base">
          Every Thursday
        </div>
        <div className="absolute -right-5 top-0 rotate-12 border-2 border-black bg-kfc-yellow px-4 py-1 text-sm font-black uppercase shadow-neo-sm md:text-base">
          V Me 50
        </div>
        
        <h1 className="mb-6 text-6xl font-black italic tracking-tighter text-black md:text-8xl lg:text-9xl">
          疯狂<span className="text-kfc-red underline decoration-black decoration-8 underline-offset-8">星期四</span>
        </h1>
        
        <div className="mx-auto max-w-3xl border-4 border-black bg-white p-4 shadow-neo">
          <p className="text-lg font-black uppercase leading-tight md:text-2xl">
            Copy. Paste. Get v50. <br />
            在这里，炸鸡是配角，段子才是灵魂。
          </p>
        </div>
      </div>

      {/* 今日主打段子 - 伪新闻门户风 */}
      <div className="mb-20">
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-black px-4 py-1 text-lg font-black uppercase italic text-white shadow-neo-sm">
            Top Headline / 头条
          </div>
          <div className="h-1 flex-1 bg-black"></div>
        </div>
        <JokeDetail jokeId={searchParams.joke} />
      </div>

      {/* 功能导航 - 模块化网格 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="group border-3 border-black bg-white p-6 shadow-neo transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-kfc-red text-white shadow-neo-sm">
            <i className="fa fa-list text-2xl"></i>
          </div>
          <h3 className="mb-2 text-2xl font-black uppercase italic">文案仓库</h3>
          <p className="mb-6 font-bold text-gray-600">历年疯四文案大赏，总有一条能骗到v50</p>
          <a
            href="/jokes"
            className="inline-block border-2 border-black bg-black px-6 py-2 text-lg font-black uppercase italic text-white shadow-neo-sm transition-all hover:bg-kfc-red"
          >
            Enter Gallery
          </a>
        </div>

        <div className="group border-3 border-black bg-white p-6 shadow-neo transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-kfc-yellow text-black shadow-neo-sm">
            <i className="fa fa-trophy text-2xl"></i>
          </div>
          <h3 className="mb-2 text-2xl font-black uppercase italic">V50 英雄榜</h3>
          <p className="mb-6 font-bold text-gray-600">谁的文案最能打？谁是疯四之王？</p>
          <a
            href="/leaderboard"
            className="inline-block border-2 border-black bg-black px-6 py-2 text-lg font-black uppercase italic text-white shadow-neo-sm transition-all hover:bg-kfc-yellow hover:text-black"
          >
            Check Ranking
          </a>
        </div>
      </div>

      {/* 提交段子区 - 极致疯狂风格 */}
      <section id="submit-joke" className="mt-16 md:mt-24">
        <div className="relative border-4 border-black bg-kfc-red p-8 shadow-neo-xl md:p-12 lg:p-16">
          <div className="absolute -left-6 -top-6 hidden rotate-12 border-2 border-black bg-kfc-yellow px-6 py-2 text-xl font-black uppercase italic text-black shadow-neo-sm md:block">
            We Need You!
          </div>
          
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-black italic uppercase text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] md:text-6xl">
              我要投稿 / SUBMIT
            </h2>
            <p className="mb-10 text-lg font-bold text-white md:text-xl">
              把你的私藏文案交出来，造福广大疯四信徒。越离谱，越容易被推荐！
            </p>

            <a
              href="/submit"
              className="inline-block border-4 border-black bg-white px-10 py-4 text-2xl font-black uppercase italic text-black shadow-neo transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-kfc-yellow hover:shadow-none"
            >
              Upload Now!
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
