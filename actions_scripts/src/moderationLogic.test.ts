import { moderateContent, triggerDataUpdate } from './moderationLogic'

// Mock utils模块
jest.mock('./utils', () => ({
  getIssueLabels: jest.fn().mockResolvedValue([]),
  getIssueId: jest.fn().mockResolvedValue('test-issue-id'),
  addCommentToIssue: jest.fn().mockResolvedValue({}),
  addLabelsToIssue: jest.fn().mockResolvedValue({}),
  closeIssue: jest.fn().mockResolvedValue({}),
  findSimilarIssue: jest.fn().mockResolvedValue(null),
  dispatchWorkflow: jest.fn().mockResolvedValue({}),
}))

// Mock fetch
global.fetch = jest.fn()

// 模拟环境变量
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    GITHUB_TOKEN: 'fake-token',
    AI_API_KEY: 'fake-api-key',
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('moderationLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('moderateContent', () => {
    test('检测到重复文案', async () => {
      const { findSimilarIssue } = await import('./utils')
      ;(findSimilarIssue as jest.Mock).mockResolvedValueOnce({
        url: 'https://github.com/test/issues/999',
      })

      const result = await moderateContent(1, '测试文案')

      expect(result.type).toBe('similar')
      expect(result.message).toContain('查找到相似文案')
    })

    test('检测到违规内容', async () => {
      // 模拟 gpt-5-nano API 返回违规结果
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flagged: true,
                  categories: {
                    hate: true,
                    sexual: false,
                    violence: false,
                    'self-harm': false,
                  },
                }),
              },
            },
          ],
        }),
      })

      const result = await moderateContent(1, '测试文案')

      expect(result.type).toBe('violation')
      expect(result.categories).toContain('仇恨')
    })

    test('内容审核通过', async () => {
      // 模拟 gpt-5-nano API 返回正常结果
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flagged: false,
                  categories: {
                    hate: false,
                    sexual: false,
                    violence: false,
                    'self-harm': false,
                  },
                }),
              },
            },
          ],
        }),
      })

      const result = await moderateContent(1, '测试文案')

      expect(result.type).toBe('approved')
      expect(result.message).toBe('内容审核通过')
    })

    test('试运行模式', async () => {
      // 模拟 gpt-5-nano API 返回正常结果
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flagged: false,
                  categories: {
                    hate: false,
                    sexual: false,
                    violence: false,
                    'self-harm': false,
                  },
                }),
              },
            },
          ],
        }),
      })

      const result = await moderateContent(1, '测试文案', true)

      expect(result.type).toBe('approved')

      // 在试运行模式下，不应该调用实际的GitHub API
      const { addLabelsToIssue, addCommentToIssue, closeIssue } = await import(
        './utils'
      )
      expect(addLabelsToIssue).not.toHaveBeenCalled()
      expect(addCommentToIssue).not.toHaveBeenCalled()
      expect(closeIssue).not.toHaveBeenCalled()
    })

    test('跳过已有审核标签的issues', async () => {
      const { getIssueLabels } = await import('./utils')
      ;(getIssueLabels as jest.Mock).mockResolvedValueOnce(['收录'])

      const result = await moderateContent(1, '测试文案')

      expect(result.type).toBe('approved')

      // 应该跳过这个issue，不进行审核
      const { findSimilarIssue } = await import('./utils')
      expect(findSimilarIssue).not.toHaveBeenCalled()
    })

    test('处理API错误并重试', async () => {
      // 模拟API错误（3次都失败）
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API错误'))
        .mockRejectedValueOnce(new Error('API错误'))
        .mockRejectedValueOnce(new Error('API错误'))

      await expect(moderateContent(1, '测试文案')).rejects.toThrow('API错误')

      // 验证进行了3次重试
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    test('支持Markdown代码块格式的响应', async () => {
      // 模拟返回包含 markdown 代码块的响应
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: '```json\n' + JSON.stringify({
                  flagged: false,
                  categories: {
                    hate: false,
                    sexual: false,
                    violence: false,
                    'self-harm': false,
                  },
                }) + '\n```',
              },
            },
          ],
        }),
      })

      const result = await moderateContent(1, '测试文案')

      expect(result.type).toBe('approved')
    })
  })

  describe('triggerDataUpdate', () => {
    test('触发数据更新工作流', async () => {
      await triggerDataUpdate()

      const { dispatchWorkflow } = await import('./utils')
      expect(dispatchWorkflow).toHaveBeenCalledWith('create_data.yml', 'main')
    })
  })
})
