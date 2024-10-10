import fs from 'fs'
import path from 'path'

const cache: {
  kfcItems: KfcItem[]
} = {
  kfcItems: [],
}

interface KfcItem {
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

export async function getKfcItems(): Promise<KfcItem[]> {
  if (cache.kfcItems.length) {
    return cache.kfcItems
  }
  const pathToFile = path.resolve(process.cwd(), 'data.json')
  const data = await fs.promises.readFile(pathToFile, 'utf-8')
  try {
    const items = JSON.parse(data)
    cache.kfcItems = items.sort((a: KfcItem, b: KfcItem) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return cache.kfcItems
  } catch (error) {
    console.error('Error reading file:', error)
    return []
  }
}

export async function getRandomKfcItem(): Promise<KfcItem> {
  const items = await getKfcItems()
  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex]
}