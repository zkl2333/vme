// utils.test.ts
import { minDistance, isSimilar, getIssueLabels } from '.'

// Mock @actions/github
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      issues: {
        createComment: jest.fn().mockResolvedValue({}),
        addLabels: jest.fn().mockResolvedValue({}),
        removeLabel: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        listLabelsOnIssue: jest.fn().mockResolvedValue({
          data: [{ name: 'bug' }, { name: '待审' }, { name: 'enhancement' }],
        }),
      },
    },
  }),
  context: {
    repo: {
      owner: '测试所有者',
      repo: '测试仓库',
    },
  },
}))

// 模拟环境变量
const originalEnv = process.env
beforeAll(() => {
  process.env = { ...originalEnv, GITHUB_TOKEN: 'fake-token' }
})

afterAll(() => {
  process.env = originalEnv
})

// Jest模拟fs模块
jest.mock('fs')

describe('工具函数', () => {
  // minDistance 测试用例
  describe('minDistance', () => {
    test('计算两个字符串之间的正确距离', () => {
      expect(minDistance('中国', '中华')).toBe(1)
      expect(minDistance('', 'abc')).toBe(3)
      expect(minDistance('书', '')).toBe(1)
      expect(minDistance('编程', '程序')).toBe(2)
    })
  })

  // isSimilar 测试用例
  describe('isSimilar', () => {
    test('正确判断相似性', () => {
      expect(isSimilar('你好，世界！', '你好世界')).toBeTruthy()
      expect(isSimilar('你好，世界！', '再见，世界！')).toBeFalsy()
    })
  })

  // getIssueLabels 测试用例
  describe('getIssueLabels', () => {
    test('正确获取issue标签', async () => {
      const labels = await getIssueLabels(123)
      expect(labels).toEqual(['bug', '待审', 'enhancement'])
    })
  })
})
