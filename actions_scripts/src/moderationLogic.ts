import {
  addCommentToIssue,
  addLabelsToIssue,
  closeIssue,
  findSimilarIssue,
  getIssueId,
  getIssueLabels,
  dispatchWorkflow,
} from './utils'

// omni-moderation-latest 支持的类别映射
const categoriesTextMap: Record<string, string> = {
  'hate': '仇恨',
  'hate/threatening': '仇恨/威胁',
  'harassment': '骚扰',
  'harassment/threatening': '骚扰/威胁',
  'sexual': '色情',
  'sexual/minors': '未成年人色情',
  'violence': '暴力',
  'violence/graphic': '暴力/血腥',
  'self-harm': '自残',
  'self-harm/intent': '自残意图',
  'self-harm/instructions': '自残指导',
  'illicit': '非法',
  'illicit/violent': '非法/暴力',
}

export interface ModerationResult {
  type: 'similar' | 'violation' | 'approved' | 'pending' | 'skipped'
  message?: string
  categories?: string[]
}

// 多模态输入类型
type ModerationInput =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

// 从 Issue body 中提取图片 URL
function extractImageUrls(body: string): string[] {
  const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g
  const urls: string[] = []
  let match
  while ((match = regex.exec(body)) !== null) {
    urls.push(match[1])
  }
  return urls
}

// 从 Issue body 中提取纯文本（移除图片 Markdown）
function extractText(body: string): string {
  return body.replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, '').trim()
}

// 调用 OpenAI Moderation API（支持多模态）
async function callModerationApi(inputs: ModerationInput[]): Promise<{
  flagged: boolean
  categories: Record<string, boolean>
}> {
  const API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api.openai.com'
  const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/v1/moderations`
  const MAX_RETRIES = 3
  const INITIAL_BACKOFF = 1000
  const TIMEOUT_MS = 30000

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt - 1)
      console.log(`重试第 ${attempt} 次，等待 ${backoffTime}ms...`)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }

    console.log(`尝试调用 Moderation API（第 ${attempt + 1}/${MAX_RETRIES} 次）...`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'omni-moderation-latest',
          input: inputs,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Moderation API 返回错误')
      }

      // 合并所有结果（文本+图片任一项触发则标记）
      const results = data.results || []
      const mergedCategories: Record<string, boolean> = {}
      let flagged = false

      for (const result of results) {
        if (result.flagged) flagged = true
        for (const [category, value] of Object.entries(result.categories || {})) {
          if (value) mergedCategories[category] = true
        }
      }

      console.log('Moderation API 调用成功，flagged:', flagged, 'categories:', mergedCategories)
      return { flagged, categories: mergedCategories }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error as Error

      if ((error as Error).name === 'AbortError') {
        console.error(`Moderation API 调用超时（第 ${attempt + 1} 次）`)
      } else {
        console.error(`Moderation API 调用失败（第 ${attempt + 1} 次）:`, error)
      }

      if (attempt < MAX_RETRIES - 1) {
        console.log('将进行重试...')
        continue
      }
    }
  }

  throw lastError || new Error('Moderation API 调用失败')
}

export async function moderateContent(
  issueNumber: number,
  issueBody: string,
  dryRun: boolean = false,
): Promise<ModerationResult> {
  // 检查issue是否已被审核（已有特定标签）
  const currentLabels = await getIssueLabels(issueNumber)
  const moderationLabels = ['违规', '收录', '重复', '待审']

  // 如果已有任何审核相关标签，跳过审核
  if (currentLabels.some((label) => moderationLabels.includes(label))) {
    console.log(
      `Issue #${issueNumber} 已有审核标签: ${currentLabels.join(', ')}，跳过审核。`,
    )
    return { type: 'skipped', message: '已有审核标签，跳过审核' }
  }

  // 获取当前issue的ID
  const currentIssueId = await getIssueId(issueNumber)

  // 查找相似的 issue
  console.log(`开始查找相似文案，当前文案长度: ${issueBody.length}`)
  const similarIssue = await findSimilarIssue(issueBody, currentIssueId)

  if (similarIssue) {
    console.log(`找到相似文案: ${similarIssue.url}`)

    if (!dryRun) {
      await addLabelsToIssue(issueNumber, ['重复'])
      await addCommentToIssue(
        issueNumber,
        `🔍查找到相似文案：${similarIssue.url}`,
      )
      await closeIssue(issueNumber)
    } else {
      console.log(`[试运行] 将标记为重复并关闭: ${similarIssue.url}`)
    }

    return {
      type: 'similar',
      message: `查找到相似文案：${similarIssue.url}`,
    }
  } else {
    console.log('未找到相似文案，继续审核流程')
  }

  // 构建多模态审核输入
  console.log('使用 Moderation API 审核内容（支持多模态）...')
  const inputs: ModerationInput[] = []

  // 添加文本内容
  const text = extractText(issueBody)
  if (text) {
    inputs.push({ type: 'text', text })
    console.log(`添加文本内容审核，长度: ${text.length}`)
  }

  // 添加图片 URL
  const imageUrls = extractImageUrls(issueBody)
  for (const url of imageUrls) {
    inputs.push({ type: 'image_url', image_url: { url } })
    console.log(`添加图片审核: ${url}`)
  }

  // 如果没有内容可审核
  if (inputs.length === 0) {
    console.log('没有可审核的内容')
    if (!dryRun) {
      await addLabelsToIssue(issueNumber, ['待审'])
      await addCommentToIssue(
        issueNumber,
        `⚠️内容为空，需要人工审核确认。`,
      )
    }
    return { type: 'pending', message: '内容为空，需要人工审核' }
  }

  try {
    const moderationResult = await callModerationApi(inputs)

    if (moderationResult.flagged) {
      const flaggedCategories = Object.keys(moderationResult.categories).filter(
        (category) => moderationResult.categories[category],
      )
      const flaggedCategoriesText = flaggedCategories
        .map((category) => categoriesTextMap[category] || category)
        .filter(Boolean)

      console.log(`检测到违规内容: ${flaggedCategoriesText.join('、')}`)

      if (flaggedCategoriesText.length > 0) {
        if (!dryRun) {
          await addLabelsToIssue(issueNumber, ['违规'])
          await addCommentToIssue(
            issueNumber,
            `⛔️此内容因包含以下违规类别被标记：${flaggedCategoriesText.join('、')}。不予收录。`,
          )
          await closeIssue(issueNumber)
        } else {
          console.log(
            `[试运行] 将标记为违规并关闭: ${flaggedCategoriesText.join('、')}`,
          )
        }

        return {
          type: 'violation',
          categories: flaggedCategoriesText,
        }
      } else {
        // flagged 但没有具体类别，标记待审
        if (!dryRun) {
          await addLabelsToIssue(issueNumber, ['待审'])
          await addCommentToIssue(
            issueNumber,
            `⚠️内容可能违规，正等待进一步人工审核确认。`,
          )
        } else {
          console.log('[试运行] 将标记为待审')
        }

        return {
          type: 'pending',
          message: '内容可能违规，需要人工审核',
        }
      }
    } else {
      console.log('内容审核通过')

      if (!dryRun) {
        await addLabelsToIssue(issueNumber, ['收录'])
        await addCommentToIssue(
          issueNumber,
          `🤝您的内容已成功收录，感谢您的贡献！`,
        )
        await closeIssue(issueNumber)
      } else {
        console.log('[试运行] 将标记为收录并关闭')
      }

      return {
        type: 'approved',
        message: '内容审核通过',
      }
    }
  } catch (error) {
    // API 调用失败，标记为待审而不是抛错
    console.error('Moderation API 调用失败，标记为待审:', error)

    if (!dryRun) {
      await addLabelsToIssue(issueNumber, ['待审'])
      await addCommentToIssue(
        issueNumber,
        `⚠️自动审核暂时不可用，内容已提交人工审核。`,
      )
    } else {
      console.log('[试运行] API 失败，将标记为待审')
    }

    return {
      type: 'pending',
      message: `自动审核失败: ${(error as Error).message}`,
    }
  }
}

export async function triggerDataUpdate(): Promise<void> {
  await dispatchWorkflow('create_data.yml', 'main')
}
