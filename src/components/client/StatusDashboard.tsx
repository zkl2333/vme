'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface RateLimitInfo {
  remaining: number
  limit: number
  resetTime: string
  percentage: number
  shouldForceLogin: boolean
  isNearLimit: boolean
}

interface SystemStatus {
  timestamp: string
  github: {
    systemToken: {
      configured: boolean
      status: string
      rateLimit: RateLimitInfo | null
      error: string | null
    }
    userToken: {
      available: boolean
      status: string
      rateLimit: RateLimitInfo | null
      error: string | null
    }
    smartService?: {
      available: boolean
      tokenType?: string
      error?: string
    }
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

function StatusCard({ title, status, children }: { title: string; status: 'success' | 'warning' | 'error' | 'info'; children: React.ReactNode }) {
  const statusColors = {
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
  }

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  }

  const icons = {
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
    info: 'fa-info-circle',
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${statusColors[status]}`}>
      <div className="mb-4 flex items-center gap-2">
        <i className={`fa ${icons[status]} ${iconColors[status]}`}></i>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function RateLimitBar({ rateLimit }: { rateLimit: RateLimitInfo }) {
  const getStatusColor = () => {
    if (rateLimit.percentage > 50) return 'bg-green-500'
    if (rateLimit.percentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>剩余请求数</span>
        <span className="font-mono">{rateLimit.remaining} / {rateLimit.limit}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200">
        <div 
          className={`h-3 rounded-full transition-all ${getStatusColor()}`}
          style={{ width: `${rateLimit.percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{rateLimit.percentage}% 剩余</span>
        <span>重置时间: {new Date(rateLimit.resetTime).toLocaleTimeString()}</span>
      </div>
      {rateLimit.shouldForceLogin && (
        <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
          ⚠️ 建议用户登录以使用个人配额
        </div>
      )}
    </div>
  )
}

export default function StatusDashboard() {
  const { data: status, error, isLoading, mutate } = useSWR<SystemStatus>(
    '/api/status',
    fetcher,
    {
      refreshInterval: 30000, // 30秒自动刷新
      revalidateOnFocus: true,
    }
  )

  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    if (status?.timestamp) {
      setLastUpdated(new Date(status.timestamp).toLocaleString())
    }
  }, [status?.timestamp])

  if (isLoading && !status) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
            <div className="mb-4 h-6 w-3/4 rounded bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-300"></div>
              <div className="h-4 w-2/3 rounded bg-gray-300"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <StatusCard title="系统状态检查失败" status="error">
        <p className="text-red-700">无法获取系统状态信息</p>
        <p className="mt-2 text-sm text-gray-600">{error.message}</p>
        <button
          onClick={() => mutate()}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          重试
        </button>
      </StatusCard>
    )
  }

  if (!status) return null

  return (
    <div className="space-y-8">
      {/* 刷新控制 */}
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-600">
          最后更新: {lastUpdated}
        </div>
        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded bg-kfc-yellow px-4 py-2 font-medium text-kfc-red transition-colors hover:bg-yellow-300 disabled:opacity-50"
        >
          <i className={`fa fa-refresh ${isLoading ? 'animate-spin' : ''}`}></i>
          刷新状态
        </button>
      </div>

      {/* GitHub Token 状态 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 系统 Token */}
        <StatusCard 
          title="系统 Token 状态" 
          status={
            !status.github.systemToken.configured ? 'warning' :
            status.github.systemToken.status === 'working' ? 'success' : 'error'
          }
        >
          {!status.github.systemToken.configured ? (
            <div className="text-yellow-700">
              <p className="mb-2">⚠️ 系统 Token 未配置</p>
              <p className="text-sm">请在环境变量中设置 GITHUB_TOKEN</p>
            </div>
          ) : status.github.systemToken.status === 'working' ? (
            <div className="text-green-700">
              <p className="mb-4">✅ 系统 Token 工作正常</p>
              {status.github.systemToken.rateLimit && (
                <RateLimitBar rateLimit={status.github.systemToken.rateLimit} />
              )}
            </div>
          ) : (
            <div className="text-red-700">
              <p className="mb-2">❌ 系统 Token 异常</p>
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm font-medium mb-1">错误详情：</p>
                <p className="text-sm">{status.github.systemToken.error}</p>
                {status.github.systemToken.error?.includes('401') && (
                  <div className="mt-2 text-xs text-red-600">
                    💡 建议：请生成新的 GitHub Personal Access Token 并更新环境变量
                  </div>
                )}
              </div>
            </div>
          )}
        </StatusCard>

        {/* 用户 Token */}
        <StatusCard 
          title="用户 Token 状态" 
          status={
            status.github.userToken.available && status.github.userToken.status === 'working' ? 'success' : 
            status.github.userToken.status === 'not_authenticated' ? 'info' : 
            status.github.userToken.status === 'expired' || status.github.userToken.status === 'invalid_token' ? 'error' : 'info'
          }
        >
          {status.github.userToken.available && status.github.userToken.status === 'working' ? (
            <div className="text-green-700">
              <p className="mb-4">✅ 用户已登录，个人配额可用</p>
              {status.github.userToken.rateLimit && (
                <RateLimitBar rateLimit={status.github.userToken.rateLimit} />
              )}
            </div>
          ) : status.github.userToken.status === 'not_authenticated' ? (
            <div className="text-blue-700">
              <p className="mb-2">ℹ️ 用户未登录</p>
              <p className="text-sm">登录后可使用个人 GitHub API 配额</p>
            </div>
          ) : status.github.userToken.status === 'expired' || status.github.userToken.status === 'invalid_token' ? (
            <div className="text-red-700">
              <p className="mb-2">❌ 用户 Token 异常</p>
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm font-medium mb-1">错误详情：</p>
                <p className="text-sm">{status.github.userToken.error}</p>
                <div className="mt-2 text-xs text-red-600">
                  💡 建议：请重新登录以刷新访问令牌
                </div>
              </div>
            </div>
          ) : (
            <div className="text-blue-700">
              <p className="mb-2">ℹ️ 用户token不可用</p>
              {status.github.userToken.error && (
                <p className="text-sm text-gray-600">{status.github.userToken.error}</p>
              )}
            </div>
          )}
        </StatusCard>
      </div>

      {/* 智能服务状态 */}
      {status.github.smartService && (
        <StatusCard 
          title="智能服务状态" 
          status={status.github.smartService.available ? 'success' : 'error'}
        >
          {status.github.smartService.available ? (
            <div className="text-green-700">
              <p className="mb-2">✅ 智能服务正常运行</p>
              <p className="text-sm">当前使用: {status.github.smartService.tokenType} token</p>
            </div>
          ) : (
            <div className="text-red-700">
              <p className="mb-2">❌ 智能服务不可用</p>
              <p className="text-sm">{status.github.smartService.error}</p>
            </div>
          )}
        </StatusCard>
      )}

    </div>
  )
}