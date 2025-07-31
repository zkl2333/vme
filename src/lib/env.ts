/**
 * 环境变量配置 - 仅包含非敏感变量
 * Environment variables configuration - non-sensitive variables only
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

/**
 * 检查是否为开发环境
 */
export const isDev = env.NODE_ENV === 'development'
