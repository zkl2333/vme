import Image from 'next/image'
import RandomJoke from '@/components/client/RandomJoke'

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 随机段子主题区域 */}
      <div className="mb-10">
                 {/* 页面标题 */}
         <div className="mb-6 text-center">
           <div className="mb-3 flex items-center justify-center gap-2">
             <span className="text-3xl">🎲</span>
             <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
               今日份快乐
             </h1>
             <span className="text-3xl">🍗</span>
           </div>
           <p className="text-lg text-gray-600">
             来点不一样的？这个段子专治不开心
           </p>
         </div>

                 {/* 随机段子展示 */}
         <div className="mb-6">
           <RandomJoke />
         </div>
      </div>

             {/* 功能导航卡片 */}
       <div className="grid gap-6 md:grid-cols-2">
         {/* 段子列表卡片 */}
         <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc transition-all duration-300 hover:shadow-kfc-hover">
           <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-red/10 transition-all duration-300 group-hover:bg-kfc-red/20"></div>
           <div className="relative z-10">
             <div className="mb-4 flex items-center gap-3">
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kfc-red text-white">
                 <i className="fa fa-list text-xl"></i>
               </div>
               <h3 className="text-xl font-bold text-gray-800">段子列表</h3>
             </div>
             <p className="mb-4 text-gray-600">
               浏览所有精选的疯狂星期四段子，按时间排序，找到让你笑出声的梗
             </p>
             <a
               href="/jokes"
               className="inline-flex items-center gap-2 rounded-xl bg-kfc-red px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-kfc-darkRed"
             >
               开始浏览
               <i className="fa fa-arrow-right"></i>
             </a>
           </div>
         </div>

         {/* 排行榜卡片 */}
         <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-kfc transition-all duration-300 hover:shadow-kfc-hover">
           <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-kfc-red/10 transition-all duration-300 group-hover:bg-kfc-red/20"></div>
           <div className="relative z-10">
             <div className="mb-4 flex items-center gap-3">
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kfc-red text-white">
                 <i className="fa fa-trophy text-xl"></i>
               </div>
               <h3 className="text-xl font-bold text-gray-800">梗王排行榜</h3>
             </div>
             <p className="mb-4 text-gray-600">
               看看谁是真正的梗王，谁的段子最受欢迎，谁最会v50
             </p>
             <a
               href="/leaderboard"
               className="inline-flex items-center gap-2 rounded-xl bg-kfc-red px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-kfc-darkRed"
             >
               查看排行
               <i className="fa fa-crown"></i>
             </a>
           </div>
         </div>
       </div>

      {/* 提交段子区（强化参与引导） */}
      <section id="submit-joke" className="mt-12">
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
                href="https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title="
                target="_blank"
                className="shine-effect flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-lg font-bold text-kfc-red shadow-lg transition-all duration-300 hover:shadow-xl"
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
    </div>
  )
}
