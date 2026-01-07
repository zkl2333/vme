'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

/**
 * 登录/登出按钮组件
 */
export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-kfc-yellow border-t-transparent"></div>
        <span className="text-sm text-white">加载中...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
          <Image
            src={session.user?.image || '/default-avatar.png'}
            alt="用户头像"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full border border-kfc-yellow"
          />
          <span className="max-w-[80px] truncate text-sm font-medium text-white sm:max-w-[120px]">
            {session.user?.username}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="min-h-[36px] rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          退出登录
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('github')}
      className="flex items-center gap-2 rounded-full bg-kfc-yellow px-4 py-2 text-sm font-bold text-kfc-red transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-md shadow-sm"
    >
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
      登录
    </button>
  )
}

