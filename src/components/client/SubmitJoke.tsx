'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { showLoginDialog } from '@/components/client/LoginConfirmDialogContent'

const FORM_STORAGE_KEY = 'submit_joke_form_draft'

export function SubmitJoke() {
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // 登录后恢复表单数据
  useEffect(() => {
    if (session && status === 'authenticated') {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY)
      if (savedForm) {
        try {
          const { title: savedTitle, content: savedContent } = JSON.parse(savedForm)
          if (savedTitle || savedContent) {
            setTitle(savedTitle)
            setContent(savedContent)
            setMessage({ type: 'info', text: '已恢复您之前填写的内容' })
            localStorage.removeItem(FORM_STORAGE_KEY)
          }
        } catch (e) {
          console.error('恢复表单数据失败:', e)
        }
      }
    }
  }, [session, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: '请填写完整的标题和内容' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '段子提交成功！感谢您的贡献！' })
        setTitle('')
        setContent('')
        // 清理可能存在的草稿
        localStorage.removeItem(FORM_STORAGE_KEY)
      } else {
        // 处理认证错误
        if (response.status === 401) {
          const errorMsg = data.message || ''
          const isExpired = errorMsg.includes('无效') || errorMsg.includes('过期')

          // 保存表单数据
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ title, content }))

          setMessage({
            type: 'error',
            text: isExpired ? '登录已过期，请重新登录' : '请先登录以继续提交'
          })

          // 显示登录确认弹窗
          showLoginDialog({
            title: isExpired ? '登录已过期' : '提交段子需要登录',
            message: isExpired
              ? '您的登录已过期，请重新登录以继续提交'
              : '登录后即可提交您的创意文案，分享快乐给更多人！',
          })
        } else {
          setMessage({ type: 'error', text: data.message || '提交失败，请稍后重试' })
        }
      }
    } catch (error) {
      console.error('提交段子失败:', error)
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoginClick = () => {
    // 保存表单数据
    if (title.trim() || content.trim()) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ title, content }))
    }

    // 显示登录确认弹窗
    showLoginDialog({
      title: '提交段子需要登录',
      message: '登录后即可提交您的创意文案，分享快乐给更多人！',
    })
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
          提交我的疯狂星期四段子
        </h2>
        <p className="text-gray-600 text-center mb-6">
          请先登录 GitHub 账号以提交您的创意段子
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleLoginClick}
            className="flex items-center gap-2 rounded-full bg-kfc-yellow px-4 py-2 text-sm font-bold text-kfc-red transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg"
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
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        提交我的疯狂星期四段子
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            段子标题 *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的段子起个有趣的标题..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
            disabled={isSubmitting}
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 字符
          </p>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            段子内容 *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的疯狂星期四段子..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
            disabled={isSubmitting}
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/2000 字符
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              提交中...
            </span>
          ) : (
            '提交段子'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">提交须知：</h3>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• 请确保内容原创，避免重复提交</li>
          <li>• 内容应当积极健康，符合社区规范</li>
          <li>• 提交后将自动创建 GitHub Issue，经审核后显示</li>
          <li>• 作为贡献者，您的 GitHub 头像和用户名将被展示</li>
        </ul>
      </div>
    </div>
  )
}
