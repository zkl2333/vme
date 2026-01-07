import { FormattedDate } from '@/components/shared/FormattedDate'
import Image from 'next/image'
import CopyButton from '@/components/shared/CopyButton'
import InteractiveReactions from '@/components/reactions/Interactive'
import RefreshJokeButton from './RefreshJokeButton'
import { getAllKfcItems } from '@/lib/server-utils'

interface JokeDetailProps {
  jokeId: string
}

/**
 * 段子详情组件（服务端）
 * 职责：展示单个段子的完整信息
 */
export default async function JokeDetail({ jokeId }: JokeDetailProps) {
  // 从所有段子中查找指定 ID 的段子
  const allJokes = await getAllKfcItems()
  const joke = allJokes.find((item) => item.id === jokeId)

  if (!joke) {
    return (
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4 text-4xl">😵</div>
            <p className="text-lg">找不到这个段子</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <div className="relative border-4 border-black bg-white p-6 shadow-neo-xl md:p-10 lg:p-12">
        {/* 背景装饰图案 */}
        <div className="absolute inset-0 z-0 opacity-5 bg-halftone pointer-events-none"></div>

        <div className="relative z-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-block -rotate-2 border-2 border-black bg-kfc-red px-4 py-1 text-sm font-black uppercase italic text-white shadow-neo-sm">
              Today&apos;s Special / 今日主打
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter text-black md:text-3xl">
              周四限定 <span className="text-kfc-red underline">文案鬼才</span>
            </h2>
          </div>

          {/* 段子内容 - 极致粗犷 */}
          <div className="mb-10">
            <div className="border-3 border-black bg-kfc-cream p-6 shadow-neo md:p-8">
              <p className="text-2xl font-black italic leading-tight text-black md:text-4xl lg:text-5xl">
                “{joke.body}”
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <CopyButton text={joke.body} />
            </div>
          </div>

          {/* 作者信息 - 标签风格 */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-t-4 border-black pt-8">
            <div className="flex items-center gap-4">
              <div className="border-3 border-black bg-white p-1 shadow-neo-sm">
                <Image
                  src={joke.author.avatarUrl}
                  alt="用户头像"
                  width={64}
                  height={64}
                  className="h-14 w-14 object-cover md:h-20 md:w-20"
                />
              </div>
              <div className="flex flex-col leading-none">
                <div className="text-xl font-black uppercase italic text-black md:text-2xl">
                  Creator: <span className="text-kfc-red">@{joke.author.username}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase text-gray-500 md:text-sm">
                  <i className="fa fa-calendar text-black"></i>
                  <FormattedDate date={joke.createdAt} />
                </div>
              </div>
            </div>

            {/* Reactions 区域 */}
            <div className="flex items-center gap-4">
              <InteractiveReactions
                issueId={joke.id}
                className="flex-wrap"
              />
            </div>
          </div>

          {/* 客户端交互按钮 */}
          <div className="flex justify-center">
            <RefreshJokeButton currentJokeId={joke.id} />
          </div>
        </div>
      </div>
    </section>
  )
}
