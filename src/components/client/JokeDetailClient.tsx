'use client'

import { useRouter } from 'next/navigation'

interface JokeDetailClientProps {
  currentJokeId: string
}

export default function JokeDetailClient({ currentJokeId }: JokeDetailClientProps) {
  const router = useRouter()

  const handleRefresh = () => {
    // 清除 URL 参数，触发服务端重新获取随机段子
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={handleRefresh}
        className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-kfc-yellow to-yellow-400 px-8 py-3 font-bold text-kfc-red shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
      >
        <i className="fa fa-refresh text-lg transition-transform duration-300 group-hover:rotate-180"></i>
        <span>换个段子乐一乐</span>
        <span className="text-sm opacity-75">(≧∇≦)</span>
      </button>
    </div>
  )
}
