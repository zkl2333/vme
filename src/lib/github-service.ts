/**
 * GitHub 操作服务层 - 统一管理所有 GitHub API 操作
 * 设计原则：
 * 1. 单一职责：只负责 GitHub API 交互
 * 2. 业务聚合：按功能模块组织方法
 * 3. 错误统一：标准化错误处理
 * 4. 权限灵活：支持用户和系统 token
 * 5. 限流智能：自动检测并提示用户登录
 */

import { Octokit } from '@octokit/core'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'

// === 类型定义 ===
export interface GitHubReaction {
  id: string
  content: string
  user: {
    login: string
  }
}

export interface GitHubReactionGroup {
  content: string
  users: {
    totalCount: number
  }
}

export interface GitHubIssueStats {
  id: string
  reactions: number
  reactionDetails: GitHubReactionGroup[]
  reactionNodes: GitHubReaction[]
}

export interface GitHubIssue {
  number: number
  html_url: string
  id: string
}

export type ReactionType = 'THUMBS_UP' | 'THUMBS_DOWN' | 'LAUGH' | 'HOORAY' | 'CONFUSED' | 'HEART' | 'ROCKET' | 'EYES'

// === 限流管理 ===
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  used: number
  resource: string
}

export interface RateLimitStatus {
  core: RateLimitInfo
  search: RateLimitInfo
  graphql: RateLimitInfo
  isNearLimit: boolean
  shouldForceLogin: boolean
  tokenType: 'system' | 'user'
}

// === 错误类型 ===
export class GitHubServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly originalError?: any,
    public readonly rateLimitInfo?: RateLimitStatus
  ) {
    super(message)
    this.name = 'GitHubServiceError'
  }
}

/**
 * 限流管理器 - 跟踪和预测 API 限流状态
 */
class RateLimitManager {
  private static cache = new Map<string, { data: RateLimitStatus; timestamp: number }>()
  private static readonly CACHE_TTL = 60 * 1000 // 1分钟缓存
  
  // 限流阈值配置
  private static readonly THRESHOLDS = {
    // 系统token阈值更严格
    SYSTEM_WARNING: 0.2,    // 剩余20%时警告
    SYSTEM_FORCE_LOGIN: 0.1, // 剩余10%时强制登录
    
    // 用户token阈值相对宽松
    USER_WARNING: 0.1,      // 剩余10%时警告
    USER_FORCE_LOGIN: 0.05, // 剩余5%时强制登录
  }

  /**
   * 检查缓存的限流状态
   */
  static getCachedRateLimit(tokenType: 'system' | 'user'): RateLimitStatus | null {
    const key = `rateLimit_${tokenType}`
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    
    return null
  }

  /**
   * 缓存限流状态
   */
  static setCachedRateLimit(tokenType: 'system' | 'user', status: RateLimitStatus): void {
    const key = `rateLimit_${tokenType}`
    this.cache.set(key, {
      data: status,
      timestamp: Date.now()
    })
  }

  /**
   * 分析限流状态并给出建议
   */
  static analyzeRateLimit(rateLimitData: any, tokenType: 'system' | 'user'): RateLimitStatus {
    const core = rateLimitData.core || rateLimitData.rate
    const search = rateLimitData.search
    const graphql = rateLimitData.graphql
    
    // 计算最严格的剩余比例
    const coreRatio = core ? core.remaining / core.limit : 1
    const graphqlRatio = graphql ? graphql.remaining / graphql.limit : 1
    const minRatio = Math.min(coreRatio, graphqlRatio)
    
    // 根据token类型选择阈值
    const thresholds = tokenType === 'system' 
      ? { warning: this.THRESHOLDS.SYSTEM_WARNING, force: this.THRESHOLDS.SYSTEM_FORCE_LOGIN }
      : { warning: this.THRESHOLDS.USER_WARNING, force: this.THRESHOLDS.USER_FORCE_LOGIN }
    
    const isNearLimit = minRatio <= thresholds.warning
    const shouldForceLogin = tokenType === 'system' && minRatio <= thresholds.force
    
    const status: RateLimitStatus = {
      core: core ? {
        limit: core.limit,
        remaining: core.remaining,
        reset: core.reset,
        used: core.used || (core.limit - core.remaining),
        resource: 'core'
      } : { limit: 0, remaining: 0, reset: 0, used: 0, resource: 'core' },
      
      search: search ? {
        limit: search.limit,
        remaining: search.remaining,
        reset: search.reset,
        used: search.used || (search.limit - search.remaining),
        resource: 'search'
      } : { limit: 0, remaining: 0, reset: 0, used: 0, resource: 'search' },
      
      graphql: graphql ? {
        limit: graphql.limit,
        remaining: graphql.remaining,
        reset: graphql.reset,
        used: graphql.used || (graphql.limit - graphql.remaining),
        resource: 'graphql'
      } : { limit: 0, remaining: 0, reset: 0, used: 0, resource: 'graphql' },
      
      isNearLimit,
      shouldForceLogin,
      tokenType
    }
    
    // 缓存状态
    this.setCachedRateLimit(tokenType, status)
    
    return status
  }
}

/**
 * GitHub 服务类 - 业务导向的 API 封装
 */
export class GitHubService {
  private octokit: Octokit
  private readonly repoOwner = 'zkl2333'
  private readonly repoName = 'vme'
  private tokenType: 'system' | 'user'

  constructor(octokit: Octokit, tokenType: 'system' | 'user') {
    this.octokit = octokit
    this.tokenType = tokenType
  }

  // === 静态工厂方法 ===
  
  /**
   * 创建使用环境变量 token 的服务实例
   */
  static createWithSystemToken(): GitHubService {
    if (!process.env.GITHUB_TOKEN) {
      throw new GitHubServiceError('GitHub token not configured', 'MISSING_TOKEN', 503)
    }
    return new GitHubService(new Octokit({
      auth: process.env.GITHUB_TOKEN,
    }), 'system')
  }

  /**
   * 创建使用用户 token 的服务实例
   */
  static async createWithUserToken(request: Request): Promise<GitHubService> {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      throw new GitHubServiceError('User not authenticated', 'NOT_AUTHENTICATED', 401)
    }

    const secret = process.env.NEXTAUTH_SECRET
    const token = await getToken({ req: request as any, secret })
    const accessToken = token?.accessToken as string

    if (!accessToken) {
      throw new GitHubServiceError('Invalid authentication info', 'INVALID_TOKEN', 401)
    }

    return new GitHubService(new Octokit({
      auth: accessToken,
    }), 'user')
  }

  /**
   * 安全创建服务实例：在token无效时返回null而不抛出异常
   */
  static async createSafely(request?: Request): Promise<GitHubService | null> {
    try {
      return await GitHubService.createSmart(request)
    } catch (error) {
      console.warn('Failed to create GitHub service:', error instanceof Error ? error.message : error)
      return null
    }
  }

  /**
   * 智能创建服务实例：检查限流状态决定使用哪种 token
   */
  static async createSmart(request?: Request): Promise<GitHubService> {
    // 检查系统token的限流状态
    const cachedSystemRate = RateLimitManager.getCachedRateLimit('system')
    
    // 如果系统token接近限流，优先尝试用户token
    if (cachedSystemRate?.shouldForceLogin && request) {
      try {
        const userService = await GitHubService.createWithUserToken(request)
        console.log('Using user token due to system rate limit')
        return userService
      } catch (error) {
        console.warn('Failed to create user token service, but system token is near limit')
        // 即使系统token接近限流，也继续使用（但会在调用时抛出警告）
      }
    }
    
    // 尝试用户token（如果有request）
    if (request) {
      try {
        return await GitHubService.createWithUserToken(request)
      } catch (error) {
        console.warn('Failed to create user token service, falling back to system token')
      }
    }
    
    return GitHubService.createWithSystemToken()
  }

  // === 限流检查方法 ===

  /**
   * 检查当前的限流状态
   */
  async checkRateLimit(): Promise<RateLimitStatus> {
    // 优先返回缓存的状态
    const cached = RateLimitManager.getCachedRateLimit(this.tokenType)
    if (cached) {
      return cached
    }

    try {
      // 获取实时限流信息
      const response = await this.octokit.request('GET /rate_limit')
      return RateLimitManager.analyzeRateLimit(response.data.resources, this.tokenType)
    } catch (error) {
      console.warn('Failed to fetch rate limit info:', error)
      // 返回保守的默认状态
      return {
        core: { limit: 0, remaining: 0, reset: 0, used: 0, resource: 'core' },
        search: { limit: 0, remaining: 0, reset: 0, used: 0, resource: 'search' },
        graphql: { limit: 0, remaining: 0, reset: 0, used: 0, resource: 'graphql' },
        isNearLimit: true,
        shouldForceLogin: this.tokenType === 'system',
        tokenType: this.tokenType
      }
    }
  }

  /**
   * 在执行操作前检查限流状态
   */
  private async validateRateLimit(): Promise<void> {
    const rateLimit = await this.checkRateLimit()
    
    if (rateLimit.shouldForceLogin) {
      throw new GitHubServiceError(
        'API rate limit approaching. Please login to continue.',
        'RATE_LIMIT_FORCE_LOGIN',
        429,
        undefined,
        rateLimit
      )
    }
    
    if (rateLimit.isNearLimit) {
      console.warn(`API rate limit warning: ${this.tokenType} token approaching limits`, rateLimit)
    }
  }

  // === Issue 管理模块 ===

  /**
   * 创建文案 Issue
   */
  async createJokeIssue(title: string, content: string): Promise<GitHubIssue> {
    await this.validateRateLimit()
    
    try {
      const response = await this.octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: this.repoOwner,
        repo: this.repoName,
        title: title.trim(),
        body: content.trim(),
        labels: ['文案'],
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      return {
        number: response.data.number,
        html_url: response.data.html_url,
        id: response.data.node_id,
      }
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create joke issue')
    }
  }

  /**
   * 验证 Issue 是否存在
   */
  async validateIssue(issueId: string): Promise<boolean> {
    await this.validateRateLimit()
    
    try {
      const query = `
        query GetIssue($id: ID!) {
          node(id: $id) {
            ... on Issue {
              id
            }
          }
        }
      `

      const response = await this.octokit.graphql<{
        node: { id: string } | null
      }>(query, { id: issueId })

      return !!response.node
    } catch (error: any) {
      return false
    }
  }

  // === 反应管理模块 ===

  /**
   * 添加反应
   */
  async addReaction(issueId: string, reaction: ReactionType): Promise<string> {
    await this.validateRateLimit()
    
    try {
      const mutation = `
        mutation AddReaction($input: AddReactionInput!) {
          addReaction(input: $input) {
            reaction {
              id
              content
            }
            subject {
              id
            }
          }
        }
      `

      const response = await this.octokit.graphql<{
        addReaction: {
          reaction: { id: string; content: string }
        }
      }>(mutation, {
        input: {
          subjectId: issueId,
          content: reaction,
        },
      })

      return response.addReaction.reaction.id
    } catch (error: any) {
      throw this.handleError(error, 'Failed to add reaction')
    }
  }

  /**
   * 删除反应
   */
  async removeReaction(issueId: string, reaction: ReactionType, userLogin: string): Promise<void> {
    await this.validateRateLimit()
    
    try {
      // 先获取用户的反应
      const userReactionId = await this.getUserReactionId(issueId, reaction, userLogin)
      
      if (!userReactionId) {
        throw new GitHubServiceError('Reaction not found', 'REACTION_NOT_FOUND', 404)
      }

      const mutation = `
        mutation RemoveReaction($input: RemoveReactionInput!) {
          removeReaction(input: $input) {
            subject {
              id
            }
          }
        }
      `

      await this.octokit.graphql(mutation, {
        input: {
          subjectId: issueId,
          content: reaction,
        },
      })
    } catch (error: any) {
      throw this.handleError(error, 'Failed to remove reaction')
    }
  }

  /**
   * 获取用户特定反应的 ID
   */
  private async getUserReactionId(issueId: string, reaction: ReactionType, userLogin: string): Promise<string | null> {
    const query = `
      query GetIssueReactions($id: ID!) {
        node(id: $id) {
          ... on Issue {
            reactions(first: 100) {
              nodes {
                id
                content
                user {
                  login
                }
              }
            }
          }
        }
      }
    `

    const response = await this.octokit.graphql<{
      node: {
        reactions: {
          nodes: GitHubReaction[]
        }
      } | null
    }>(query, { id: issueId })

    if (!response.node) return null

    const userReaction = response.node.reactions.nodes.find(
      r => r.user.login === userLogin && r.content === reaction
    )

    return userReaction?.id || null
  }

  // === 统计数据模块 ===

  /**
   * 获取单个 Issue 统计数据
   */
  async getIssueStats(issueId: string): Promise<GitHubIssueStats> {
    await this.validateRateLimit()
    
    try {
      const query = `
        query GetIssueStats($issueId: ID!) {
          node(id: $issueId) {
            ... on Issue {
              id
              reactions(first: 100) {
                totalCount
                nodes {
                  id
                  content
                  user {
                    login
                  }
                }
              }
              reactionGroups {
                content
                users {
                  totalCount
                }
              }
            }
          }
        }
      `

      const response = await this.octokit.graphql<{
        node: {
          id: string
          reactions: { 
            totalCount: number
            nodes: GitHubReaction[]
          }
          reactionGroups: GitHubReactionGroup[]
        } | null
      }>(query, { issueId })

      if (!response.node) {
        throw new GitHubServiceError(`Issue ${issueId} not found`, 'ISSUE_NOT_FOUND', 404)
      }

      return {
        id: response.node.id,
        reactions: response.node.reactions.totalCount,
        reactionDetails: response.node.reactionGroups || [],
        reactionNodes: response.node.reactions.nodes || [],
      }
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get issue stats')
    }
  }

  // === 错误处理 ===

  private async handleError(error: any, context: string): Promise<GitHubServiceError> {
    console.error(`${context}:`, error)

    // 检查是否是限流错误
    if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
      const rateLimit = await this.checkRateLimit()
      return new GitHubServiceError(
        'API rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        403,
        error,
        rateLimit
      )
    }

    // GitHub API 特定错误
    if (error.status === 403) {
      return new GitHubServiceError('Access forbidden', 'FORBIDDEN', 403, error)
    }
    
    if (error.status === 404) {
      return new GitHubServiceError('Resource not found', 'NOT_FOUND', 404, error)
    }
    
    if (error.status === 422) {
      return new GitHubServiceError('Invalid request data', 'INVALID_DATA', 422, error)
    }

    // 一般错误
    const message = error.message || 'Unknown GitHub API error'
    const status = error.status || 500
    
    return new GitHubServiceError(message, 'API_ERROR', status, error)
  }
}

// === 便捷函数导出 ===

/**
 * 获取用户认证状态和用户名
 */
export async function getCurrentUser(request?: Request): Promise<{ username: string } | null> {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.username ? { username: session.user.username } : null
  } catch {
    return null
  }
}

/**
 * 检查是否需要用户认证的操作
 */
export function requireUserAuth(user: { username: string } | null): asserts user is { username: string } {
  if (!user) {
    throw new GitHubServiceError('Authentication required', 'AUTHENTICATION_REQUIRED', 401)
  }
}

/**
 * 获取当前系统的限流状态（用于前端显示）
 */
export async function getSystemRateLimitStatus(): Promise<RateLimitStatus | null> {
  try {
    const service = GitHubService.createWithSystemToken()
    return await service.checkRateLimit()
  } catch {
    return null
  }
}