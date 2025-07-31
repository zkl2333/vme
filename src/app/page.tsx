'use client'

import { IKfcItem } from './lib/utils'
import { useEffect, useState, useCallback } from 'react'
import { FormattedDate } from '@/components/FormattedDate'
import Image from 'next/image'

interface JokeDisplayItem {
  content: string
  author: string
  avatar: string
  date: string
  likes: number
  comments: number
}

export default function Page() {
  const [kfcItems, setKfcItems] = useState<IKfcItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [randomJoke, setRandomJoke] = useState<JokeDisplayItem | null>(null)
  const [contributorsCount, setContributorsCount] = useState(42)

  // 将IKfcItem转换为JokeDisplayItem的辅助函数
  const convertToJokeDisplay = useCallback(
    (item: IKfcItem): JokeDisplayItem => {
      return {
        content: item.body,
        author: `@${item.author.username}`,
        avatar: item.author.avatarUrl,
        date: new Date(item.createdAt).toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
        }),
        likes: Math.floor(Math.random() * 500) + 50, // 模拟点赞数
        comments: Math.floor(Math.random() * 50) + 5, // 模拟评论数
      }
    },
    [],
  )

  const loadMoreItems = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/items/page?page=${page}&pageSize=10`)
      const data = await response.json()

      if (page === 1) {
        setKfcItems(data.items)
      } else {
        setKfcItems((prev) => [...prev, ...data.items])
      }

      setTotalPages(data.totalPages)
      setTotalItems(data.total)
      setHasMore(page < data.totalPages)
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore])

  // 获取随机段子
  const getRandomJoke = useCallback(async () => {
    try {
      const response = await fetch('/api/random')
      const randomItem = await response.json()
      setRandomJoke(convertToJokeDisplay(randomItem))
    } catch (error) {
      console.error('获取随机段子失败:', error)
    }
  }, [convertToJokeDisplay])

  // 初始化数据加载
  useEffect(() => {
    if (page === 1) {
      loadMoreItems()
      getRandomJoke()
    }
  }, [loadMoreItems, getRandomJoke, page])

  // 贡献者数量动画
  useEffect(() => {
    let count = 0
    const targetCount = 42
    const interval = setInterval(() => {
      count++
      setContributorsCount(count)
      if (count >= targetCount) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const handleNewJoke = () => {
    getRandomJoke()
  }

  return (
    <div className="bg-kfc-pattern min-h-screen bg-kfc-cream font-kfc text-gray-800">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-kfc-red text-white shadow-md transition-all duration-300">
        <div className="container mx-auto flex flex-col items-center justify-between px-4 py-3 md:flex-row">
          <div className="mb-2 flex items-center gap-3 md:mb-0">
            <Image
              src="https://picsum.photos/seed/kfcicon/50/50"
              alt="KFC"
              width={40}
              height={40}
              className="h-10 w-10 animate-chicken-rotate rounded-full object-cover"
            />
            <h1 className="text-shadow-kfc text-xl font-bold md:text-2xl">
              肯德基疯狂星期四<span className="text-kfc-yellow">段子库</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm md:flex">
              <i className="fa fa-users text-kfc-yellow"></i>
              <span>
                贡献者: <span>{contributorsCount}</span>
              </span>
            </div>
            <span className="animate-pulse-soft rounded-full bg-kfc-yellow px-2 py-1 text-xs font-bold text-kfc-red md:text-sm">
              v50文化发源地
            </span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 顶部Banner */}
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
                    href="#submit-joke"
                    className="flex items-center gap-1 rounded-full bg-kfc-yellow px-4 py-2 font-bold text-kfc-red transition-colors duration-300 hover:brightness-110"
                  >
                    <i className="fa fa-pencil"></i> 写段子
                  </a>
                </div>
              </div>
              <div className="relative w-full max-w-xs animate-float-effect">
                <Image
                  src="https://picsum.photos/seed/kfcbucket/300/300"
                  alt="肯德基炸鸡桶"
                  width={300}
                  height={300}
                  className="w-full rounded-xl shadow-lg"
                />
                <div className="absolute -bottom-3 -right-3 rounded-full bg-kfc-yellow px-3 py-1 text-sm font-bold text-kfc-red shadow-lg">
                  每周四更新
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 随机段子展示区 */}
        {randomJoke && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc md:p-8">
              {/* 装饰元素 */}
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

                <div className="mb-6 min-h-[120px] border-l-4 border-kfc-yellow px-1 text-lg leading-relaxed md:text-xl">
                  {randomJoke.content}
                </div>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={randomJoke.avatar}
                      alt="用户头像"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-kfc-yellow"
                    />
                    <div>
                      <div className="font-medium">
                        贡献者:{' '}
                        <span className="text-kfc-red">
                          {randomJoke.author}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {randomJoke.date} · {randomJoke.likes}人笑了
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-gray-500 transition-colors hover:text-kfc-red">
                      <i className="fa fa-thumbs-up"></i>{' '}
                      <span>{randomJoke.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 transition-colors hover:text-kfc-red">
                      <i className="fa fa-comment"></i>{' '}
                      <span>{randomJoke.comments}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleNewJoke}
                  className="flex items-center gap-2 rounded-full bg-kfc-yellow px-6 py-2 font-bold text-kfc-red shadow-md transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg"
                >
                  <i className="fa fa-refresh"></i> 换个段子乐一乐
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 段子列表 */}
        <section id="jokes-list" className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <i className="fa fa-book text-kfc-red"></i> 段子总库
            </h2>
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm shadow-sm">
              <span>
                共收录:{' '}
                <span className="font-bold text-kfc-red">{totalItems}</span>{' '}
                个段子
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {kfcItems.map((item, index) => {
              const jokeDisplay = convertToJokeDisplay(item)
              const isHot = index < 3 // 前3个标记为热门

              return (
                <div
                  key={item.id}
                  className={`rounded-xl bg-white p-5 shadow-md transition-shadow duration-300 hover:shadow-kfc ${
                    isHot ? 'relative border-l-4 border-kfc-yellow' : ''
                  }`}
                >
                  {isHot && (
                    <div className="absolute -left-2 -top-2 rounded bg-kfc-yellow px-2 py-0.5 text-xs font-bold text-kfc-red">
                      热门
                    </div>
                  )}
                  <p className="mb-4">{item.body}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={item.author.avatarUrl}
                        alt="用户头像"
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="text-sm text-gray-700">
                        @{item.author.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <i className="fa fa-calendar"></i>
                        <FormattedDate date={item.createdAt} />
                      </span>
                      <span
                        className={`flex items-center gap-1 ${isHot ? 'text-kfc-red' : ''}`}
                      >
                        <i className="fa fa-thumbs-up"></i> {jokeDisplay.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fa fa-share"></i> {jokeDisplay.comments}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 加载更多按钮 */}
          <div className="mt-6 flex justify-center">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-kfc-red border-t-transparent"></div>
                <span className="ml-2">加载中...</span>
              </div>
            ) : hasMore ? (
              <button
                onClick={loadMoreItems}
                className="rounded-full bg-kfc-red px-6 py-3 font-bold text-white shadow-kfc transition-all duration-300 hover:bg-kfc-darkRed hover:shadow-kfc-hover"
              >
                加载更多段子 ({page - 1}/{totalPages})
              </button>
            ) : (
              <span className="block py-4 text-gray-500">
                已经到底了，去写个段子吧！
              </span>
            )}
          </div>
        </section>

        {/* 贡献者排行 */}
        <section className="mb-12">
          <div className="rounded-2xl bg-white p-6 shadow-kfc">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold md:text-2xl">
              <i className="fa fa-crown text-kfc-yellow"></i> 梗王排行榜
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Top 3 */}
              <div className="flex flex-col items-center rounded-xl border border-yellow-100 bg-gradient-to-b from-yellow-50 to-white p-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-kfc-yellow font-bold text-white">
                  1
                </div>
                <Image
                  src="https://picsum.photos/seed/king1/80/80"
                  alt="梗王头像"
                  width={64}
                  height={64}
                  className="mb-3 h-16 w-16 rounded-full border-2 border-kfc-yellow"
                />
                <h3 className="mb-1 font-bold">@v50专业户</h3>
                <p className="mb-2 text-sm text-gray-500">发布 42 个段子</p>
                <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-800">
                  累计获赞 2.3k
                </div>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 font-bold text-white">
                  2
                </div>
                <Image
                  src="https://picsum.photos/seed/king2/80/80"
                  alt="梗王头像"
                  width={64}
                  height={64}
                  className="mb-3 h-16 w-16 rounded-full border-2 border-gray-200"
                />
                <h3 className="mb-1 font-bold">@肯德基野生代言人</h3>
                <p className="mb-2 text-sm text-gray-500">发布 36 个段子</p>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  累计获赞 1.8k
                </div>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 font-bold text-white">
                  3
                </div>
                <Image
                  src="https://picsum.photos/seed/king3/80/80"
                  alt="梗王头像"
                  width={64}
                  height={64}
                  className="mb-3 h-16 w-16 rounded-full border-2 border-orange-300"
                />
                <h3 className="mb-1 font-bold">@周四不v50会死星人</h3>
                <p className="mb-2 text-sm text-gray-500">发布 29 个段子</p>
                <div className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                  累计获赞 1.5k
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 提交段子区 */}
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
                  href="https://github.com/yourusername/yourrepo/issues/new"
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
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="https://picsum.photos/seed/kfcfooter/50/50"
                alt="KFC"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
              <span className="font-bold">肯德基疯狂星期四段子库</span>
            </div>

            <div className="text-center text-sm text-gray-400 md:text-right">
              <p>
                本网站仅为&quot;疯狂星期四&quot;梗文化交流，与肯德基品牌无关联
              </p>
              <p className="mt-1">v50是文化，不是交易（但你真的可以v我50）</p>
            </div>
          </div>
        </div>
      </footer>

      {/* 悬浮提示 */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="cursor-pointer rounded-full bg-white p-3 shadow-kfc transition-shadow duration-300 hover:shadow-kfc-hover">
          <span className="text-sm font-bold text-kfc-red">v我50看更多</span>
        </div>
      </div>
    </div>
  )
}
