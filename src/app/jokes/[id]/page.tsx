import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
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
      description: '抱歉，您访问的段子不存在或已被删除。',
    }
  }

  // 使用段子标题作为页面标题
  const pageTitle = joke.title
    ? `${joke.title} - 疯狂星期四段子库`
    : '疯狂星期四段子 - KFC 段子库'

  // 生成描述：使用段子内容前 150 字符
  const description = joke.body.length > 150
    ? joke.body.slice(0, 150) + '...'
    : joke.body

  // 生成关键词
  const keywords = `疯狂星期四,KFC段子,${joke.author.username},搞笑段子,文案`

  return {
    title: pageTitle,
    description,
    keywords,
    authors: [{ name: joke.author.username, url: joke.author.url }],
    openGraph: {
      title: joke.title || '疯狂星期四段子',
      description,
      type: 'article',
      authors: [joke.author.username],
      publishedTime: joke.createdAt,
      modifiedTime: joke.updatedAt,
    },
    twitter: {
      card: 'summary',
      title: joke.title || '疯狂星期四段子',
      description,
      creator: `@${joke.author.username}`,
    },
  }
}

export const revalidate = 3600 // 1小时重新验证一次

export default async function JokeDetailPage({ params }: PageProps) {
  const items = await getAllKfcItems()
  const joke = items.find((item) => item.id === params.id)

  if (!joke) {
    notFound()
  }

  // 获取用户登录状态
  const session = await getServerSession(authOptions)
  const isAuthenticated = !!session?.user

  // 计算热门状态
  const totalReactions = joke.reactions?.totalCount || 0
  const isHot = totalReactions >= 10

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <a
          href="/jokes"
          className="group inline-flex items-center text-sm font-medium text-gray-500 transition-colors duration-300 hover:text-kfc-red"
        >
          <i className="fa fa-arrow-left mr-2 transition-transform duration-300 group-hover:-translate-x-1"></i>
          <span>返回文案库</span>
        </a>
      </div>

      {/* 段子详情卡片 */}
      <div className="mx-auto max-w-4xl">
        <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* 装饰背景 - 移动端隐藏避免溢出 */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 hidden h-32 w-32 rounded-full bg-kfc-yellow/10 md:block"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 hidden h-24 w-24 rounded-full bg-kfc-red/10 md:block"></div>

          {/* 热门标签 - 优化移动端位置 */}
          {isHot && (
            <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-kfc-red to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg md:right-4 md:top-4 md:gap-2 md:px-4 md:py-2 md:text-sm">
              <i className="fa fa-fire"></i>
              <span>热门</span>
            </div>
          )}

          <div className="relative z-10 p-5 md:p-8 lg:p-12">
            {/* 段子内容 */}
            <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl">📝</span>
              <h1 className="text-xl font-bold text-gray-800 md:text-2xl">文案内容</h1>
            </div>

              <div className="group relative">
                <div className="min-h-[120px] rounded-lg border-l-4 border-kfc-yellow bg-gray-50/50 px-4 py-3 text-base leading-relaxed transition-colors duration-300 group-hover:bg-gray-50 md:px-6 md:py-4 md:text-lg lg:text-xl">
                  <p className="whitespace-pre-wrap">{joke.body}</p>
                </div>
                <div className="mt-3 flex justify-end md:mt-4">
                  <CopyButton text={joke.body} />
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="my-6 border-t border-gray-200 md:my-8"></div>

            {/* 作者信息 */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 md:mb-4">
                <i className="fa fa-user text-lg text-kfc-red md:text-xl"></i>
                <h2 className="text-lg font-bold text-gray-800 md:text-xl">文案鬼才</h2>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 md:gap-4 md:p-4">
                <div className="relative">
                  <Image
                    src={joke.author.avatarUrl}
                    alt={`${joke.author.username}的头像`}
                    width={64}
                    height={64}
                    className="h-12 w-12 rounded-full border-2 border-kfc-yellow shadow-md transition-transform duration-300 hover:scale-110 md:h-16 md:w-16 md:border-4"
                  />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 md:h-5 md:w-5"></div>
                </div>

                <div className="flex-1">
                  <div className="mb-1 text-base font-semibold text-gray-900 md:text-lg">
                    @{joke.author.username}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 md:text-sm">
                    <i className="fa fa-calendar"></i>
                    <span>发布于</span>
                    <FormattedDate date={joke.createdAt} />
                  </div>
                </div>
              </div>
            </div>

            {/* 互动区域 - 仅登录用户显示 */}
            {isAuthenticated && (
              <>
                {/* 分隔线 */}
                <div className="my-6 border-t border-gray-200 md:my-8"></div>

                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2 md:mb-4">
                    <i className="fa fa-heart text-lg text-kfc-red md:text-xl"></i>
                    <h2 className="text-lg font-bold text-gray-800 md:text-xl">互动反馈</h2>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 md:p-4">
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
              </>
            )}
          </div>
        </article>

        {/* 底部操作按钮 - 优化移动端布局 */}
        <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row md:justify-center md:gap-4">
        <a
          href="/jokes"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-gray-800 shadow-kfc transition-all duration-300 hover:bg-gray-50 hover:shadow-xl hover:text-kfc-red"
        >
          <span>再来一条</span>
          <i className="fa fa-arrow-right"></i>
        </a>

          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-kfc-red bg-white px-6 py-3 font-bold text-kfc-red transition-all duration-300 hover:bg-kfc-red hover:text-white hover:shadow-lg"
          >
            <i className="fa fa-home"></i>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

