import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import Image from 'next/image'
import clsx from 'clsx'
import { Analytics } from '@vercel/analytics/next'

import { Providers } from '@/app/providers'
import LoginButton from '@/components/client/LoginButton'

import '@/styles/tailwind.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const monaSans = localFont({
  src: '../fonts/Mona-Sans.var.woff2',
  display: 'swap',
  variable: '--font-mona-sans',
  weight: '200 900',
})

export const metadata: Metadata = {
  title: '肯德基疯狂星期四段子收集站 | 今天你v50了吗？',
  description:
    '肯德基疯狂星期四的精髓，不止于炸鸡，更在于每一个让你笑出腹肌的段子。收录最搞笑的疯狂星期四段子。',
  keywords: '肯德基,疯狂星期四,段子,v50,KFC,搞笑,文案',
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh-CN"
      className={clsx('h-full antialiased', inter.variable, monaSans.variable)}
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-kfc-pattern flex min-h-screen flex-col bg-kfc-cream font-kfc text-gray-800">
        <Providers>
          {/* 顶部导航栏 */}
          <header className="sticky top-0 z-50 bg-kfc-red text-white shadow-md transition-all duration-300">
            <div className="container mx-auto flex flex-col items-center justify-between px-4 py-3 md:flex-row">
              <div className="mb-2 flex items-center gap-3 md:mb-0">
                <Image
                  src="https://picsum.photos/seed/kfcicon/50/50"
                  alt="KFC"
                  width={50}
                  height={50}
                  className="h-10 w-10 animate-chicken-rotate rounded-full object-cover"
                />
                <h1 className="text-shadow-kfc text-xl font-bold md:text-2xl">
                  肯德基疯狂星期四
                  <span className="text-kfc-yellow">段子库</span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm md:flex">
                  <i className="fa fa-users text-kfc-yellow"></i>
                  <span>
                    贡献者: <span id="contributors-count">42</span>
                  </span>
                </div>
                <LoginButton />
              </div>
            </div>
          </header>

          {/* 主内容 */}
          <main className="flex flex-1 flex-col">{children}</main>

          {/* 页脚 */}
          <footer className="bg-gray-800 py-8 text-white">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex items-center gap-2">
                  <Image
                    src="https://picsum.photos/seed/kfcfooter/50/50"
                    alt="KFC"
                    width={50}
                    height={50}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="font-bold">肯德基疯狂星期四段子库</span>
                </div>

                <div className="text-center text-sm text-gray-400 md:text-right">
                  <p>本网站仅为“疯狂星期四”梗文化交流，与肯德基品牌无关联</p>
                  <p className="mt-1">
                    v50是文化，不是交易（但你真的可以v我50）
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
