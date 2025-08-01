import { manualModeration } from './manualModeration'

// Mock @actions/core
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}))

// Mock @actions/github
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      issues: {
        listForRepo: jest.fn().mockResolvedValue({
          data: [
            {
              number: 1,
              title: '测试文案1',
              body: '这是第一个测试文案',
              state: 'open',
            },
            {
              number: 2,
              title: '测试文案2',
              body: '这是第二个测试文案',
              state: 'open',
            },
          ],
        }),
      },
    },
  }),
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
  },
}))

// Mock utils模块
jest.mock('./utils', () => ({
  getIssueLabels: jest.fn().mockResolvedValue([]),
  addCommentToIssue: jest.fn().mockResolvedValue({}),
  addLabelsToIssue: jest.fn().mockResolvedValue({}),
  closeIssue: jest.fn().mockResolvedValue({}),
  findSimilarIssue: jest.fn().mockResolvedValue(null),
  dispatchWorkflow: jest.fn().mockResolvedValue({}),
}))

// Mock moderateIssue模块
jest.mock('./moderateIssue', () => ({
  moderateIssue: jest.fn().mockResolvedValue(undefined),
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

describe('manualModeration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('正常审核流程', async () => {
    // 模拟getIssueLabels返回空数组（没有审核标签）
    const { getIssueLabels } = await import('./utils')
    ;(getIssueLabels as jest.Mock)
      .mockResolvedValueOnce([]) // 第一个issue初始检查
      .mockResolvedValueOnce(['收录']) // 第一个issue审核后
      .mockResolvedValueOnce([]) // 第二个issue初始检查
      .mockResolvedValueOnce(['违规']) // 第二个issue审核后

    // 模拟moderateIssue成功执行
    const { moderateIssue } = await import('./moderateIssue')
    ;(moderateIssue as jest.Mock).mockResolvedValue(undefined)

    await manualModeration()

    // 验证调用了相关函数
    expect(moderateIssue).toHaveBeenCalledTimes(2)
    expect(moderateIssue).toHaveBeenCalledWith(1, '这是第一个测试文案')
    expect(moderateIssue).toHaveBeenCalledWith(2, '这是第二个测试文案')
    expect(getIssueLabels).toHaveBeenCalled()
  })

  test('跳过已有审核标签的issues', async () => {
    const { getIssueLabels } = await import('./utils')
    ;(getIssueLabels as jest.Mock).mockResolvedValue(['收录'])

    const { moderateIssue } = await import('./moderateIssue')

    await manualModeration()

    // 应该跳过这个issue，不调用moderateIssue
    expect(moderateIssue).not.toHaveBeenCalled()
  })

  test('处理审核结果统计', async () => {
    const { getIssueLabels } = await import('./utils')
    const { moderateIssue } = await import('./moderateIssue')

    // 模拟第一个issue被标记为重复
    ;(getIssueLabels as jest.Mock)
      .mockResolvedValueOnce([]) // 初始检查
      .mockResolvedValueOnce(['重复']) // 审核后

    // 模拟第二个issue被标记为违规
    ;(getIssueLabels as jest.Mock)
      .mockResolvedValueOnce([]) // 初始检查
      .mockResolvedValueOnce(['违规']) // 审核后
    ;(moderateIssue as jest.Mock).mockResolvedValue(undefined)

    await manualModeration()

    expect(moderateIssue).toHaveBeenCalledTimes(2)
    expect(moderateIssue).toHaveBeenCalledWith(1, '这是第一个测试文案')
    expect(moderateIssue).toHaveBeenCalledWith(2, '这是第二个测试文案')
  })

  test('处理API错误', async () => {
    const { getIssueLabels } = await import('./utils')
    const { moderateIssue } = await import('./moderateIssue')

    ;(getIssueLabels as jest.Mock).mockResolvedValue([])
    ;(moderateIssue as jest.Mock).mockRejectedValue(new Error('API错误'))

    await manualModeration()

    // 应该调用moderateIssue但会抛出错误
    expect(moderateIssue).toHaveBeenCalledWith(1, '这是第一个测试文案')
  })
})
