// 客户端专用工具函数 - 不包含 Node.js 模块，可以在客户端使用
import { IKfcItem, JokeDisplayItem } from '@/types'

// 将IKfcItem转换为JokeDisplayItem的辅助函数
export function convertToJokeDisplay(
  item: IKfcItem,
  stats?: { reactions: number; comments: number }
): JokeDisplayItem {
  return {
    content: item.body,
    author: item.author.username,
    avatar: item.author.avatarUrl,
    date: item.createdAt,
    likes: stats?.reactions || item.reactions?.totalCount || 0,
    comments: stats?.comments || item.comments?.totalCount || 0,
  }
}

// 客户端API调用函数
export async function fetchKfcItemsWithPagination(
  page: number = 1,
  pageSize: number = 20
) {
  const response = await fetch(
    `/api/items/page?page=${page}&pageSize=${pageSize}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch KFC items')
  }
  return response.json()
}

export async function fetchRandomKfcItem() {
  const response = await fetch('/api/random')
  if (!response.ok) {
    throw new Error('Failed to fetch random KFC item')
  }
  return response.json()
}

export async function fetchIssueStats(issueIds: string[]) {
  const response = await fetch('/api/stats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ issueIds }),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch issue stats')
  }
  return response.json()
}