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
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc transition-all duration-300 hover:shadow-xl md:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gradient-to-r from-kfc-red to-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
                今日推荐
              </span>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                让你笑到拍桌的段子
              </h2>
            </div>
          </div>

          {/* 段子内容 */}
          <div className="mb-6 group">
            <div className="min-h-[120px] whitespace-pre-wrap border-l-4 border-kfc-yellow px-4 py-2 text-lg leading-relaxed md:text-xl bg-gray-50/50 rounded-r-lg transition-colors duration-300 group-hover:bg-gray-50">
              {joke.body}
            </div>
            <div className="mt-3 flex justify-end">
              <CopyButton text={joke.body} />
            </div>
          </div>

          {/* 作者信息和互动数据 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={joke.author.avatarUrl}
                  alt="用户头像"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border-3 border-kfc-yellow shadow-sm transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  贡献者:{' '}
                  <span className="text-kfc-red hover:text-orange-500 transition-colors duration-300">
                    @{joke.author.username}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <i className="fa fa-calendar text-xs"></i>
                  <FormattedDate date={joke.createdAt} />
                </div>
              </div>
            </div>

            {/* Reactions 区域 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <InteractiveReactions
                  issueId={joke.id}
                  className="flex-wrap"
                />
              </div>
            </div>
          </div>

          {/* 客户端交互按钮 */}
          <RefreshJokeButton currentJokeId={joke.id} />
        </div>
      </div>
    </section>
  )
}
