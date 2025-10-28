import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-kfc-red text-white">
      <div className="container mx-auto px-4 py-8">
        {/* 主要内容区域 */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo 和品牌 */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.jpg"
              alt="KFC"
              width={50}
              height={50}
              className="h-12 w-12 rounded-full ring-2 ring-white/30 transition-all duration-300 hover:scale-110 hover:ring-white/50"
            />
            <div>
              <h3 className="text-lg font-black">肯德基疯狂星期四</h3>
              <p className="text-xs text-kfc-yellow">
                让快乐传递 <span className="inline-block">🍗</span>
              </p>
            </div>
          </div>

          {/* 导航链接 */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a
              href="/"
              className="transition-colors duration-300 hover:text-kfc-yellow"
            >
              首页
            </a>
            <a
              href="/jokes"
              className="transition-colors duration-300 hover:text-kfc-yellow"
            >
              段子列表
            </a>
            <a
              href="/leaderboard"
              className="transition-colors duration-300 hover:text-kfc-yellow"
            >
              排行榜
            </a>
            <a
              href="/submit"
              className="transition-colors duration-300 hover:text-kfc-yellow"
            >
              提交段子
            </a>
            <a
              href="/status"
              className="transition-colors duration-300 hover:text-kfc-yellow"
            >
              状态
            </a>
          </nav>
        </div>

        {/* 分隔线 */}
        <div className="my-6 h-px bg-white/20"></div>

        {/* 底部信息 */}
        <div className="flex flex-col items-center justify-between gap-3 text-center text-sm md:flex-row md:text-left">
          <div className="text-white/80">
            <p>© {currentYear} 疯狂星期四段子库</p>
            <p className="mt-1 text-xs text-white/60">
              本网站仅为梗文化交流，与肯德基品牌无关联
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="font-medium text-kfc-yellow">
              v50是文化，不是交易
            </p>
            <p className="text-xs text-white/60">（但你真的可以v我50）</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

