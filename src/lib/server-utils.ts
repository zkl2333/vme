// 服务端专用工具函数 - 包含 Node.js 模块，仅在服务端使用
import fs from 'fs'
import path from 'path'
import { IKfcItem, Summary } from '@/types'

const cache: {
  kfcItems: Record<string, IKfcItem[]>
  allMonths: string[]
  summary: Summary | null
} = {
  kfcItems: {},
  allMonths: [],
  summary: null,
}

// 获取所有可用的月份文件
export async function getAvailableMonths(): Promise<string[]> {
  if (cache.allMonths.length) {
    return cache.allMonths
  }

  // 从summary信息获取月份列表
  const summary = await getSummary()
  if (!summary || !summary.months || summary.months.length === 0) {
    throw new Error('无法获取月份信息：summary数据不可用')
  }

  const months = summary.months.map(
    (item: { month: string; count: number }) => item.month,
  )
  cache.allMonths = months
  return months
}

// 按月获取数据
export async function getKfcItemsByMonth(month: string): Promise<IKfcItem[]> {
  // 如果已缓存，则直接返回
  if (cache.kfcItems[month]) {
    return cache.kfcItems[month]
  }

  try {
    const filePath = path.resolve(process.cwd(), 'data', `${month}.json`)
    if (!fs.existsSync(filePath)) {
      return []
    }

    const data = await fs.promises.readFile(filePath, 'utf-8')
    const items = JSON.parse(data)

    // 按创建时间排序
    const sortedItems = items.sort((a: IKfcItem, b: IKfcItem) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    cache.kfcItems[month] = sortedItems
    return sortedItems
  } catch (error) {
    console.error(`Error reading data file for ${month}:`, error)
    return []
  }
}

// 获取汇总信息
export async function getSummary() {
  if (cache.summary) {
    return cache.summary
  }

  try {
    const filePath = path.resolve(process.cwd(), 'data', 'summary.json')
    if (!fs.existsSync(filePath)) {
      throw new Error('汇总数据文件不存在')
    }

    const data = await fs.promises.readFile(filePath, 'utf-8')
    const summary = JSON.parse(data)

    if (!summary.totalItems || !Array.isArray(summary.months)) {
      throw new Error('汇总数据格式不正确')
    }

    cache.summary = summary
    return summary
  } catch (error) {
    console.error('读取汇总数据失败:', error)
    throw new Error(
      `无法获取汇总信息: ${error instanceof Error ? error.message : '未知错误'}`,
    )
  }
}

// 获取所有KFC项目（不分页）- 服务端专用
export async function getAllKfcItems(): Promise<IKfcItem[]> {
  const months = await getAvailableMonths()
  let allItems: IKfcItem[] = []

  // 加载所有月份的数据
  for (const month of months) {
    const items = await getKfcItemsByMonth(month)
    allItems = [...allItems, ...items]
  }

  return allItems
}

// 获取所有唯一贡献者数量
export async function getUniqueContributorsCount(): Promise<number> {
  const summary = await getSummary()
  return summary.totalContributors
}

// 获取所有贡献者信息（不包含点赞等交互数据）
export async function getAllContributors() {
  const summary = await getSummary()
  return summary.contributors
}

// 获取排行榜贡献者（Top 10，不包含点赞等交互数据）
export async function getTopContributors() {
  const summary = await getSummary()
  return summary.topContributors
}

// 获取分页数据（使用汇总信息优化totalPages计算）
export async function getKfcItemsWithPagination(
  page = 1,
  pageSize = 20,
): Promise<{
  items: IKfcItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const months = await getAvailableMonths()
  let allItems: IKfcItem[] = []

  // 获取汇总信息来确定正确的total和totalPages
  const summary = await getSummary()
  if (!summary) {
    throw new Error('无法获取分页信息：summary数据不可用')
  }

  const totalItems = summary.totalItems

  // 只加载必要的月份数据，直到满足分页需求
  let itemsNeeded = page * pageSize
  let loadedItems = 0

  for (const month of months) {
    if (loadedItems >= itemsNeeded) break

    const items = await getKfcItemsByMonth(month)
    allItems = [...allItems, ...items]
    loadedItems += items.length
  }

  // 计算分页结果
  const total = totalItems
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, allItems.length)
  const paginatedItems = allItems.slice(startIndex, endIndex)

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// 获取随机项目
export async function getRandomKfcItem(): Promise<IKfcItem> {
  // 从summary中获取数据分布信息
  const summary = await getSummary()
  if (!summary || !summary.months || !summary.months.length) {
    throw new Error('无法获取随机项目：summary数据不可用')
  }

  // 随机选择一个月份，但考虑各月份的数据量进行加权
  const totalItems = summary.totalItems
  const randomIndex = Math.floor(Math.random() * totalItems)

  let cumulativeCount = 0
  let selectedMonth = summary.months[0].month

  for (const monthInfo of summary.months) {
    cumulativeCount += monthInfo.count
    if (randomIndex < cumulativeCount) {
      selectedMonth = monthInfo.month
      break
    }
  }

  // 获取该月的项目
  const items = await getKfcItemsByMonth(selectedMonth)
  if (!items.length) {
    throw new Error(`无法获取随机项目：${selectedMonth}月数据为空`)
  }

  // 随机选择一个项目
  const randomItemIndex = Math.floor(Math.random() * items.length)
  return items[randomItemIndex]
}
