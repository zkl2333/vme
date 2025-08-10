import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'
import { getIssueStats } from '@/app/lib/github-stats'
import { getRandomKfcItem, getOctokitInstance } from '@/lib/server-utils'
// import ReactionsDisplay from '../ReactionsDisplay'

export default async function RandomJokeServer() {
  // 如果没有传入随机段子，则获取一个
  const joke = await getRandomKfcItem()

  if (!joke) {
    return (
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded bg-kfc-red px-2 py-1 text-xs text-white">
                今日推荐
              </span>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                让你笑到拍桌的段子
              </h2>
            </div>
            <div className="text-center text-gray-500">
              <i className="fa fa-exclamation-circle mb-4 text-4xl"></i>
              <p>暂时无法获取随机段子，请稍后再试</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 获取统计数据 - 优先使用用户权限
  const octokit = await getOctokitInstance()
  const stats = await getIssueStats(octokit, joke.id)
  const interactions = stats.reactions
  const reactionDetails = stats.reactionDetails || []

  return (
    <section className="mb-12">
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>
        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-2">
            <span className="rounded bg-kfc-red px-2 py-1 text-xs text-white">
              今日推荐
            </span>
            <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
              让你笑到拍桌的段子
            </h2>
          </div>

          <div className="mb-6 min-h-[120px] whitespace-pre-wrap border-l-4 border-kfc-yellow px-1 text-lg leading-relaxed md:text-xl">
            {joke.body}
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src={joke.author.avatarUrl}
                alt="用户头像"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-kfc-yellow"
              />
              <div>
                <div className="font-medium">
                  贡献者:{' '}
                  <span className="text-kfc-red">@{joke.author.username}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <FormattedDate date={joke.createdAt} /> · {interactions}次互动
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* <ReactionsDisplay
                reactionDetails={reactionDetails}
                totalInteractions={interactions}
              /> */}
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-full bg-kfc-yellow px-6 py-2 font-bold text-kfc-red shadow-md transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg">
            <i className="fa fa-refresh"></i>
            换个段子乐一乐
          </button>
        </div>
      </div>
    </section>
  )
}
