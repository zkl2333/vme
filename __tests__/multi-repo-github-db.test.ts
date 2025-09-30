import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { MultiRepoGitHubDatabase, resetCache } from '../src/lib/multi-repo-github-db'
import { Repository } from '../src/types'

// Mock graphql function - 使用 any 类型避免类型检查问题
const mockGraphql = jest.fn() as any

// Mock Octokit
jest.mock('@octokit/core', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    graphql: mockGraphql
  }))
}))

// Mock 数据
const mockRepos: Repository[] = [
  { owner: 'test-owner', name: 'test-repo', label: '文案', state: 'ALL' }
]

const mockIssueData = {
  repository: {
    issues: {
      totalCount: 2,
      pageInfo: {
        hasNextPage: false,
        endCursor: 'end-cursor'
      },
      nodes: [
        {
          id: 'issue-1',
          number: 1,
          title: '测试段子1',
          body: '这是一个测试段子内容1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          author: {
            login: 'test-user',
            avatarUrl: 'https://example.com/avatar.jpg',
            url: 'https://github.com/test-user'
          },
          url: 'https://github.com/test-owner/test-repo/issues/1',
          reactions: {
            totalCount: 5
          }
        },
        {
          id: 'issue-2',
          number: 2,
          title: '测试段子2',
          body: '这是一个测试段子内容2',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          author: {
            login: 'test-user2',
            avatarUrl: 'https://example.com/avatar2.jpg',
            url: 'https://github.com/test-user2'
          },
          url: 'https://github.com/test-owner/test-repo/issues/2',
          reactions: {
            totalCount: 3
          }
        }
      ]
    }
  }
}

describe('MultiRepoGitHubDatabase', () => {
  let database: MultiRepoGitHubDatabase

  beforeEach(() => {
    // 重置 mocks
    jest.clearAllMocks()
    mockGraphql.mockResolvedValue(mockIssueData)

    // 重置缓存状态
    resetCache()

    database = new MultiRepoGitHubDatabase('test-token', mockRepos)
  })

  describe('constructor', () => {
    test('should create instance with token and repos', () => {
      expect(database).toBeDefined()
      expect(database.isCacheValid()).toBe(false)
    })
  })

  describe('getAllIssues', () => {
    test('should fetch and return all issues from all repos', async () => {
      const issues = await database.getAllIssues()

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({
        id: 'issue-2', // 应该按时间倒序排列
        title: '测试段子2',
        body: '这是一个测试段子内容2',
        repository: {
          owner: 'test-owner',
          name: 'test-repo',
          url: 'https://github.com/test-owner/test-repo'
        }
      })

      expect(mockGraphql).toHaveBeenCalledTimes(1)
    })

    test('should handle empty response', async () => {
      mockGraphql.mockResolvedValue({
        repository: {
          issues: {
            totalCount: 0,
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: []
          }
        }
      })

      const issues = await database.getAllIssues()
      expect(issues).toHaveLength(0)
    })
  })

  describe('warmupCache', () => {
    test('should populate cache with issues', async () => {
      expect(database.isCacheValid()).toBe(false)

      await database.warmupCache()

      expect(database.isCacheValid()).toBe(true)

      const stats = database.getCacheStats()
      expect(stats.totalCount).toBe(2)
      expect(stats.isValid).toBe(true)
    })
  })

  describe('getPage', () => {
    test('should return paginated results', async () => {
      await database.warmupCache()

      const result = await database.getPage(1, 1)

      expect(result).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'issue-2' })
        ]),
        total: 2,
        page: 1,
        pageSize: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false
      })
    })

    test('should handle page 2', async () => {
      await database.warmupCache()

      const result = await database.getPage(2, 1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('issue-1')
      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(true)
    })
  })

  describe('getRandomItem', () => {
    test('should return a random item from cache', async () => {
      await database.warmupCache()

      const item = await database.getRandomItem()

      expect(item).toBeDefined()
      expect(['issue-1', 'issue-2']).toContain(item.id)
    })

    test('should throw error if no data available', async () => {
      mockGraphql.mockResolvedValue({
        repository: {
          issues: {
            totalCount: 0,
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: []
          }
        }
      })

      await expect(database.getRandomItem()).rejects.toThrow('没有可用的段子数据')
    })
  })

  describe('getPageByRepo', () => {
    test('should filter by repository', async () => {
      await database.warmupCache()

      const result = await database.getPageByRepo('test-owner/test-repo', 1, 10)

      expect(result.items).toHaveLength(2)
      expect(result.repoStats).toEqual({
        'test-owner/test-repo': 2
      })
    })

    test('should return empty for non-existent repo', async () => {
      await database.warmupCache()

      const result = await database.getPageByRepo('non-existent/repo', 1, 10)

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getCacheStats', () => {
    test('should return cache statistics', async () => {
      const stats = database.getCacheStats()

      expect(stats).toMatchObject({
        isValid: false,
        totalCount: 0,
        lastUpdate: expect.any(Date),
        repoStats: {}
      })
    })

    test('should return valid stats after warmup', async () => {
      await database.warmupCache()

      const stats = database.getCacheStats()

      expect(stats.isValid).toBe(true)
      expect(stats.totalCount).toBe(2)
      expect(stats.repoStats).toEqual({
        'test-owner/test-repo': expect.objectContaining({
          count: 2
        })
      })
    })
  })

  describe('error handling', () => {
    test('should handle GraphQL errors gracefully', async () => {
      mockGraphql.mockRejectedValue(new Error('GraphQL Error'))

      const issues = await database.getAllIssues()
      expect(issues).toHaveLength(0)
    })
  })

  describe('syncLatest', () => {
    test('should fetch and merge new issues', async () => {
      // 首先预热缓存
      await database.warmupCache()

      // 模拟新的 issue
      const newIssueData = {
        repository: {
          issues: {
            nodes: [
              {
                id: 'issue-3',
                title: '测试段子3',
                body: '这是一个新的测试段子',
                createdAt: '2024-01-03T00:00:00Z',
                updatedAt: '2024-01-03T00:00:00Z',
                author: {
                  login: 'test-user3',
                  avatarUrl: 'https://example.com/avatar3.jpg',
                  url: 'https://github.com/test-user3'
                },
                url: 'https://github.com/test-owner/test-repo/issues/3',
                reactions: {
                  totalCount: 10
                }
              }
            ]
          }
        }
      }

      mockGraphql.mockResolvedValueOnce(newIssueData)

      await database.syncLatest()

      const stats = database.getCacheStats()
      expect(stats.totalCount).toBe(3) // 原有2个 + 新1个
    })

    test('should skip sync if cache is empty', async () => {
      await database.syncLatest()
      // 不应该抛出错误，只是静默跳过
      expect(database.getCacheStats().totalCount).toBe(0)
    })
  })

  describe('handleWebhook', () => {
    test('should add new issue from webhook', async () => {
      await database.warmupCache()

      const webhookPayload = {
        action: 'opened',
        issue: {
          node_id: 'webhook-issue-1',
          title: 'Webhook 测试段子',
          body: '通过 Webhook 添加的段子',
          html_url: 'https://github.com/test-owner/test-repo/issues/100',
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
          user: {
            login: 'webhook-user',
            avatar_url: 'https://example.com/webhook-avatar.jpg',
            html_url: 'https://github.com/webhook-user'
          },
          labels: [
            { name: '文案' }
          ]
        },
        repository: {
          owner: {
            login: 'test-owner'
          },
          name: 'test-repo',
          html_url: 'https://github.com/test-owner/test-repo'
        }
      }

      await database.handleWebhook(webhookPayload)

      const stats = database.getCacheStats()
      expect(stats.totalCount).toBe(3) // 原有2个 + webhook 1个
    })

    test('should ignore webhook without correct label', async () => {
      await database.warmupCache()

      const webhookPayload = {
        action: 'opened',
        issue: {
          node_id: 'webhook-issue-2',
          title: '错误标签',
          labels: [
            { name: 'bug' } // 不是 '文案' 标签
          ]
        }
      }

      await database.handleWebhook(webhookPayload)

      const stats = database.getCacheStats()
      expect(stats.totalCount).toBe(2) // 仍然是 2 个，没有增加
    })
  })

  describe('cache TTL', () => {
    test('should invalidate cache after TTL', async () => {
      await database.warmupCache()
      expect(database.isCacheValid()).toBe(true)

      // 直接调用 resetCache 来模拟缓存过期
      resetCache()

      expect(database.isCacheValid()).toBe(false)
    })

    test('should auto-refresh cache when calling getPage after expiry', async () => {
      // 第一次调用会预热缓存
      const result = await database.getPage(1, 10)
      expect(result.total).toBe(2)
      expect(mockGraphql).toHaveBeenCalledTimes(1)

      // 模拟缓存过期
      resetCache()

      // 第二次调用应该重新获取
      await database.getPage(1, 10)
      expect(mockGraphql).toHaveBeenCalledTimes(2)
    })
  })

  describe('multiple repositories', () => {
    test('should handle multiple repos', async () => {
      const multiRepos: Repository[] = [
        { owner: 'owner1', name: 'repo1', label: '文案', state: 'OPEN' },
        { owner: 'owner2', name: 'repo2', label: '文案', state: 'CLOSED' }
      ]

      const multiDatabase = new MultiRepoGitHubDatabase('test-token', multiRepos)

      const repo1Data = {
        repository: {
          issues: {
            totalCount: 1,
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                id: 'repo1-issue-1',
                number: 1,
                title: 'Repo1 段子',
                body: '来自 repo1',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                author: {
                  login: 'user1',
                  avatarUrl: 'https://example.com/avatar1.jpg',
                  url: 'https://github.com/user1'
                },
                url: 'https://github.com/owner1/repo1/issues/1',
                reactions: { totalCount: 1 }
              }
            ]
          }
        }
      }

      const repo2Data = {
        repository: {
          issues: {
            totalCount: 1,
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                id: 'repo2-issue-1',
                number: 1,
                title: 'Repo2 段子',
                body: '来自 repo2',
                createdAt: '2024-01-02T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
                author: {
                  login: 'user2',
                  avatarUrl: 'https://example.com/avatar2.jpg',
                  url: 'https://github.com/user2'
                },
                url: 'https://github.com/owner2/repo2/issues/1',
                reactions: { totalCount: 2 }
              }
            ]
          }
        }
      }

      mockGraphql
        .mockResolvedValueOnce(repo1Data)
        .mockResolvedValueOnce(repo2Data)

      await multiDatabase.warmupCache()

      const stats = multiDatabase.getCacheStats()
      expect(stats.totalCount).toBe(2)
      expect(stats.repoStats['owner1/repo1'].count).toBe(1)
      expect(stats.repoStats['owner2/repo2'].count).toBe(1)
    })
  })
})