import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getAllKfcItems } from '@/lib/server-utils'
import { FormattedDate } from '@/components/shared/FormattedDate'
import Image from 'next/image'
import CopyButton from '@/components/shared/CopyButton'
import InteractiveReactions from '@/components/reactions/Interactive'
import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

// 生成静态参数（可选，用于优化）
export async function generateStaticParams() {
  const items = await getAllKfcItems()
  // 只为前 100 个段子生成静态页面，其他的使用 ISR
  return items.slice(0, 100).map((item) => ({
    id: item.id,
  }))
}

// 生成页面元数据
export async function generateMetadata({ params }: PageProps) {
  const items = await getAllKfcItems()
  const joke = items.find((item) => item.id === params.id)

  if (!joke) {
    return {
      title: '段子不存在 - 疯狂星期四段子库',
    }
  }

  // 截取前 100 个字符作为描述
  const description = joke.body.slice(0, 100) + (joke.body.length > 100 ? '...' : '')

  return {
    title: `${joke.author.username}的段子 - 疯狂星期四段子库`,
    description,
  }
}

export const revalidate = 3600 // 1小时重新验证一次

export default async function JokeDetailPage({ params }: PageProps) {
  const items = await getAllKfcItems()
  const joke = items.find((item) => item.id === params.id)

  if (!joke) {
    notFound()
  }

  // 计算热门状态
  const totalReactions = joke.reactions?.totalCount || 0
  const isHot = totalReactions >= 10

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link
          href="/jokes"
          className="inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-kfc-red"
        >
          <i className="fa fa-arrow-left"></i>
          <span>返回段子列表</span>
        </Link>
      </div>

      {/* 段子详情卡片 */}
      <div className="mx-auto max-w-4xl">
        <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* 装饰背景 */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-yellow/10"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-kfc-red/10"></div>

          {/* 热门标签 */}
          {isHot && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-gradient-to-r from-kfc-red to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
              <i className="fa fa-fire"></i>
              <span>热门段子</span>
            </div>
          )}

          <div className="relative z-10 p-8 md:p-12">
            {/* 段子内容 */}
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <i className="fa fa-quote-left text-2xl text-kfc-yellow"></i>
                <h1 className="text-2xl font-bold text-gray-800">段子内容</h1>
              </div>
              
              <div className="group relative">
                <div className="min-h-[120px] rounded-lg border-l-4 border-kfc-yellow bg-gray-50/50 px-6 py-4 text-lg leading-relaxed transition-colors duration-300 group-hover:bg-gray-50 md:text-xl">
                  <p className="whitespace-pre-wrap">{joke.body}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <CopyButton text={joke.body} />
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* 作者信息 */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <i className="fa fa-user text-xl text-kfc-red"></i>
                <h2 className="text-xl font-bold text-gray-800">段子贡献者</h2>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                <div className="relative">
                  <Image
                    src={joke.author.avatarUrl}
                    alt={`${joke.author.username}的头像`}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full border-4 border-kfc-yellow shadow-md transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500"></div>
                </div>
                
                <div className="flex-1">
                  <div className="mb-1 text-lg font-semibold text-gray-900">
                    @{joke.author.username}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <i className="fa fa-calendar"></i>
                    <span>发布于</span>
                    <FormattedDate date={joke.createdAt} />
                  </div>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* 互动区域 */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <i className="fa fa-heart text-xl text-kfc-red"></i>
                <h2 className="text-xl font-bold text-gray-800">互动反馈</h2>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <Suspense
                  fallback={
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
                      <span>加载互动数据中...</span>
                    </div>
                  }
                >
                  <InteractiveReactions
                    issueId={joke.id}
                    className="flex-wrap gap-2"
                  />
                </Suspense>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="rounded-lg bg-gradient-to-r from-kfc-yellow/20 to-orange-100/20 p-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-center">
                <div className="flex items-center gap-2">
                  <i className="fa fa-eye text-kfc-red"></i>
                  <span className="text-sm text-gray-600">段子ID: {joke.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa fa-thumbs-up text-kfc-red"></i>
                  <span className="text-sm text-gray-600">
                    互动总数: {totalReactions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* 底部操作按钮 */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/jokes"
            className="inline-flex items-center gap-2 rounded-xl bg-kfc-red px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-kfc-darkRed hover:shadow-lg"
          >
            <i className="fa fa-list"></i>
            浏览更多段子
          </Link>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-kfc-red bg-white px-6 py-3 font-bold text-kfc-red transition-all duration-300 hover:bg-kfc-red hover:text-white hover:shadow-lg"
          >
            <i className="fa fa-home"></i>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

