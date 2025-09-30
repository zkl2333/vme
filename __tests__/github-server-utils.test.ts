import { describe, test, expect, jest, beforeEach } from '@jest/globals'

const mockItems = [
  {
    id: 'test-1',
    title: '测试段子1',
    url: 'https://github.com/test/repo/issues/1',
    body: '测试内容1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: {
      username: 'test-user',
      avatarUrl: 'https://example.com/avatar.jpg',
      url: 'https://github.com/test-user'
    },
    reactions: { totalCount: 5 },
    repository: {
      owner: 'test',
      name: 'repo',
      url: 'https://github.com/test/repo'
    }
  },
  {
    id: 'test-2',
    title: '测试段子2',
    url: 'https://github.com/test/repo/issues/2',
    body: '测试内容2',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    author: {
      username: 'test-user2',
      avatarUrl: 'https://example.com/avatar2.jpg',
      url: 'https://github.com/test-user2'
    },
    reactions: { totalCount: 3 },
    repository: {
      owner: 'test',
      name: 'repo',
      url: 'https://github.com/test/repo'
    }
  }
]

// Mock the database before any imports
const mockDatabase = {
  isCacheValid: jest.fn() as jest.MockedFunction<() => boolean>,
  warmupCache: jest.fn() as jest.MockedFunction<() => Promise<void>>,
  getPage: jest.fn() as jest.MockedFunction<(page: number, pageSize: number) => Promise<any>>,
  getRandomItem: jest.fn() as jest.MockedFunction<() => Promise<any>>,
  getPageByRepo: jest.fn() as jest.MockedFunction<(repoKey: string, page: number, pageSize: number) => Promise<any>>,
  getCacheStats: jest.fn() as jest.MockedFunction<() => any>,
  syncLatest: jest.fn() as jest.MockedFunction<() => Promise<void>>,
  handleWebhook: jest.fn() as jest.MockedFunction<(payload: any) => Promise<void>>,
  getAllIssues: jest.fn() as jest.MockedFunction<() => Promise<any[]>>
}

jest.mock('../src/lib/multi-repo-github-db', () => ({
  MultiRepoGitHubDatabase: jest.fn(() => mockDatabase),
  resetCache: jest.fn()
}))

describe('GitHub Server Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset environment variables
    process.env.GITHUB_TOKEN = 'test-token'

    // Reset mock database to defaults
    mockDatabase.isCacheValid.mockReturnValue(true)
    mockDatabase.warmupCache.mockResolvedValue(undefined)
    mockDatabase.getPage.mockResolvedValue({
      items: mockItems,
      total: mockItems.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    })
    mockDatabase.getRandomItem.mockResolvedValue(mockItems[0])
    mockDatabase.getPageByRepo.mockResolvedValue({
      items: mockItems,
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      repoStats: { 'test/repo': 2 }
    })
    mockDatabase.getCacheStats.mockReturnValue({
      isValid: true,
      totalCount: 2,
      lastUpdate: new Date(),
      repoStats: { 'test/repo': { count: 2, lastUpdated: new Date() } }
    })
  })

  describe('getAllKfcItems', () => {
    test('should return all items when cache is valid', async () => {
      // Re-import the functions to get fresh instances
      const {
        getAllKfcItems
      } = await import('../src/lib/github-server-utils')

      const items = await getAllKfcItems()

      expect(mockDatabase.warmupCache).not.toHaveBeenCalled()
      expect(items).toEqual(mockItems)
    })

    test('should warm up cache if invalid', async () => {
      mockDatabase.isCacheValid.mockReturnValue(false)

      const {
        getAllKfcItems
      } = await import('../src/lib/github-server-utils')

      const items = await getAllKfcItems()

      expect(mockDatabase.warmupCache).toHaveBeenCalled()
      expect(items).toEqual(mockItems)
    })
  })

  describe('getKfcItemsWithPagination', () => {
    test('should return paginated results', async () => {
      const paginatedResult = {
        items: [mockItems[0]],
        total: 2,
        page: 1,
        pageSize: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false
      }

      mockDatabase.getPage.mockResolvedValue(paginatedResult)

      const {
        getKfcItemsWithPagination
      } = await import('../src/lib/github-server-utils')

      const result = await getKfcItemsWithPagination(1, 1)

      expect(result).toEqual(paginatedResult)
      expect(mockDatabase.getPage).toHaveBeenCalledWith(1, 1)
    })

    test('should use default pagination parameters', async () => {
      const {
        getKfcItemsWithPagination
      } = await import('../src/lib/github-server-utils')

      await getKfcItemsWithPagination()

      expect(mockDatabase.getPage).toHaveBeenCalledWith(1, 20)
    })
  })

  describe('getRandomKfcItem', () => {
    test('should return a random item', async () => {
      const {
        getRandomKfcItem
      } = await import('../src/lib/github-server-utils')

      const item = await getRandomKfcItem()

      expect(item).toEqual(mockItems[0])
      expect(mockDatabase.getRandomItem).toHaveBeenCalled()
    })
  })

  describe('getItemsByRepo', () => {
    test('should return items filtered by repository', async () => {
      const {
        getItemsByRepo
      } = await import('../src/lib/github-server-utils')

      const result = await getItemsByRepo('test/repo', 1, 20)

      expect(result).toEqual({
        items: mockItems,
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        repoStats: { 'test/repo': 2 }
      })
      expect(mockDatabase.getPageByRepo).toHaveBeenCalledWith('test/repo', 1, 20)
    })
  })

  describe('getCacheStats', () => {
    test('should return cache statistics', async () => {
      const {
        getCacheStats
      } = await import('../src/lib/github-server-utils')

      const stats = await getCacheStats()

      expect(stats.isValid).toBe(true)
      expect(stats.totalCount).toBe(2)
    })
  })

  describe('refreshCache', () => {
    test('should call warmupCache on database', async () => {
      const {
        refreshCache
      } = await import('../src/lib/github-server-utils')

      await refreshCache()

      expect(mockDatabase.warmupCache).toHaveBeenCalled()
    })
  })

  describe('getReposConfig', () => {
    test('should return repository configuration', async () => {
      const {
        getReposConfig
      } = await import('../src/lib/github-server-utils')

      const config = getReposConfig()

      expect(config).toEqual([
        {
          owner: 'zkl2333',
          name: 'vme',
          label: '文案'
        }
      ])
    })
  })

  describe('healthCheck', () => {
    test('should return healthy status when cache is valid', async () => {
      const {
        healthCheck
      } = await import('../src/lib/github-server-utils')

      const health = await healthCheck()

      expect(health.status).toBe('healthy')
      expect(health.cache.totalCount).toBe(2)
    })

    test('should return unhealthy status when cache is invalid', async () => {
      mockDatabase.getCacheStats.mockReturnValue({
        isValid: false,
        totalCount: 0,
        lastUpdate: new Date(),
        repoStats: {}
      })

      const {
        healthCheck
      } = await import('../src/lib/github-server-utils')

      const health = await healthCheck()

      expect(health.status).toBe('unhealthy')
      expect(health.errors).toContain('缓存已过期')
      expect(health.errors).toContain('没有可用数据')
    })

    test('should handle errors gracefully', async () => {
      mockDatabase.getCacheStats.mockImplementation(() => {
        throw new Error('Database error')
      })

      const {
        healthCheck
      } = await import('../src/lib/github-server-utils')

      const health = await healthCheck()

      expect(health.status).toBe('unhealthy')
      expect(health.errors).toContain('系统错误: Database error')
    })
  })
})