/**
 * 数据同步管理器
 * 负责协调本地数据库与后端 API 的同步
 */

import { localDB, LocalKfcItem, SyncMetadata } from './local-db'
import { getReposConfig } from './github-server-utils'
import type { IKfcItem, Repository } from '@/types'

// 同步状态
export type SyncStatus = 'idle' | 'checking' | 'syncing' | 'error'

// 同步结果
export interface SyncResult {
  success: boolean
  repoKey: string
  newItems: number
  updatedItems: number
  totalSynced: number
  error?: string
  duration: number
}

// 批量同步结果
export interface BatchSyncResult {
  results: SyncResult[]
  totalNewItems: number
  totalErrors: number
  duration: number
}

// 检查更新结果
export interface UpdateCheckResult {
  hasUpdates: boolean
  reposWithUpdates: string[]
  totalNewItems: number
  checkTime: number
}

class SyncManager {
  private syncInProgress = false
  private checkInProgress = false
  private syncQueue = new Set<string>()
  private abortController: AbortController | null = null

  // 检查所有仓库是否有更新
  async checkForUpdates(): Promise<UpdateCheckResult> {
    if (this.checkInProgress) {
      throw new Error('检查更新已在进行中')
    }

    this.checkInProgress = true

    try {
      console.log('🔍 检查所有仓库更新...')
      const repos = getReposConfig()
      const startTime = Date.now()

      const checkPromises = repos.map(async (repo) => {
        const repoKey = `${repo.owner}/${repo.name}`

        try {
          // 获取最后同步时间
          const syncMeta = await localDB.syncMeta.get(repoKey)
          const lastSyncTime = syncMeta?.lastSyncTime || 0

          // 检查是否有更新
          const response = await fetch(`/api/sync/check?repo=${repoKey}&since=${lastSyncTime}`)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()

          return {
            repoKey,
            hasUpdates: result.hasUpdates,
            newItemsCount: result.newItemsCount || 0,
            error: null
          }
        } catch (error) {
          console.error(`❌ 检查 ${repoKey} 更新失败:`, error)
          return {
            repoKey,
            hasUpdates: false,
            newItemsCount: 0,
            error: error instanceof Error ? error.message : '未知错误'
          }
        }
      })

      const results = await Promise.all(checkPromises)
      const reposWithUpdates = results
        .filter(r => r.hasUpdates && !r.error)
        .map(r => r.repoKey)

      const totalNewItems = results
        .filter(r => !r.error)
        .reduce((sum, r) => sum + r.newItemsCount, 0)

      const checkResult: UpdateCheckResult = {
        hasUpdates: reposWithUpdates.length > 0,
        reposWithUpdates,
        totalNewItems,
        checkTime: Date.now() - startTime
      }

      console.log(`✅ 更新检查完成: ${reposWithUpdates.length}个仓库有更新, 共${totalNewItems}条新数据, 耗时${checkResult.checkTime}ms`)

      return checkResult

    } finally {
      this.checkInProgress = false
    }
  }

  // 同步单个仓库
  async syncRepo(repoKey: string, options: {
    onProgress?: (progress: { current: number, total: number, status: string }) => void
    signal?: AbortSignal
  } = {}): Promise<SyncResult> {

    const startTime = Date.now()
    let newItems = 0
    let updatedItems = 0
    let totalSynced = 0

    try {
      console.log(`🔄 开始同步仓库: ${repoKey}`)

      // 获取最后同步时间
      const syncMeta = await localDB.syncMeta.get(repoKey)
      const lastSyncTime = syncMeta?.lastSyncTime || 0

      console.log(`📅 最后同步时间: ${lastSyncTime > 0 ? new Date(lastSyncTime).toISOString() : '从未同步'}`)

      let page = 1
      let hasMore = true

      while (hasMore && !options.signal?.aborted) {
        // 报告进度
        options.onProgress?.({
          current: totalSynced,
          total: totalSynced + 100, // 估算
          status: `正在获取第 ${page} 页数据...`
        })

        // 获取增量数据
        const response = await fetch(
          `/api/sync/incremental?repo=${repoKey}&since=${lastSyncTime}&page=${page}&pageSize=100`,
          { signal: options.signal }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const batch = await response.json()

        if (batch.items.length === 0) {
          hasMore = false
          break
        }

        // 转换数据格式
        const localItems: Omit<LocalKfcItem, 'localCreatedAt' | 'localUpdatedAt'>[] = batch.items.map((item: IKfcItem) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          repoOwner: item.repository?.owner || repoKey.split('/')[0],
          repoName: item.repository?.name || repoKey.split('/')[1],
          repoKey,
          authorUsername: item.author.username,
          authorAvatarUrl: item.author.avatarUrl,
          authorUrl: item.author.url,
          timestamp: new Date(item.createdAt).getTime(),
          syncStatus: 'synced' as const
        }))

        // 批量写入本地数据库
        await localDB.transaction('rw', localDB.items, async () => {
          for (const item of localItems) {
            const existing = await localDB.items.get(item.id)

            if (existing) {
              // 更新现有数据
              await localDB.items.update(item.id, {
                ...item,
                localUpdatedAt: Date.now()
              })
              updatedItems++
            } else {
              // 添加新数据
              await localDB.items.add({
                ...item,
                localCreatedAt: Date.now(),
                localUpdatedAt: Date.now()
              })
              newItems++
            }
          }
        })

        totalSynced += batch.items.length
        hasMore = batch.hasMore
        page++

        console.log(`📦 同步进度: ${totalSynced} 条数据, 新增 ${newItems}, 更新 ${updatedItems}`)

        // 避免过于频繁的请求
        await new Promise(resolve => setTimeout(resolve, 100))

        // 防止无限循环
        if (page > 100) {
          console.warn(`⚠️ 同步页数过多，停止在第 ${page} 页`)
          break
        }
      }

      // 更新同步元数据
      await localDB.updateSyncStatus(repoKey, {
        lastSyncTime: Date.now(),
        lastItemTimestamp: totalSynced > 0 ? Date.now() : lastSyncTime,
        totalCount: await localDB.items.where('repoKey').equals(repoKey).count(),
        syncVersion: '1.0'
      })

      const duration = Date.now() - startTime
      const result: SyncResult = {
        success: true,
        repoKey,
        newItems,
        updatedItems,
        totalSynced,
        duration
      }

      console.log(`✅ 仓库 ${repoKey} 同步完成: 新增${newItems}, 更新${updatedItems}, 耗时${duration}ms`)

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : '未知错误'

      console.error(`❌ 仓库 ${repoKey} 同步失败:`, error)

      // 记录错误到同步元数据
      await localDB.updateSyncStatus(repoKey, {
        lastError: errorMessage
      }).catch(err => console.error('记录同步错误失败:', err))

      return {
        success: false,
        repoKey,
        newItems,
        updatedItems,
        totalSynced,
        error: errorMessage,
        duration
      }
    }
  }

  // 批量同步所有仓库
  async syncAllRepos(options: {
    onProgress?: (progress: {
      current: number
      total: number
      currentRepo: string
      status: string
    }) => void
    signal?: AbortSignal
  } = {}): Promise<BatchSyncResult> {

    if (this.syncInProgress) {
      throw new Error('同步已在进行中')
    }

    this.syncInProgress = true
    this.abortController = new AbortController()

    try {
      const repos = getReposConfig()
      const startTime = Date.now()
      const results: SyncResult[] = []
      let totalNewItems = 0
      let totalErrors = 0

      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i]
        const repoKey = `${repo.owner}/${repo.name}`

        if (options.signal?.aborted || this.abortController.signal.aborted) {
          break
        }

        options.onProgress?.({
          current: i,
          total: repos.length,
          currentRepo: repoKey,
          status: `正在同步 ${repoKey}...`
        })

        const result = await this.syncRepo(repoKey, {
          onProgress: (repoProgress) => {
            options.onProgress?.({
              current: i,
              total: repos.length,
              currentRepo: repoKey,
              status: repoProgress.status
            })
          },
          signal: this.abortController.signal
        })

        results.push(result)

        if (result.success) {
          totalNewItems += result.newItems
        } else {
          totalErrors++
        }
      }

      const batchResult: BatchSyncResult = {
        results,
        totalNewItems,
        totalErrors,
        duration: Date.now() - startTime
      }

      console.log(`🎉 批量同步完成: 新增${totalNewItems}条, 错误${totalErrors}个, 耗时${batchResult.duration}ms`)

      return batchResult

    } finally {
      this.syncInProgress = false
      this.abortController = null
    }
  }

  // 取消正在进行的同步
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort()
      console.log('🛑 用户取消同步')
    }
  }

  // 自动同步调度器
  async startAutoSync(options: {
    interval?: number           // 检查间隔 (默认5分钟)
    autoSyncThreshold?: number  // 自动同步阈值 (默认关闭自动同步)
    onlyWhenVisible?: boolean   // 只在页面可见时检查
    onUpdate?: (result: UpdateCheckResult) => void
    onError?: (error: Error) => void
  } = {}) {

    const {
      interval = 5 * 60 * 1000,  // 5分钟
      autoSyncThreshold = 0,     // 默认不自动同步，让用户决定
      onlyWhenVisible = true,
      onUpdate,
      onError
    } = options

    const checkAndSync = async () => {
      try {
        // 检查页面可见性
        if (onlyWhenVisible && typeof document !== 'undefined' && document.hidden) {
          return
        }

        // 检查网络状态
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return
        }

        // 检查更新
        const updateResult = await this.checkForUpdates()

        if (updateResult.hasUpdates) {
          onUpdate?.(updateResult)

          // 如果设置了自动同步阈值，并且新数据量超过阈值，自动同步
          if (autoSyncThreshold > 0 && updateResult.totalNewItems >= autoSyncThreshold) {
            console.log(`🤖 自动同步触发: 新数据${updateResult.totalNewItems}条 >= 阈值${autoSyncThreshold}`)
            await this.syncAllRepos()
          }
        }

      } catch (error) {
        console.warn('自动同步检查失败:', error)
        onError?.(error instanceof Error ? error : new Error('自动同步检查失败'))
      }
    }

    // 立即检查一次
    await checkAndSync()

    // 设置定时检查
    const intervalId = setInterval(checkAndSync, interval)

    // 监听页面可见性变化
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          checkAndSync()
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // 监听网络状态变化
    if (typeof window !== 'undefined') {
      const handleOnline = () => checkAndSync()
      window.addEventListener('online', handleOnline)
    }

    console.log(`🕒 自动同步已启动: 间隔${interval/1000}秒, 阈值${autoSyncThreshold}`)

    // 返回清理函数
    return () => {
      clearInterval(intervalId)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', checkAndSync)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', checkAndSync)
      }
      console.log('🕒 自动同步已停止')
    }
  }

  // 获取同步状态
  async getSyncStatus(): Promise<{
    isInProgress: boolean
    lastCheckTime?: number
    syncMetadata: SyncMetadata[]
    localStats: any
  }> {
    const [syncMetadata, localStats] = await Promise.all([
      localDB.getSyncStatus(),
      localDB.getStats()
    ])

    return {
      isInProgress: this.syncInProgress || this.checkInProgress,
      syncMetadata,
      localStats
    }
  }

  // 重置本地数据库
  async resetLocalDatabase(): Promise<void> {
    console.log('🗑️ 重置本地数据库...')

    await localDB.transaction('rw', [localDB.items, localDB.syncMeta], async () => {
      await localDB.items.clear()
      await localDB.syncMeta.clear()
    })

    console.log('✅ 本地数据库已重置')
  }
}

// 导出单例实例
export const syncManager = new SyncManager()

// 导出类型
export type { SyncManager }