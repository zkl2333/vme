/**
 * 本地数据库定义 - 使用 Dexie + IndexedDB
 * 存储段子静态内容，实现高性能本地分页
 */

import Dexie, { Table } from 'dexie'

// 本地存储的段子数据结构
export interface LocalKfcItem {
  id: string                    // GitHub Issue ID (主键)
  title: string
  body: string
  createdAt: string            // ISO 字符串
  updatedAt: string

  // 仓库信息
  repoOwner: string
  repoName: string
  repoKey: string              // "owner/name" (索引)

  // 作者信息
  authorUsername: string
  authorAvatarUrl: string
  authorUrl: string

  // 索引字段
  timestamp: number            // 数值时间戳，用于高效排序 (索引)

  // 可选的静态 reactions 数据 (缓存)
  reactions?: {
    totalCount: number
    [key: string]: any
  }

  // 本地管理字段
  localCreatedAt: number       // 本地存储时间
  localUpdatedAt: number       // 本地更新时间
  syncStatus: 'synced' | 'pending' | 'error'
}

// 同步元数据
export interface SyncMetadata {
  id: string                   // 主键，通常是 repoKey
  repoKey: string             // "owner/name"
  lastSyncTime: number        // 最后同步时间戳
  lastItemTimestamp: number   // 最后同步的 Item 时间戳
  totalCount: number          // 该仓库的 Item 总数
  syncVersion: string         // 同步版本号
  lastError?: string          // 最后的错误信息
}

// 数据库类定义
class LocalKfcDatabase extends Dexie {
  // 数据表定义
  items!: Table<LocalKfcItem>
  syncMeta!: Table<SyncMetadata>

  constructor() {
    super('KfcDatabase')

    // 定义数据库版本和索引
    this.version(1).stores({
      // items 表索引
      items: 'id, repoKey, timestamp, createdAt, syncStatus, authorUsername',
      // syncMeta 表索引
      syncMeta: 'id, repoKey, lastSyncTime'
    })

    // 数据钩子
    this.items.hook('creating', (primKey, obj, trans) => {
      obj.localCreatedAt = Date.now()
      obj.localUpdatedAt = Date.now()
    })

    this.items.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).localUpdatedAt = Date.now()
    })
  }

  // 高性能分页查询
  async getPage(options: {
    page: number
    pageSize: number
    repoKey?: string
    startTime?: number
    endTime?: number
    sortOrder?: 'desc' | 'asc'
    searchKeyword?: string
  }) {
    const {
      page,
      pageSize,
      repoKey,
      startTime,
      endTime,
      sortOrder = 'desc',
      searchKeyword
    } = options

    // 构建查询
    let query = this.items.orderBy('timestamp')

    if (sortOrder === 'desc') {
      query = query.reverse()
    }

    // 应用过滤器
    if (repoKey) {
      query = query.filter(item => item.repoKey === repoKey)
    }

    if (startTime || endTime) {
      query = query.filter(item => {
        if (startTime && item.timestamp < startTime) return false
        if (endTime && item.timestamp > endTime) return false
        return true
      })
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      query = query.filter(item =>
        item.title.toLowerCase().includes(keyword) ||
        item.body.toLowerCase().includes(keyword)
      )
    }

    // 计算分页
    const offset = (page - 1) * pageSize
    const items = await query.offset(offset).limit(pageSize).toArray()
    const totalCount = await query.count()

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: offset + pageSize < totalCount,
        hasPreviousPage: page > 1,
        startIndex: offset + 1,
        endIndex: Math.min(offset + pageSize, totalCount)
      }
    }
  }

  // 全文搜索
  async search(keyword: string, options: {
    limit?: number
    repoKey?: string
  } = {}) {
    const { limit = 50, repoKey } = options
    const searchTerm = keyword.toLowerCase()

    let query = this.items.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.body.toLowerCase().includes(searchTerm) ||
      item.authorUsername.toLowerCase().includes(searchTerm)
    )

    if (repoKey) {
      query = query.filter(item => item.repoKey === repoKey)
    }

    return await query
      .reverse() // 最新的在前
      .limit(limit)
      .toArray()
  }

  // 随机获取
  async getRandomItem(repoKey?: string): Promise<LocalKfcItem | undefined> {
    let query = this.items.toCollection()

    if (repoKey) {
      query = this.items.where('repoKey').equals(repoKey)
    }

    const count = await query.count()
    if (count === 0) return undefined

    const randomOffset = Math.floor(Math.random() * count)
    const items = await query.offset(randomOffset).limit(1).toArray()

    return items[0]
  }

  // 获取仓库统计信息
  async getRepoStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {}

    await this.items.orderBy('repoKey').eachKey(key => {
      const repoKey = key as string
      return this.items.where('repoKey').equals(repoKey).count()
        .then(count => {
          stats[repoKey] = count
        })
    })

    return stats
  }

  // 批量添加数据
  async batchAdd(items: Omit<LocalKfcItem, 'localCreatedAt' | 'localUpdatedAt'>[]): Promise<void> {
    const now = Date.now()

    const itemsWithMeta = items.map(item => ({
      ...item,
      localCreatedAt: now,
      localUpdatedAt: now,
      timestamp: new Date(item.createdAt).getTime()
    }))

    await this.transaction('rw', this.items, async () => {
      await this.items.bulkAdd(itemsWithMeta)
    })
  }

  // 批量更新数据
  async batchUpdate(items: Partial<LocalKfcItem>[]): Promise<void> {
    await this.transaction('rw', this.items, async () => {
      for (const item of items) {
        if (item.id) {
          await this.items.update(item.id, {
            ...item,
            localUpdatedAt: Date.now()
          })
        }
      }
    })
  }

  // 清理旧数据
  async cleanup(options: {
    keepRecentDays?: number
    maxItems?: number
  } = {}) {
    const { keepRecentDays = 90, maxItems = 50000 } = options

    // 删除过旧的数据
    if (keepRecentDays > 0) {
      const cutoffTime = Date.now() - (keepRecentDays * 24 * 60 * 60 * 1000)
      await this.items.where('timestamp').below(cutoffTime).delete()
    }

    // 保持最大数量限制
    const totalCount = await this.items.count()
    if (totalCount > maxItems) {
      const excessCount = totalCount - maxItems
      // 删除最老的数据
      const oldItems = await this.items
        .orderBy('timestamp')
        .limit(excessCount)
        .primaryKeys()

      await this.items.bulkDelete(oldItems)
    }
  }

  // 获取同步状态
  async getSyncStatus(repoKey?: string): Promise<SyncMetadata[]> {
    if (repoKey) {
      const meta = await this.syncMeta.get(repoKey)
      return meta ? [meta] : []
    }

    return await this.syncMeta.toArray()
  }

  // 更新同步状态
  async updateSyncStatus(repoKey: string, updates: Partial<SyncMetadata>): Promise<void> {
    await this.syncMeta.put({
      id: repoKey,
      repoKey,
      lastSyncTime: Date.now(),
      lastItemTimestamp: 0,
      totalCount: 0,
      syncVersion: '1.0',
      ...updates
    })
  }

  // 数据库统计信息
  async getStats() {
    const [totalItems, repoStats, syncStatus] = await Promise.all([
      this.items.count(),
      this.getRepoStats(),
      this.getSyncStatus()
    ])

    const oldestItem = await this.items.orderBy('timestamp').first()
    const newestItem = await this.items.orderBy('timestamp').last()

    return {
      totalItems,
      repoStats,
      syncStatus,
      dateRange: {
        oldest: oldestItem?.createdAt,
        newest: newestItem?.createdAt
      },
      lastUpdated: Math.max(...syncStatus.map(s => s.lastSyncTime))
    }
  }
}

// 单例数据库实例
export const localDB = new LocalKfcDatabase()

// 数据库初始化
export async function initLocalDB(): Promise<void> {
  try {
    await localDB.open()
    console.log('✅ 本地数据库初始化成功')
  } catch (error) {
    console.error('❌ 本地数据库初始化失败:', error)
    throw error
  }
}

// 数据库清理和维护
export async function maintainLocalDB(): Promise<void> {
  try {
    await localDB.cleanup({
      keepRecentDays: 180,  // 保留6个月数据
      maxItems: 100000      // 最多10万条
    })
    console.log('✅ 本地数据库维护完成')
  } catch (error) {
    console.error('❌ 本地数据库维护失败:', error)
  }
}

// 导出类型 (避免重复导出)
export type { LocalKfcItem as LocalKfcItemType, SyncMetadata as SyncMetadataType }