import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-4 border-black bg-black text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 主要内容区域 */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
          {/* Logo 和品牌 */}
          <div className="flex items-center gap-4">
            <div className="border-2 border-white bg-black p-1">
              <Image
                src="/images/logo.jpg"
                alt="KFC"
                width={50}
                height={50}
                className="h-10 w-10 object-cover md:h-12 md:w-12"
              />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter text-white md:text-2xl">
                CRAZY THURSDAY
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                Official Meme Headquarters
              </p>
            </div>
          </div>

          {/* 导航链接 */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider md:gap-8 md:text-sm">
            {['首页', '文案库', '英雄榜', '我要投稿', '状态'].map((item, index) => {
               const hrefs = ['/', '/jokes', '/leaderboard', '/submit', '/status'];
               return (
                <a
                  key={item}
                  href={hrefs[index]}
                  className="border-b-2 border-transparent hover:border-kfc-yellow hover:text-kfc-yellow transition-all"
                >
                  {item}
                </a>
               )
            })}
          </nav>
        </div>

        {/* 分隔线 */}
        <div className="my-6 h-0.5 bg-white/20 md:my-8"></div>

        {/* 底部信息 */}
        <div className="flex flex-col items-center justify-between gap-4 text-center text-xs md:flex-row md:text-left md:text-sm">
          <div className="font-bold text-white/60">
            <p>© {currentYear} 疯狂星期四文案大赏. All Rights Reserved.</p>
            <p className="mt-1 text-[10px] uppercase">
              Not affiliated with KFC Corporation. Just for fun & memes.
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-base font-black italic text-kfc-yellow md:text-lg">
              &quot;V ME 50 IS A LIFESTYLE&quot;
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

