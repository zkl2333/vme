/**
 * GitHub API 客户端管理
 * 统一管理所有 Octokit 实例的创建和配置
 */

import { Octokit } from '@octokit/core'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'

/**
 * 获取 Octokit 实例
 * 优先使用用户 token，如果没有则使用环境变量 token
 * 
 * @param request - 可选的 Request 对象，用于获取用户 token
 * @returns Octokit 实例
 */
export async function getOctokitInstance(request?: Request): Promise<Octokit> {
  try {
    // 尝试获取用户 session
    const session = await getServerSession(authOptions)

    if (session?.user?.username) {
      if (request) {
        // 用户已登录且有 request 对象，尝试从 JWT 获取 access token
        const secret = process.env.NEXTAUTH_SECRET
        const token = await getToken({ req: request as any, secret })
        const accessToken = token?.accessToken as string

        if (accessToken) {
          console.log('✅ 使用用户 access token')
          return new Octokit({
            auth: accessToken,
          })
        }
      }
      // 用户已登录但没有 request 对象（如服务器组件），使用环境变量 token
      console.log('⚠️  用户已登录，但无法获取 access token，使用环境变量 token')
    }
  } catch (error) {
    console.warn('⚠️  获取用户 session 失败，使用环境变量 token:', error)
  }

  // 使用环境变量 token
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN 环境变量未设置')
  }

  console.log('✅ 使用环境变量 token')
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  })
}

/**
 * 创建指定 token 的 Octokit 实例
 * 
 * @param token - GitHub Personal Access Token
 * @returns Octokit 实例
 */
export function createOctokitInstance(token: string): Octokit {
  if (!token) {
    throw new Error('Token 不能为空')
  }
  
  return new Octokit({
    auth: token,
  })
}

/**
 * 获取系统级 Octokit 实例（仅使用环境变量 token）
 * 用于后台任务、数据同步等不需要用户权限的场景
 * 
 * @returns Octokit 实例
 */
export function getSystemOctokitInstance(): Octokit {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN 环境变量未设置')
  }

  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  })
}
