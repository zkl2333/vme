/**
 * React Hook 集成 - 本地数据库 + 同步管理
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { localDB, LocalKfcItem, initLocalDB } from '@/lib/local-db'
import { syncManager, SyncStatus, UpdateCheckResult, SyncResult, BatchSyncResult } from '@/lib/sync-manager'

// Hook 返回的数据结构
interface UseLocalKfcDataReturn {
  // 数据
  items: LocalKfcItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    startIndex: number
    endIndex: number
  } | null

  // 状态
  isLoading: boolean
  syncStatus: SyncStatus
  hasUpdates: boolean
  error: string | null

  // 操作方法
  loadPage: (options: {
    page: number
    pageSize?: number
    repoKey?: string
    searchKeyword?: string
  }) => Promise<void>

  checkUpdates: () => Promise<UpdateCheckResult | null>
  syncData: (repoKey?: string) => Promise<SyncResult | BatchSyncResult | null>
  search: (keyword: string, options?: { limit?: number, repoKey?: string }) => Promise<LocalKfcItem[]>
  getRandomItem: (repoKey?: string) => Promise<LocalKfcItem | undefined>

  // 数据管理
  refreshData: () => Promise<void>
  resetDatabase: () => Promise<void>

  // 统计信息
  getStats: () => Promise<any>
}

// Hook 选项
interface UseLocalKfcDataOptions {
  // 初始化选项
  autoInit?: boolean          // 自动初始化数据库
  enableAutoSync?: boolean    // 启用自动同步
  autoSyncInterval?: number   // 自动同步间隔（毫秒）

  // 初始加载
  initialPage?: number
  initialPageSize?: number
  initialRepoKey?: string

  // 错误处理
  onError?: (error: Error) => void
  onSyncUpdate?: (result: UpdateCheckResult) => void
}

export function useLocalKfcData(options: UseLocalKfcDataOptions = {}): UseLocalKfcDataReturn {
  const {
    autoInit = true,
    enableAutoSync = false,
    autoSyncInterval = 5 * 60 * 1000,
    initialPage = 1,
    initialPageSize = 20,
    initialRepoKey,
    onError,
    onSyncUpdate
  } = options

  // 状态管理
  const [items, setItems] = useState<LocalKfcItem[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [hasUpdates, setHasUpdates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs
  const autoSyncCleanupRef = useRef<(() => void) | null>(null)
  const isInitializingRef = useRef(false)

  // 错误处理
  const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : '未知错误'
    setError(errorMessage)
    onError?.(err instanceof Error ? err : new Error(errorMessage))
    console.error('useLocalKfcData 错误:', err)
  }, [onError])

  // 初始化数据库
  const initializeDatabase = useCallback(async () => {
    if (isInitializingRef.current || isInitialized) return

    isInitializingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      // 初始化本地数据库
      await initLocalDB()
      console.log('✅ 本地数据库初始化完成')

      // 检查是否有本地数据
      const stats = await localDB.getStats()
      console.log('📊 本地数据统计:', stats)

      // 如果没有本地数据，尝试首次同步
      if (stats.totalItems === 0) {
        console.log('🔄 检测到空数据库，开始首次同步...')
        setSyncStatus('syncing')

        try {
          await syncManager.syncAllRepos({
            onProgress: (progress) => {
              console.log(`同步进度: ${progress.current}/${progress.total} - ${progress.currentRepo}`)
            }
          })
          console.log('✅ 首次同步完成')
        } catch (syncError) {
          console.warn('⚠️ 首次同步失败，将使用增量同步:', syncError)
        } finally {
          setSyncStatus('idle')
        }
      }

      setIsInitialized(true)

      // 加载初始数据
      await loadPageInternal({
        page: initialPage,
        pageSize: initialPageSize,
        repoKey: initialRepoKey
      })

    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }, [isInitialized, initialPage, initialPageSize, initialRepoKey, handleError])

  // 内部分页加载函数（避免 useCallback 循环依赖）
  const loadPageInternal = async (options: {
    page: number
    pageSize?: number
    repoKey?: string
    searchKeyword?: string
  }) => {
    if (!isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await localDB.getPage({
        page: options.page,
        pageSize: options.pageSize || 20,
        repoKey: options.repoKey,
        searchKeyword: options.searchKeyword
      })

      setItems(result.items)
      setPagination({
        ...result.pagination,
        startIndex: (result.pagination.page - 1) * result.pagination.pageSize + 1,
        endIndex: Math.min(result.pagination.page * result.pagination.pageSize, result.pagination.totalCount)
      })

      console.log(`📄 加载第${options.page}页: ${result.items.length}/${result.pagination.totalCount} 条数据`)

    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 加载分页数据
  const loadPage = useCallback(async (options: {
    page: number
    pageSize?: number
    repoKey?: string
    searchKeyword?: string
  }) => {
    await loadPageInternal(options)
  }, [isInitialized, handleError])

  // 检查更新
  const checkUpdates = useCallback(async (): Promise<UpdateCheckResult | null> => {
    if (syncStatus !== 'idle') return null

    setSyncStatus('checking')
    setError(null)

    try {
      const result = await syncManager.checkForUpdates()
      setHasUpdates(result.hasUpdates)

      if (result.hasUpdates) {
        onSyncUpdate?.(result)
        console.log(`🔔 发现更新: ${result.totalNewItems} 条新数据`)
      }

      return result

    } catch (err) {
      handleError(err)
      return null
    } finally {
      setSyncStatus('idle')
    }
  }, [syncStatus, handleError, onSyncUpdate])

  // 同步数据
  const syncData = useCallback(async (repoKey?: string): Promise<SyncResult | BatchSyncResult | null> => {
    if (syncStatus !== 'idle') return null

    setSyncStatus('syncing')
    setError(null)

    try {
      let result: SyncResult | BatchSyncResult

      if (repoKey) {
        // 同步单个仓库
        result = await syncManager.syncRepo(repoKey, {
          onProgress: (progress) => {
            console.log(`同步 ${repoKey}: ${progress.status}`)
          }
        })
      } else {
        // 同步所有仓库
        result = await syncManager.syncAllRepos({
          onProgress: (progress) => {
            console.log(`批量同步: ${progress.current}/${progress.total} - ${progress.currentRepo}`)
          }
        })
      }

      // 同步成功后重新加载当前页面数据
      if (pagination) {
        await loadPage({
          page: pagination.page,
          pageSize: pagination.pageSize
        })
      }

      setHasUpdates(false)
      console.log('✅ 数据同步完成')

      return result

    } catch (err) {
      handleError(err)
      return null
    } finally {
      setSyncStatus('idle')
    }
  }, [syncStatus, pagination, loadPage, handleError])

  // 搜索
  const search = useCallback(async (
    keyword: string,
    options?: { limit?: number, repoKey?: string }
  ): Promise<LocalKfcItem[]> => {
    if (!isInitialized) return []

    try {
      return await localDB.search(keyword, options)
    } catch (err) {
      handleError(err)
      return []
    }
  }, [isInitialized, handleError])

  // 随机获取
  const getRandomItem = useCallback(async (repoKey?: string): Promise<LocalKfcItem | undefined> => {
    if (!isInitialized) return undefined

    try {
      return await localDB.getRandomItem(repoKey)
    } catch (err) {
      handleError(err)
      return undefined
    }
  }, [isInitialized, handleError])

  // 刷新数据
  const refreshData = useCallback(async () => {
    if (pagination) {
      await loadPage({
        page: pagination.page,
        pageSize: pagination.pageSize
      })
    }
  }, [pagination, loadPage])

  // 重置数据库
  const resetDatabase = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await syncManager.resetLocalDatabase()
      setItems([])
      setPagination(null)
      setHasUpdates(false)
      setIsInitialized(false)

      // 重新初始化
      if (autoInit) {
        await initializeDatabase()
      }

      console.log('🗑️ 数据库已重置')

    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [autoInit, initializeDatabase, handleError])

  // 获取统计信息
  const getStats = useCallback(async () => {
    if (!isInitialized) return null

    try {
      const [localStats, syncStatus] = await Promise.all([
        localDB.getStats(),
        syncManager.getSyncStatus()
      ])

      return {
        local: localStats,
        sync: syncStatus
      }
    } catch (err) {
      handleError(err)
      return null
    }
  }, [isInitialized, handleError])

  // 组件挂载时初始化
  useEffect(() => {
    if (autoInit && !isInitialized && !isInitializingRef.current) {
      initializeDatabase()
    }
  }, [autoInit, isInitialized, initializeDatabase])

  // 启用自动同步
  useEffect(() => {
    if (!enableAutoSync || !isInitialized) return

    console.log('🕒 启动自动同步...')

    const cleanup = syncManager.startAutoSync({
      interval: autoSyncInterval,
      autoSyncThreshold: 0, // 不自动同步，只检查
      onlyWhenVisible: true,
      onUpdate: (result) => {
        setHasUpdates(result.hasUpdates)
        onSyncUpdate?.(result)
      },
      onError: (error) => {
        handleError(error)
      }
    })

    // 存储清理函数
    cleanup.then(cleanupFn => {
      autoSyncCleanupRef.current = cleanupFn
    })

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [enableAutoSync, isInitialized, autoSyncInterval, onSyncUpdate, handleError])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (autoSyncCleanupRef.current) {
        autoSyncCleanupRef.current()
      }
    }
  }, [])

  return {
    // 数据
    items,
    pagination,

    // 状态
    isLoading,
    syncStatus,
    hasUpdates,
    error,

    // 操作方法
    loadPage,
    checkUpdates,
    syncData,
    search,
    getRandomItem,

    // 数据管理
    refreshData,
    resetDatabase,

    // 统计信息
    getStats
  }
}

// 导出类型
export type { UseLocalKfcDataReturn, UseLocalKfcDataOptions }