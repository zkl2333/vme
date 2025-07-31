/**
 * 环境变量配置
 * Environment variables configuration
 */

export const env = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

/**
 * 检查是否为开发环境
 */
export const isDev = env.NODE_ENV === 'development'
