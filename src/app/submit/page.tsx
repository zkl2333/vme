import SubmitForm from '@/components/submit/Form'

export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mb-12 text-center md:mb-16">
        <h1 className="mb-6 text-5xl font-black italic tracking-tighter text-black md:text-7xl lg:text-8xl">
          上交我的<br className="md:hidden" />
          <span className="text-kfc-red underline decoration-black decoration-8 underline-offset-8">疯四文案</span>
        </h1>
        <div className="inline-block -rotate-1 border-2 border-black bg-kfc-yellow px-6 py-2 shadow-neo-sm">
          <p className="font-black uppercase text-black md:text-lg">
            SHOW ME YOUR MEMES! 别藏着掖着了，交出你的好活！
          </p>
        </div>
      </div>

      <SubmitForm />

      <div className="mt-16 text-center">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="border-3 border-black bg-white p-6 shadow-neo transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            <div className="mb-3 text-4xl">✨</div>
            <h3 className="mb-2 text-xl font-black uppercase italic text-black">原创内容 / ORIGINAL</h3>
            <p className="font-bold text-gray-700">
              鼓励原创，让每一个文案都充满个人色彩和创意。拒绝烂大街！
            </p>
          </div>
          
          <div className="border-3 border-black bg-white p-6 shadow-neo transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            <div className="mb-3 text-4xl">🚀</div>
            <h3 className="mb-2 text-xl font-black uppercase italic text-black">快速审核 / FAST REVIEW</h3>
            <p className="font-bold text-gray-700">
              提交后自动进入 GitHub 审核流程，通过后立即上架展示。
            </p>
          </div>
          
          <div className="border-3 border-black bg-white p-6 shadow-neo transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            <div className="mb-3 text-4xl">🏆</div>
            <h3 className="mb-2 text-xl font-black uppercase italic text-black">获得认可 / FAME</h3>
            <p className="font-bold text-gray-700">
              优质文案将荣登首页推荐，还能冲击英雄榜，成为文案之王！
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="font-bold uppercase text-gray-500 text-sm">
          * ALL SUBMISSIONS ARE MANAGED VIA GITHUB ISSUES FOR TRANSPARENCY
        </p>
      </div>
    </div>
  )
}