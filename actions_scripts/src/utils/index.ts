import github from '@actions/github'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { IssueNode } from './fetchIssues'
import { removeSeparator } from './removeSeparator'

// 图片哈希相关类型
interface ImageHashResult {
  url: string
  hash: string
}

// 从 issue body 中提取图片 URL
export function extractImageUrls(body: string): string[] {
  const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g
  const urls: string[] = []
  let match
  while ((match = regex.exec(body)) !== null) {
    urls.push(match[1])
  }
  return urls
}

// 从 issue body 中提取纯文本（移除图片 Markdown）
export function extractText(body: string): string {
  return body.replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, '').trim()
}

// 判断 issue 是否包含图片
export function hasImage(body: string): boolean {
  return /!\[.*?\]\((https?:\/\/[^\s)]+)\)/.test(body)
}

// 计算图片的感知哈希 (pHash)
// 使用 sharp 生成缩略图后计算灰度平均值哈希
export async function calculateImageHash(imageUrl: string): Promise<string | null> {
  try {
    console.log(`正在下载并计算图片哈希: ${imageUrl}`)

    // 下载图片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.log(`下载图片失败: ${imageUrl}`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // 使用 sharp 处理图片：
    // 1. 调整为 8x8 像素
    // 2. 转为灰度
    // 3. 计算哈希
    const { data, info } = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // 计算平均值
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i]
    }
    const avg = sum / data.length

    // 生成哈希字符串（每位代表一个像素是否大于平均值）
    let hash = ''
    for (let i = 0; i < data.length; i++) {
      hash += data[i] > avg ? '1' : '0'
    }

    // 将二进制转为十六进制，压缩长度
    const hexHash = BigInt('0b' + hash).toString(16).padStart(16, '0')
    console.log(`图片哈希计算完成: ${hexHash}`)
    return hexHash
  } catch (error) {
    console.error(`计算图片哈希失败 (${imageUrl}):`, error)
    return null
  }
}

// 计算两个十六进制哈希的汉明距离
export function hammingDistance(hash1: string, hash2: string): number {
  // 将十六进制转为二进制
  const bin1 = BigInt('0x' + hash1).toString(2).padStart(64, '0')
  const bin2 = BigInt('0x' + hash2).toString(2).padStart(64, '0')

  let distance = 0
  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) distance++
  }
  return distance
}

// 判断两张图片是否相似（汉明距离阈值 < 10）
export function isImageSimilar(hash1: string, hash2: string, threshold: number = 10): boolean {
  return hammingDistance(hash1, hash2) < threshold
}

// 批量计算图片哈希
export async function calculateImageHashes(urls: string[]): Promise<ImageHashResult[]> {
  const results: ImageHashResult[] = []

  for (const url of urls) {
    const hash = await calculateImageHash(url)
    if (hash) {
      results.push({ url, hash })
    }
  }

  return results
}

// 获取 Octokit 实例
export function getOctokit() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not set')
  }
  return github.getOctokit(process.env.GITHUB_TOKEN)
}

// 获取 issue 的标签
export async function getIssueLabels(issueNumber: number): Promise<string[]> {
  const octokit = getOctokit()
  const response = await octokit.rest.issues.listLabelsOnIssue({
    ...github.context.repo,
    issue_number: issueNumber,
  })
  return response.data.map((label) => label.name)
}

// 获取 issue 的 ID
export async function getIssueId(issueNumber: number): Promise<string> {
  const octokit = getOctokit()
  const response = await octokit.rest.issues.get({
    ...github.context.repo,
    issue_number: issueNumber,
  })
  return response.data.node_id
}

// 获取仓库的所有 issues
export async function addCommentToIssue(issueNumber: number, comment: string) {
  const octokit = getOctokit()
  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: issueNumber,
    body: comment,
  })
}

// 为 issue 添加标签
export async function addLabelsToIssue(issueNumber: number, labels: string[]) {
  const octokit = getOctokit()
  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: issueNumber,
    labels: labels,
  })
}

// 为 issue 移除标签
export async function removeLabelFromIssue(issueNumber: number, label: string) {
  const octokit = getOctokit()
  await octokit.rest.issues.removeLabel({
    ...github.context.repo,
    issue_number: issueNumber,
    name: label,
  })
}

// 关闭 issue
export async function closeIssue(issueNumber: number) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not set')
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
  await octokit.rest.issues.update({
    ...github.context.repo,
    issue_number: issueNumber,
    state: 'closed',
  })
}

// 触发工作流
export async function dispatchWorkflow(workflow_id: string, ref: string) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not set')
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
  await octokit.rest.actions.createWorkflowDispatch({
    ...github.context.repo,
    workflow_id,
    ref,
  })
}

// 最短编辑距离
export function minDistance(word1: string, word2: string): number {
  const m = word1.length
  const n = word2.length
  const dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    dp[i][0] = i
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
        )
      }
    }
  }
  return dp[m][n]
}

// 判断两个文本是否相似
export function isSimilar(str1: string, str2: string): boolean {
  const distance = minDistance(removeSeparator(str1), removeSeparator(str2))
  const maxLength = Math.max(str1.length, str2.length)
  return distance / maxLength < 0.2
}

// 读取本地文件保存的所有文案
export async function fetchLocalIssues(): Promise<IssueNode[]> {
  const dataDir = path.join(process.cwd(), '../', 'data')
  const allIssues: IssueNode[] = []

  try {
    // 读取data目录下的所有JSON文件
    const files = fs.readdirSync(dataDir)
    const jsonFiles = files.filter(
      (file) => file.endsWith('.json') && file !== 'summary.json',
    )

    console.log(`找到 ${jsonFiles.length} 个月份数据文件`)

    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file)
      const data = fs.readFileSync(filePath, 'utf-8')
      const issues = JSON.parse(data)
      allIssues.push(...issues)
      console.log(`从 ${file} 读取了 ${issues.length} 条文案`)
    }

    console.log(`总共读取到 ${allIssues.length} 条文案`)
    return allIssues
  } catch (error) {
    console.error('读取数据文件时出错:', error)
    return []
  }
}

// 判断新的文案是否有相似的存在，如果有则返回相似的文案
export async function findSimilarIssue(
  newIssue: string,
  currentIssueId?: string,
): Promise<IssueNode | null> {
  const issues = await fetchLocalIssues()
  console.log(`从data.json中读取到 ${issues.length} 个文案`)

  const newIssueImages = extractImageUrls(newIssue)
  const hasNewImage = newIssueImages.length > 0
  const newIssueText = extractText(newIssue)

  // 如果新提交包含图片，先计算图片哈希
  let newImageHashes: string[] = []
  if (hasNewImage) {
    console.log(`新提交包含 ${newIssueImages.length} 张图片，开始计算哈希...`)
    const hashResults = await calculateImageHashes(newIssueImages)
    newImageHashes = hashResults.map(h => h.hash)
    console.log(`图片哈希计算完成: ${newImageHashes.join(', ')}`)
  }

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i]

    // 如果提供了当前issue ID，则跳过自身
    if (currentIssueId && issue.id === currentIssueId) {
      console.log(`跳过当前issue ID: ${currentIssueId}`)
      continue
    }

    // 1. 图片相似性检查
    if (hasNewImage && issue.imageHashes && issue.imageHashes.length > 0) {
      for (const newHash of newImageHashes) {
        for (const existingHash of issue.imageHashes!) {
          if (isImageSimilar(newHash, existingHash)) {
            console.log(`在第 ${i + 1} 个文案中找到相似图片: ${issue.title}`)
            console.log(`新图哈希: ${newHash}, 相似图哈希: ${existingHash}, 汉明距离: ${hammingDistance(newHash, existingHash)}`)
            return issue
          }
        }
      }
    }

    // 2. URL 精确匹配检查（快速路径）
    if (hasNewImage) {
      const existingImages = extractImageUrls(issue.body)
      for (const newUrl of newIssueImages) {
        if (existingImages.includes(newUrl)) {
          console.log(`在第 ${i + 1} 个文案中找到相同图片URL: ${issue.title}`)
          return issue
        }
      }
    }

    // 3. 文本相似性检查（仅当两者都有文本内容时）
    const existingText = extractText(issue.body)
    if (newIssueText && existingText) {
      const similarity = isSimilar(existingText, newIssueText)
      if (similarity) {
        console.log(`在第 ${i + 1} 个文案中找到相似文本: ${issue.title}`)
        return issue
      }
    }
  }

  console.log('遍历完所有文案，未找到相似内容')
  return null
}
