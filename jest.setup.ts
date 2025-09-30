// Jest 设置文件
import { jest } from '@jest/globals'

// Mock 环境变量
process.env.GITHUB_TOKEN = 'test-token'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Octokit
jest.mock('@octokit/core', () => ({
  Octokit: jest.fn(() => ({
    graphql: jest.fn(),
    rest: {
      issues: {
        get: jest.fn(),
        listLabelsOnIssue: jest.fn(),
        createComment: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
        update: jest.fn(),
      },
      actions: {
        createWorkflowDispatch: jest.fn(),
      },
    },
  })),
}))

// Mock Next.js modules
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))

// Mock auth config
jest.mock('./src/lib/auth', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}))

// Mock GitHub API 模块
jest.mock('./src/lib/github', () => ({
  getOctokitInstance: jest.fn(),
  createOctokitInstance: jest.fn(),
  getSystemOctokitInstance: jest.fn(),
  queryRepoIssues: jest.fn(),
  queryRepoIssuesSince: jest.fn(),
  queryIssueStats: jest.fn(() => Promise.resolve({
    id: 'test-id',
    reactions: 0,
    reactionDetails: [],
    reactionNodes: [],
  })),
  queryBatchIssueStats: jest.fn(() => Promise.resolve(new Map())),
  queryUserReaction: jest.fn(() => Promise.resolve(null)),
  addReaction: jest.fn(() => Promise.resolve('test-reaction-id')),
  removeReaction: jest.fn(() => Promise.resolve('test-reaction-id')),
  toggleReaction: jest.fn(() => Promise.resolve({ action: 'added', reactionId: 'test-reaction-id' })),
}))

// Reset modules between tests to prevent state leakage
beforeEach(() => {
  // Clear all modules from require cache
  jest.resetModules()
})

// Suppress console logs in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}