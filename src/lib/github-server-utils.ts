// 新的服务端工具函数 - 完全基于 GitHub Issues，无需 data 目录
import { MultiRepoGitHubDatabase } from './multi-repo-github-db'
import { IKfcItem, Repository, MultiRepoResult } from '@/types'
import { getOctokitInstance } from '@/lib/github'

// 仓库配置 - 可以通过环境变量配置
const REPOS_CONFIG: Repository[] = [
  {
    owner: 'zkl2333',
    name: 'vme',
    label: '收录',  // 注意：这里是 '收录' 不是 '文案'
    state: 'ALL'  // 'OPEN' | 'CLOSED' | 'ALL'，默认 'ALL' 查询所有状态
  },
  {
    owner: 'whitescent',
    name: 'KFC-Crazy-Thursday',
    label: '文案提供',  // 注意：这里是 '文案提供' 不是 '段子'
    state: 'ALL'
  }
]

// 全局数据库实例
let multiRepoGitHub: MultiRepoGitHubDatabase | null = null

// 导出获取数据库实例的函数（供 sync API 使用）
export function getMultiRepoGitHub(): MultiRepoGitHubDatabase {
  if (!multiRepoGitHub) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN 环境变量未设置')
    }
    multiRepoGitHub = new MultiRepoGitHubDatabase(process.env.GITHUB_TOKEN, REPOS_CONFIG)
  }
  return multiRepoGitHub
}

// 导出仓库配置（供 sync API 使用）
export function getReposConfig(): Repository[] {
  return REPOS_CONFIG
}

// 初始化数据库实例
function getMultiRepoGitHubInternal(): MultiRepoGitHubDatabase {
  if (!multiRepoGitHub) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN 环境变量未设置')
    }
    multiRepoGitHub = new MultiRepoGitHubDatabase(process.env.GITHUB_TOKEN, REPOS_CONFIG)
  }
  return multiRepoGitHub
}

// 获取所有 KFC 项目（不分页）
export async function getAllKfcItems(): Promise<IKfcItem[]> {
  const db = getMultiRepoGitHubInternal()

  if (!db.isCacheValid()) {
    await db.warmupCache()
  }

  // 从缓存获取所有数据
  const result = await db.getPage(1, Number.MAX_SAFE_INTEGER)
  return result.items
}

// 获取分页数据
export async function getKfcItemsWithPagination(
  page = 1,
  pageSize = 20,
): Promise<MultiRepoResult<IKfcItem>> {
  const db = getMultiRepoGitHubInternal()
  return await db.getPage(page, pageSize)
}

// 获取随机项目
export async function getRandomKfcItem(): Promise<IKfcItem> {
  const db = getMultiRepoGitHubInternal()
  return await db.getRandomItem()
}

// 按仓库获取数据（新功能）
export async function getItemsByRepo(
  repoKey: string,
  page = 1,
  pageSize = 20
): Promise<MultiRepoResult<IKfcItem>> {
  const db = getMultiRepoGitHubInternal()
  return await db.getPageByRepo(repoKey, page, pageSize)
}

// 获取缓存统计信息（新功能）
export async function getCacheStats() {
  const db = getMultiRepoGitHubInternal()
  return db.getCacheStats()
}

// 手动刷新缓存（新功能）
export async function refreshCache(): Promise<void> {
  const db = getMultiRepoGitHubInternal()
  await db.warmupCache()
}

// 增量同步（新功能）
export async function syncLatestIssues(): Promise<void> {
  const db = getMultiRepoGitHubInternal()
  await db.syncLatest()
}

// Webhook 处理函数（新功能）
export async function handleIssueWebhook(payload: any): Promise<void> {
  const db = getMultiRepoGitHubInternal()
  await db.handleWebhook(payload)
}

// 导出统一的 getOctokitInstance（避免重复导入）
export { getOctokitInstance } from '@/lib/github'

// 热启动函数 - 在应用启动时调用
export async function warmupGitHubDatabase(): Promise<void> {
  console.log('🚀 启动时预热 GitHub 数据库...')
  try {
    const db = getMultiRepoGitHubInternal()
    await db.warmupCache()
    console.log('✅ GitHub 数据库预热完成')
  } catch (error) {
    console.error('❌ GitHub 数据库预热失败:', error)
    // 不抛出错误，允许应用继续启动
  }
}

// 健康检查函数
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  cache: any
  repos: Repository[]
  errors?: string[]
}> {
  const errors: string[] = []

  try {
    const db = getMultiRepoGitHubInternal()
    const cacheStats = db.getCacheStats()

    if (!cacheStats.isValid) {
      errors.push('缓存已过期')
    }

    if (cacheStats.totalCount === 0) {
      errors.push('没有可用数据')
    }

    return {
      status: errors.length === 0 ? 'healthy' : 'unhealthy',
      cache: cacheStats,
      repos: REPOS_CONFIG,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      cache: null,
      repos: REPOS_CONFIG,
      errors: [`系统错误: ${error instanceof Error ? error.message : '未知错误'}`]
    }
  }
}