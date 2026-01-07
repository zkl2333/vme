'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { modal } from '@/lib/modalManager'

interface LoginConfirmDialogProps {
  onClose: () => void
  title?: string
  message?: string
}

/**
 * 登录确认对话框内容
 */
function LoginConfirmDialogContent({
  onClose,
  title = '需要登录',
  message = '此操作需要登录 GitHub 账号，是否现在登录？',
}: LoginConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await signIn('github', {
        callbackUrl: window.location.href,
      })
    } catch (error) {
      console.error('登录失败:', error)
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
        disabled={isLoading}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-kfc-red to-orange-500">
          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <h3 className="mb-3 text-center text-2xl font-bold text-gray-900">{title}</h3>
      <p className="mb-6 text-center text-gray-600">{message}</p>

      <div className="mb-6 rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="mb-1 font-medium">登录后您可以：</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 给喜欢的文案点赞</li>
              <li>• 提交自己的创意文案</li>
              <li>• 参与社区互动</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-gradient-to-r from-kfc-red to-orange-500 px-4 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              登录中...
            </span>
          ) : (
            '使用 GitHub 登录'
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * 命令式 API - 显示登录对话框
 */
interface ShowLoginDialogOptions {
  title?: string
  message?: string
  onClose?: () => void
}

export function showLoginDialog(options: ShowLoginDialogOptions = {}) {
  const instance = modal.open({
    content: (
      <LoginConfirmDialogContent
        onClose={() => {
          instance.close()
          options.onClose?.()
        }}
        title={options.title}
        message={options.message}
      />
    ),
    closeOnBackdrop: true,
    closeOnEsc: true,
  })

  return instance
}

