import { IconLink } from '@/components/IconLink'
import StarField from '@/components/submit/StarField'

export default function NotFound() {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden bg-gray-950 text-center">
      {/* 背景渐变效果 */}
      <svg
        aria-hidden="true"
        className="absolute left-1/2 top-[-10vh] -z-10 h-[120vh] w-[120vw] min-w-[60rem] -translate-x-1/2"
      >
        <defs>
          <radialGradient id="gradient" cy="0%">
            <stop offset="0%" stopColor="rgba(224, 32, 32, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(255, 199, 44, 0.15)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
      </svg>
      <StarField className="sm:-mt-16" />

      {/* 404 错误内容 */}
      <div className="relative z-10 max-w-2xl px-6">
        {/* 404 数字 */}
        <p className="font-display text-6xl/tight font-light text-white md:text-8xl">
          404
        </p>

        {/* 主标题 */}
        <h1 className="mt-4 font-display text-2xl/8 font-semibold text-white md:text-3xl">
          哎呀，迷路了？
        </h1>

        {/* 副标题 */}
        <p className="mt-4 text-lg/6 text-gray-300">
          没有这个页面，要不下星期四再来看看？
        </p>

        {/* 幽默提示 */}
        <div className="mt-6 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-2xl">🍗</span>
            <span className="text-kfc-yellow font-semibold">今日份幽默</span>
            <span className="text-2xl">🍗</span>
          </div>
          <p className="text-sm text-gray-300 italic">
            “404错误就像疯狂星期四的优惠券，有时候就是找不到，但别担心，还有更多段子等着你！”
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <IconLink
            href="/"
            className="flex items-center gap-2 rounded-xl bg-kfc-red px-6 py-3 font-bold text-white shadow-kfc transition-all duration-300 hover:bg-kfc-darkRed hover:shadow-kfc-hover"
          >
            <span>🏠</span>
            回到段子首页
          </IconLink>

          <a
            href="https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title="
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-kfc-yellow px-6 py-3 font-bold text-kfc-red shadow-md transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg"
          >
            <span>✍️</span>
            写个新段子
          </a>
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-xs text-gray-400">
          <p>💡 找不到想要的段子？不如自己写一个</p>
        </div>
      </div>
    </div>
  )
}
