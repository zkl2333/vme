import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

// Simple mock functions that we'll override per test
const mockGetItemsByRepo = jest.fn() as jest.MockedFunction<(repoKey: string, page: number, pageSize: number) => Promise<any>>
const mockGetReposConfig = jest.fn() as jest.MockedFunction<() => any[]>
const mockHealthCheck = jest.fn() as jest.MockedFunction<() => Promise<any>>
const mockRefreshCache = jest.fn() as jest.MockedFunction<() => Promise<void>>
const mockGetCacheStats = jest.fn() as jest.MockedFunction<() => Promise<any>>

// Mock the github-server-utils module
jest.mock('../src/lib/github-server-utils', () => ({
  getItemsByRepo: (...args: any[]) => mockGetItemsByRepo(...args),
  getReposConfig: (...args: any[]) => mockGetReposConfig(...args),
  healthCheck: (...args: any[]) => mockHealthCheck(...args),
  refreshCache: (...args: any[]) => mockRefreshCache(...args),
  getCacheStats: (...args: any[]) => mockGetCacheStats(...args)
}))

describe('New API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetItemsByRepo.mockClear()
    mockGetReposConfig.mockClear()
    mockHealthCheck.mockClear()
    mockRefreshCache.mockClear()
    mockGetCacheStats.mockClear()

    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn()
    }
  })

  describe('/api/repos', () => {
    describe('GET', () => {
      test('should return repo data when repo parameter provided', async () => {
        const repoResult = {
          items: [{ id: 'test-1', title: 'Test' }],
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }

        mockGetItemsByRepo.mockResolvedValue(repoResult)

        // Import after setting up mocks
        const { GET: getRepos } = await import('../src/app/api/repos/route')

        const request = new NextRequest('http://localhost:3000/api/repos?repo=test/repo&page=1&pageSize=20')
        const response = await getRepos(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          ...repoResult,
          source: 'github-issues',
          repository: 'test/repo'
        })
        expect(mockGetItemsByRepo).toHaveBeenCalledWith('test/repo', 1, 20)
      })

      test('should return error when repo parameter missing', async () => {
        const { GET: getRepos } = await import('../src/app/api/repos/route')

        const request = new NextRequest('http://localhost:3000/api/repos')
        const response = await getRepos(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Bad Request')
        expect(data.message).toBe('缺少 repo 参数')
      })
    })

    describe('POST', () => {
      test('should return repos configuration', async () => {
        const mockRepos = [
          { owner: 'test', name: 'repo1', label: '文案' },
          { owner: 'test', name: 'repo2', label: '段子' }
        ]

        mockGetReposConfig.mockReturnValue(mockRepos)

        const { POST: getReposConfig } = await import('../src/app/api/repos/route')

        const response = await getReposConfig()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          repos: [
            {
              key: 'test/repo1',
              owner: 'test',
              name: 'repo1',
              label: '文案',
              url: 'https://github.com/test/repo1'
            },
            {
              key: 'test/repo2',
              owner: 'test',
              name: 'repo2',
              label: '段子',
              url: 'https://github.com/test/repo2'
            }
          ],
          total: 2,
          source: 'github-issues'
        })
      })
    })
  })

  describe('/api/health', () => {
    describe('GET', () => {
      test('should return healthy status', async () => {
        const mockHealth = {
          status: 'healthy',
          cache: {
            isValid: true,
            totalCount: 100,
            lastUpdate: new Date(),
            repoStats: { 'test/repo': { count: 100 } }
          },
          repos: [{ owner: 'test', name: 'repo' }]
        }

        mockHealthCheck.mockResolvedValue(mockHealth)

        const { GET: healthGet } = await import('../src/app/api/health/route')

        const response = await healthGet()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('healthy')
        expect(data.cache.totalCount).toBe(100)
        expect(data.source).toBe('github-issues')
        expect(data.timestamp).toBeDefined()
      })

      test('should return unhealthy status', async () => {
        const mockHealth = {
          status: 'unhealthy',
          cache: { isValid: false, totalCount: 0 },
          repos: [],
          errors: ['缓存已过期', '没有可用数据']
        }

        mockHealthCheck.mockResolvedValue(mockHealth)

        const { GET: healthGet } = await import('../src/app/api/health/route')

        const response = await healthGet()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('unhealthy')
        expect(data.errors).toContain('缓存已过期')
      })

      test('should handle health check errors', async () => {
        mockHealthCheck.mockRejectedValue(new Error('Health check failed'))

        const { GET: healthGet } = await import('../src/app/api/health/route')

        const response = await healthGet()
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.status).toBe('unhealthy')
        expect(data.error).toBe('Health check failed')
      })
    })

    describe('POST', () => {
      test('should refresh cache successfully', async () => {
        const mockStats = {
          isValid: true,
          totalCount: 150,
          lastUpdate: new Date('2025-09-30T05:05:39.000Z')
        }

        mockRefreshCache.mockResolvedValue(undefined)
        mockGetCacheStats.mockResolvedValue(mockStats)

        const { POST: healthPost } = await import('../src/app/api/health/route')

        const response = await healthPost()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toBe('缓存刷新成功')
        expect(data.cache.isValid).toBe(true)
        expect(data.cache.totalCount).toBe(150)
        expect(data.duration).toMatch(/\d+ms/)
      })

      test('should handle cache refresh errors', async () => {
        mockRefreshCache.mockRejectedValue(new Error('Cache refresh failed'))

        const { POST: healthPost } = await import('../src/app/api/health/route')

        const response = await healthPost()
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Cache refresh failed')
      })
    })
  })

  describe('CORS Headers', () => {
    test('all routes should set correct CORS headers', async () => {
      mockGetReposConfig.mockReturnValue([])

      const { POST: getReposConfig } = await import('../src/app/api/repos/route')

      const response = await getReposConfig()

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
    })
  })
})