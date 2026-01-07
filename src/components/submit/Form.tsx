'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { showLoginDialog } from '@/components/shared/LoginDialog'

const FORM_STORAGE_KEY = 'submit_joke_form_draft'

/**
 * 提交段子表单组件
 */
export default function SubmitForm() {
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
        setMessage({ type: 'success', text: '文案上交成功！正在跳转到详情页...' })
        setTitle('')
        setContent('')
        // 清理可能存在的草稿
        localStorage.removeItem(FORM_STORAGE_KEY)

        const targetUrl = data.detailPath || (data.issueNumber ? `/jokes/${data.issueNumber}` : data.issueUrl)

        if (targetUrl) {
          setTimeout(() => {
            window.location.assign(targetUrl)
          }, 800)
        }
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
              : '登录后即可上交文案，分享快乐给更多人！',
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
      message: '登录后即可上交文案，分享快乐给更多人！',
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
      <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg md:p-6">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-800 md:text-2xl">
          上交我的疯四文案
        </h2>
        <p className="text-gray-600 text-center mb-6">
          请先登录 GitHub 账号以提交您的创意
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleLoginClick}
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-kfc-yellow px-4 py-2 text-sm font-bold text-kfc-red transition-all duration-300 hover:bg-kfc-lightYellow hover:shadow-lg"
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
    <div className="mx-auto max-w-2xl border-4 border-black bg-white p-6 shadow-neo-xl md:p-8">
      <h2 className="mb-6 text-center text-3xl font-black italic uppercase text-black md:mb-8 md:text-4xl">
        上交我的<span className="text-kfc-red underline decoration-4">疯四文案</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="title" className="block text-sm font-black uppercase text-black">
              文案标题 / Title *
            </label>
            <p className="text-xs font-bold text-gray-500">
              {title.length}/100
            </p>
          </div>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的文案起个标题..."
            className="w-full min-h-[44px] border-2 border-black bg-white px-4 py-3 font-bold text-black shadow-neo-sm transition-all placeholder:text-gray-400 focus:bg-kfc-cream focus:shadow-neo focus:outline-none"
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="content" className="block text-sm font-black uppercase text-black">
              文案内容 / Content *
            </label>
            <p className="text-xs font-bold text-gray-500">
              {content.length}/2000
            </p>
          </div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始你的表演..."
            rows={6}
            className="w-full resize-none border-2 border-black bg-white px-4 py-3 font-bold text-black shadow-neo-sm transition-all placeholder:text-gray-400 focus:bg-kfc-cream focus:shadow-neo focus:outline-none"
            disabled={isSubmitting}
            maxLength={2000}
          />
        </div>

        {message && (
          <div className={`border-2 border-black p-4 font-bold shadow-neo-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="w-full border-3 border-black bg-kfc-yellow px-6 py-4 text-xl font-black uppercase text-black shadow-neo transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-black hover:text-white hover:shadow-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fa fa-spinner fa-spin"></i>
              SUBMITTING...
            </span>
          ) : (
            '确认上交 / SUBMIT'
          )}
        </button>
      </form>

      <div className="mt-8 border-2 border-black bg-kfc-cream p-4 shadow-neo-sm">
        <h3 className="mb-2 text-sm font-black uppercase text-black">
          <i className="fa fa-info-circle mr-2"></i>提交须知：
        </h3>
        <ul className="space-y-1 text-xs font-bold text-gray-700">
          <li>• 请确保内容原创，避免重复提交</li>
          <li>• 内容应当积极健康，符合社区规范</li>
          <li>• 提交后将自动创建 GitHub Issue，经审核后显示</li>
          <li>• 作为贡献者，您的 GitHub 头像和用户名将被展示</li>
        </ul>
      </div>
    </div>
  )
}
