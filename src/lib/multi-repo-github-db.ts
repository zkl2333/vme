import { Octokit } from '@octokit/core'
import { IKfcItem, Repository, MultiRepoResult, CacheState } from '@/types'

// GraphQL 响应类型定义
interface GraphQLRepoResult {
  repository: {
    issues: {
      totalCount: number
      pageInfo: {
        hasNextPage: boolean
        endCursor: string
      }
      nodes: any[]
    }
  }
}

interface GraphQLSinceResult {
  repository: {
    issues: {
      nodes: any[]
    }
  }
}

// 全局内存缓存
let memoryCache: CacheState = {
  allIssues: null,
  repoStats: new Map(),
  totalCount: 0,
  lastFullUpdate: 0,
}

// 用于测试的缓存重置函数
export function resetCache(): void {
  memoryCache = {
    allIssues: null,
    repoStats: new Map(),
    totalCount: 0,
    lastFullUpdate: 0,
  }
}

const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

export class MultiRepoGitHubDatabase {
  private octokit: Octokit
  private repos: Repository[]

  constructor(token: string, repos: Repository[]) {
    this.octokit = new Octokit({ auth: token })
    this.repos = repos
  }

  // 🚀 核心：并行获取所有仓库数据
  async getAllIssues(): Promise<IKfcItem[]> {
    console.log('🔥 开始获取所有仓库数据...')

    const allRepoPromises = this.repos.map(repo =>
      this.getRepoIssues(repo)
    )

    const repoResults = await Promise.all(allRepoPromises)

    // 合并所有仓库的数据
    const allIssues = repoResults.flat()

    // 按创建时间排序（最新在前）
    const sortedIssues = allIssues.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    console.log(`✅ 总共获取了 ${sortedIssues.length} 个 Issues`)
    return sortedIssues
  }

  private async getRepoIssues(repo: Repository): Promise<IKfcItem[]> {
    const labelName = repo.label || '文案'
    // 根据配置决定查询哪种状态的 issues
    // 默认查询所有状态（OPEN 和 CLOSED）
    const issueState = repo.state || 'ALL'
    const statesFilter = issueState === 'ALL' 
      ? 'states: [OPEN, CLOSED]'
      : `states: [${issueState}]`
    
    const query = `
      query GetRepoIssues($owner: String!, $name: String!, $cursor: String, $pageSize: Int!) {
        repository(owner: $owner, name: $name) {
          issues(
            first: $pageSize
            after: $cursor
            labels: ["${labelName}"]
            ${statesFilter}
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              body
              createdAt
              updatedAt
              author {
                login
                avatarUrl
                url
              }
              url
              reactions {
                totalCount
              }
            }
          }
        }
      }
    `

    let allIssues: any[] = []
    let cursor: string | null = null

    console.log(`📦 开始获取 ${repo.owner}/${repo.name} 的数据...`)

    while (true) {
      try {
        const result: GraphQLRepoResult = await this.octokit.graphql<GraphQLRepoResult>(query, {
          owner: repo.owner,
          name: repo.name,
          cursor,
          pageSize: 100
        })

        const issues = result.repository.issues

        // 给每个 issue 添加仓库信息
        const issuesWithRepo = issues.nodes.map((issue: any) => ({
          id: issue.id,
          title: issue.title,
          url: issue.url,
          body: issue.body,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          author: {
            username: issue.author.login,
            avatarUrl: issue.author.avatarUrl,
            url: issue.author.url,
          },
          reactions: {
            totalCount: issue.reactions.totalCount,
          },
          repository: {
            owner: repo.owner,
            name: repo.name,
            url: `https://github.com/${repo.owner}/${repo.name}`
          }
        }))

        allIssues.push(...issuesWithRepo)

        if (!issues.pageInfo.hasNextPage) break
        cursor = issues.pageInfo.endCursor

        // 避免 API 限制
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ 获取 ${repo.owner}/${repo.name} 数据失败:`, error)
        break
      }
    }

    console.log(`📦 从 ${repo.owner}/${repo.name} 获取了 ${allIssues.length} 个 Issues`)
    return allIssues
  }

  // 预热缓存 - 获取所有仓库数据
  async warmupCache(): Promise<void> {
    console.log('🔥 预热多仓库缓存...')

    const startTime = Date.now()
    const allIssues = await this.getAllIssues()

    // 更新缓存
    memoryCache.allIssues = allIssues
    memoryCache.totalCount = allIssues.length
    memoryCache.lastFullUpdate = Date.now()

    // 统计各仓库数据
    const repoStats = new Map()
    allIssues.forEach(issue => {
      if (issue.repository) {
        const repoKey = `${issue.repository.owner}/${issue.repository.name}`
        const current = repoStats.get(repoKey) || { count: 0, lastUpdated: new Date() }
        repoStats.set(repoKey, { count: current.count + 1, lastUpdated: new Date() })
      }
    })

    memoryCache.repoStats = repoStats

    const duration = Date.now() - startTime
    console.log(`✅ 缓存完成: ${allIssues.length} 个 Issues，耗时 ${duration}ms`)

    // 打印仓库统计
    repoStats.forEach((stats, repo) => {
      console.log(`  📊 ${repo}: ${stats.count} 个 Issues`)
    })
  }

  // 检查缓存是否有效
  isCacheValid(): boolean {
    return memoryCache.allIssues !== null &&
           (Date.now() - memoryCache.lastFullUpdate) < CACHE_TTL
  }

  // 获取分页数据
  async getPage(page: number, pageSize: number): Promise<MultiRepoResult<IKfcItem>> {
    // 确保缓存有效
    if (!this.isCacheValid()) {
      await this.warmupCache()
    }

    // 二次检查，确保缓存已初始化
    if (!memoryCache.allIssues || memoryCache.allIssues.length === 0) {
      throw new Error('缓存初始化失败，无法获取数据')
    }

    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    const items = memoryCache.allIssues.slice(startIndex, endIndex)

    // 生成仓库统计
    const repoStatsObj: Record<string, number> = {}
    memoryCache.repoStats.forEach((stats, repo) => {
      repoStatsObj[repo] = stats.count
    })

    return {
      items,
      total: memoryCache.totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(memoryCache.totalCount / pageSize),
      hasNextPage: endIndex < memoryCache.totalCount,
      hasPreviousPage: page > 1,
      repoStats: repoStatsObj
    }
  }

  // 随机获取项目
  async getRandomItem(): Promise<IKfcItem> {
    if (!this.isCacheValid()) {
      await this.warmupCache()
    }

    if (!memoryCache.allIssues || memoryCache.allIssues.length === 0) {
      throw new Error('没有可用的段子数据')
    }

    const randomIndex = Math.floor(Math.random() * memoryCache.totalCount)
    return memoryCache.allIssues[randomIndex]
  }

  // 按仓库分页
  async getPageByRepo(repoKey: string, page: number, pageSize: number): Promise<MultiRepoResult<IKfcItem>> {
    if (!this.isCacheValid()) {
      await this.warmupCache()
    }

    if (!memoryCache.allIssues) {
      throw new Error('缓存初始化失败，无法获取数据')
    }

    const repoIssues = memoryCache.allIssues.filter(issue =>
      issue.repository && `${issue.repository.owner}/${issue.repository.name}` === repoKey
    )

    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return {
      items: repoIssues.slice(startIndex, endIndex),
      total: repoIssues.length,
      page,
      pageSize,
      totalPages: Math.ceil(repoIssues.length / pageSize),
      hasNextPage: endIndex < repoIssues.length,
      hasPreviousPage: page > 1,
      repoStats: { [repoKey]: repoIssues.length }
    }
  }

  // 增量更新 - 只获取最新的 Issues
  async syncLatest(): Promise<void> {
    if (!memoryCache.allIssues || memoryCache.allIssues.length === 0) return

    const latestIssue = memoryCache.allIssues[0]
    const since = latestIssue?.createdAt

    console.log(`🔄 增量同步 since ${since}...`)

    const newIssuesPromises = this.repos.map(repo =>
      this.getRepoIssuesSince(repo, since)
    )

    const newIssuesArrays = await Promise.all(newIssuesPromises)
    const allNewIssues = newIssuesArrays.flat()

    if (allNewIssues.length > 0) {
      // 合并并重新排序
      const mergedIssues = [...allNewIssues, ...memoryCache.allIssues]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      memoryCache.allIssues = mergedIssues
      memoryCache.totalCount = mergedIssues.length

      console.log(`✅ 同步了 ${allNewIssues.length} 个新 Issues`)
    }
  }

  private async getRepoIssuesSince(repo: Repository, since: string): Promise<IKfcItem[]> {
    // GitHub GraphQL API 不支持 filterBy.since，所以我们获取最新的 Issues 然后在客户端过滤
    const labelName = repo.label || '文案'
    const issueState = repo.state || 'ALL'
    const statesFilter = issueState === 'ALL' 
      ? 'states: [OPEN, CLOSED]'
      : `states: [${issueState}]`
    
    const query = `
      query GetRepoIssuesSince($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          issues(
            first: 20
            labels: ["${labelName}"]
            ${statesFilter}
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            nodes {
              id
              title
              body
              createdAt
              updatedAt
              author {
                login
                avatarUrl
                url
              }
              url
              reactions {
                totalCount
              }
            }
          }
        }
      }
    `

    try {
      const result: GraphQLSinceResult = await this.octokit.graphql<GraphQLSinceResult>(query, {
        owner: repo.owner,
        name: repo.name
      })

      // 客户端过滤：只保留创建时间晚于 since 的 issues
      const sinceDate = new Date(since).getTime()
      const issues = result.repository.issues.nodes
        .filter((issue: any) => new Date(issue.createdAt).getTime() > sinceDate)
        .map((issue: any) => ({
          id: issue.id,
          title: issue.title,
          url: issue.url,
          body: issue.body,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          author: {
            username: issue.author.login,
            avatarUrl: issue.author.avatarUrl,
            url: issue.author.url,
          },
          reactions: {
            totalCount: issue.reactions.totalCount,
          },
          repository: {
            owner: repo.owner,
            name: repo.name,
            url: `https://github.com/${repo.owner}/${repo.name}`
          }
        }))

      return issues
    } catch (error) {
      console.error(`增量同步 ${repo.owner}/${repo.name} 失败:`, error)
      return []
    }
  }

  // Webhook 处理增量更新
  async handleWebhook(payload: any): Promise<void> {
    if (payload.action === 'opened' && this.hasLabel(payload.issue, '文案')) {
      // 直接添加到缓存
      if (memoryCache.allIssues) {
        const newIssue: IKfcItem = {
          id: payload.issue.node_id,
          title: payload.issue.title,
          url: payload.issue.html_url,
          body: payload.issue.body,
          createdAt: payload.issue.created_at,
          updatedAt: payload.issue.updated_at,
          author: {
            username: payload.issue.user.login,
            avatarUrl: payload.issue.user.avatar_url,
            url: payload.issue.user.html_url,
          },
          reactions: {
            totalCount: 0,
          },
          repository: {
            owner: payload.repository.owner.login,
            name: payload.repository.name,
            url: payload.repository.html_url
          }
        }

        memoryCache.allIssues.unshift(newIssue)
        memoryCache.totalCount++
        memoryCache.lastFullUpdate = Date.now()

        console.log(`🎉 通过 Webhook 添加新 Issue: ${newIssue.title}`)
      }
    }
  }

  private hasLabel(issue: any, labelName: string): boolean {
    return issue.labels && issue.labels.some((label: any) => label.name === labelName)
  }

  // 获取缓存统计信息
  getCacheStats() {
    return {
      isValid: this.isCacheValid(),
      totalCount: memoryCache.totalCount,
      lastUpdate: new Date(memoryCache.lastFullUpdate),
      repoStats: Object.fromEntries(memoryCache.repoStats)
    }
  }
}