import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

// 创建模拟数据
const mockItems = [
  {
    id: 'test-1',
    title: '测试段子1',
    body: '测试内容1',
    repository: { owner: 'test', name: 'repo', url: 'https://github.com/test/repo' }
  },
  {
    id: 'test-2',
    title: '测试段子2',
    body: '测试内容2',
    repository: { owner: 'test2', name: 'repo2', url: 'https://github.com/test2/repo2' }
  }
]

// Mock functions that will be set up in beforeEach
let mockGetAllKfcItems: jest.Mock
let mockGetKfcItemsWithPagination: jest.Mock
let mockGetRandomKfcItem: jest.Mock
let mockGetOctokitInstance: jest.Mock
let mockGetIssueStats: jest.Mock

// Mock the modules
jest.mock('../src/lib/multi-repo-github-db', () => ({
  MultiRepoGitHubDatabase: jest.fn(),
  resetCache: jest.fn(),
}))

jest.mock('../src/lib/github-server-utils', () => ({
  getAllKfcItems: jest.fn(),
  getKfcItemsWithPagination: jest.fn(),
  getRandomKfcItem: jest.fn(),
  getOctokitInstance: jest.fn(),
}))

jest.mock('../src/app/lib/github-stats', () => ({
  getIssueStats: jest.fn(),
}))

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Get mock functions
    const githubServerUtils = require('../src/lib/github-server-utils')
    const githubStats = require('../src/app/lib/github-stats')

    mockGetAllKfcItems = githubServerUtils.getAllKfcItems as jest.Mock
    mockGetKfcItemsWithPagination = githubServerUtils.getKfcItemsWithPagination as jest.Mock
    mockGetRandomKfcItem = githubServerUtils.getRandomKfcItem as jest.Mock
    mockGetOctokitInstance = githubServerUtils.getOctokitInstance as jest.Mock
    mockGetIssueStats = githubStats.getIssueStats as jest.Mock

    // Default mock implementations
    mockGetOctokitInstance.mockResolvedValue({})
    mockGetIssueStats.mockResolvedValue({
      reactions: 5,
      reactionDetails: [],
      reactionNodes: []
    })
  })

  describe('/api/items', () => {
    test('should return all items successfully', async () => {
      mockGetAllKfcItems.mockResolvedValue(mockItems)

      const { GET: getItems } = require('../src/app/api/items/route')
      const response = await getItems()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        items: mockItems,
        total: 2,
        source: 'github-issues',
        repos: {
          'test/repo': 1,
          'test2/repo2': 1
        }
      })
    })

    test('should handle errors gracefully', async () => {
      mockGetAllKfcItems.mockRejectedValue(new Error('Database error'))

      const { GET: getItems } = require('../src/app/api/items/route')
      const response = await getItems()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toMatchObject({
        error: 'Internal Server Error',
        message: 'Database error',
        source: 'github-issues'
      })
    })

    test('should set correct CORS headers', async () => {
      mockGetAllKfcItems.mockResolvedValue(mockItems)

      const { GET: getItems } = require('../src/app/api/items/route')
      const response = await getItems()

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS, HEAD')
    })
  })

  describe('/api/random', () => {
    test('should return random item with reactions', async () => {
      mockGetRandomKfcItem.mockResolvedValue(mockItems[0])

      const { GET: getRandom } = require('../src/app/api/random/route')
      const request = new NextRequest('http://localhost:3000/api/random')
      const response = await getRandom(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'test-1',
        title: '测试段子1',
        source: 'github-issues',
        repository: mockItems[0].repository,
        reactions: {
          totalCount: 5,
          details: [],
          nodes: []
        }
      })
    })

    test('should return text format when requested', async () => {
      mockGetRandomKfcItem.mockResolvedValue(mockItems[0])

      const { GET: getRandom } = require('../src/app/api/random/route')
      const request = new NextRequest('http://localhost:3000/api/random?format=text')
      const response = await getRandom(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(text).toBe('测试内容1')
    })

    test('should handle no data available', async () => {
      mockGetRandomKfcItem.mockResolvedValue(null)

      const { GET: getRandom } = require('../src/app/api/random/route')
      const request = new NextRequest('http://localhost:3000/api/random')
      const response = await getRandom(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No data available')
    })
  })

  describe('/api/items/page', () => {
    test('should return paginated data', async () => {
      const paginatedResult = {
        items: [mockItems[0]],
        total: 2,
        page: 1,
        pageSize: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false
      }

      mockGetKfcItemsWithPagination.mockResolvedValue(paginatedResult)

      const { GET: getPage } = require('../src/app/api/items/page/route')
      const request = new NextRequest('http://localhost:3000/api/items/page?page=1&pageSize=1')
      const response = await getPage(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        ...paginatedResult,
        source: 'github-issues'
      })
    })

    test('should handle repo filter parameter', async () => {
      const filteredResult = {
        items: [mockItems[0]], // Only one item should match the filter
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }

      mockGetKfcItemsWithPagination.mockResolvedValue(filteredResult)

      const { GET: getPage } = require('../src/app/api/items/page/route')
      const request = new NextRequest('http://localhost:3000/api/items/page?repo=test/repo')
      const response = await getPage(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filter).toEqual({ repo: 'test/repo' })
      expect(data.items).toHaveLength(1) // 应该被过滤
    })

    test('should use default pagination values', async () => {
      const defaultResult = {
        items: mockItems,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }

      mockGetKfcItemsWithPagination.mockResolvedValue(defaultResult)

      const { GET: getPage } = require('../src/app/api/items/page/route')
      const request = new NextRequest('http://localhost:3000/api/items/page')
      await getPage(request)

      expect(mockGetKfcItemsWithPagination).toHaveBeenCalledWith(1, 10)
    })
  })

  describe('Error Handling', () => {
    test('should handle server errors consistently', async () => {
      mockGetAllKfcItems.mockRejectedValue(new Error('Unexpected error'))

      const { GET: getItems } = require('../src/app/api/items/route')
      const response = await getItems()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.source).toBe('github-issues')
    })
  })
})