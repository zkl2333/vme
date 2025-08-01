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

// Mock moderationLogic模块
jest.mock('./moderationLogic', () => ({
  moderateContent: jest.fn().mockResolvedValue({ type: 'approved' }),
  triggerDataUpdate: jest.fn().mockResolvedValue(undefined),
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
    const { moderateContent } = await import('./moderationLogic')
    ;(moderateContent as jest.Mock)
      .mockResolvedValueOnce({ type: 'approved' })
      .mockResolvedValueOnce({ type: 'violation' })

    await manualModeration()

    // 验证调用了相关函数
    expect(moderateContent).toHaveBeenCalledTimes(2)
    expect(moderateContent).toHaveBeenCalledWith(1, '这是第一个测试文案', false)
    expect(moderateContent).toHaveBeenCalledWith(2, '这是第二个测试文案', false)
  })

  test('试运行模式', async () => {
    process.env.DRY_RUN = 'true'

    const { moderateContent } = await import('./moderationLogic')
    ;(moderateContent as jest.Mock).mockResolvedValue({ type: 'approved' })

    await manualModeration()

    // 在试运行模式下，应该传递dryRun=true
    expect(moderateContent).toHaveBeenCalledWith(1, '这是第一个测试文案', true)

    // 清理环境变量
    delete process.env.DRY_RUN
  })

  test('处理审核结果统计', async () => {
    const { moderateContent } = await import('./moderationLogic')
    ;(moderateContent as jest.Mock)
      .mockResolvedValueOnce({ type: 'similar' })
      .mockResolvedValueOnce({ type: 'violation' })

    await manualModeration()

    expect(moderateContent).toHaveBeenCalledTimes(2)
    expect(moderateContent).toHaveBeenCalledWith(1, '这是第一个测试文案', false)
    expect(moderateContent).toHaveBeenCalledWith(2, '这是第二个测试文案', false)
  })

  test('处理API错误', async () => {
    const { moderateContent } = await import('./moderationLogic')
    ;(moderateContent as jest.Mock).mockRejectedValue(new Error('API错误'))

    await manualModeration()

    // 应该调用moderateContent但会抛出错误
    expect(moderateContent).toHaveBeenCalledWith(1, '这是第一个测试文案', false)
  })
})
