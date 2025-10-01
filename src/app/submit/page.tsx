import { SubmitJoke } from '@/components/client/SubmitJoke'
import { StarField } from '@/components/client/StarField'

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      <StarField />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            提交我的疯狂星期四段子
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            分享你的创意段子，让更多人感受疯狂星期四的快乐！
          </p>
        </div>

        <SubmitJoke />

        <div className="mt-12 text-center">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-bold text-gray-800 mb-2">原创内容</h3>
              <p className="text-sm text-gray-600">
                鼓励原创，让每一个文案都充满个人色彩和创意
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-800 mb-2">快速审核</h3>
              <p className="text-sm text-gray-600">
                提交后会自动进入审核流程，通过后即可在网站展示
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-bold text-gray-800 mb-2">获得认可</h3>
              <p className="text-sm text-gray-600">
                优质文案会获得更多点赞，还能在排行榜上展示
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            所有提交的文案将通过 GitHub Issues 管理，确保透明度和可追溯性
          </p>
        </div>
      </div>
    </div>
  )
}