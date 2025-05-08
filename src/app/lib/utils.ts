import fs from 'fs'
import path from 'path'

const cache: {
  kfcItems: Record<string, IKfcItem[]>
  allMonths: string[]
} = {
  kfcItems: {},
  allMonths: [],
}

export interface IKfcItem {
  id: string
  title: string
  url: string
  body: string
  createdAt: string
  updatedAt: string
  author: {
    username: string
    avatarUrl: string
    url: string
  }
}

// 获取所有可用的月份文件
export async function getAvailableMonths(): Promise<string[]> {
  if (cache.allMonths.length) {
    return cache.allMonths
  }

  const dataDir = path.resolve(process.cwd(), 'data')
  try {
    const files = await fs.promises.readdir(dataDir)
    // 过滤出形如 YYYY-MM.json 的文件
    const months = files
      .filter((file) => /^\d{4}-\d{2}\.json$/.test(file))
      .map((file) => file.replace('.json', ''))
      .sort((a, b) => b.localeCompare(a)) // 按照日期降序排序

    cache.allMonths = months
    return months
  } catch (error) {
    console.error('Error reading data directory:', error)
    return []
  }
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

// 获取分页数据
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
  const total = allItems.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const paginatedItems = allItems.slice(startIndex, endIndex)

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// 获取所有KFC项目（不分页）
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

// 获取随机项目
export async function getRandomKfcItem(): Promise<IKfcItem | null> {
  // 随机选择一个月份
  const months = await getAvailableMonths()
  if (!months.length) return null

  const randomMonthIndex = Math.floor(Math.random() * months.length)
  const randomMonth = months[randomMonthIndex]

  // 获取该月的项目
  const items = await getKfcItemsByMonth(randomMonth)
  if (!items.length) return null

  // 随机选择一个项目
  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex]
}
