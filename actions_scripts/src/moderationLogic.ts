import {
  addCommentToIssue,
  addLabelsToIssue,
  closeIssue,
  findSimilarIssue,
  getIssueId,
  getIssueLabels,
  dispatchWorkflow,
} from './utils'

const categoriesTextMap: Record<string, string> = {
  hate: '仇恨',
  sexual: '色情',
  violence: '暴力',
  'hate/threatening': '仇恨/威胁',
  'self-harm': '自残',
  'sexual/minors': '未成年人色情',
  'violence/graphic': '暴力/血腥',
}

export interface ModerationResult {
  type: 'similar' | 'violation' | 'approved' | 'pending'
  message?: string
  categories?: string[]
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
    return { type: 'approved' } // 已审核，视为通过
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

  // 使用 gpt-5-nano 模型审核内容（带重试机制）
  console.log('使用 gpt-5-nano 模型审核内容...')
  const API_URL = 'https://aihubmix.com/v1/chat/completions'
  const MAX_RETRIES = 3
  const INITIAL_BACKOFF = 1000 // 1秒

  const MODERATION_PROMPT = `你是一个内容审核助手。请分析以下文案内容，判断是否包含违规内容。

违规类别包括：
- 仇恨言论（hate）：针对特定群体的仇恨、歧视性内容
- 色情内容（sexual）：包含性暗示或色情描述
- 暴力内容（violence）：鼓励或描述暴力行为
- 自残内容（self-harm）：鼓励或描述自残行为

请严格按照以下 JSON 格式返回结果：
{
  "flagged": true/false,
  "categories": {
    "hate": true/false,
    "sexual": true/false,
    "violence": true/false,
    "self-harm": true/false
  }
}

待审核内容：
${issueBody}

请仅返回 JSON 格式的结果，不要包含其他内容。`

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        // 指数退避：1秒、2秒、4秒
        const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt - 1)
        console.log(`重试第 ${attempt} 次，等待 ${backoffTime}ms...`)
        await new Promise((resolve) => setTimeout(resolve, backoffTime))
      }

      console.log(`尝试调用 AI 审核（第 ${attempt + 1}/${MAX_RETRIES} 次）...`)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            {
              role: 'user',
              content: MODERATION_PROMPT,
            },
          ],
          temperature: 0.1,
        }),
      })

      const data = await response.json()

      if (data.error && data.error.message) {
        throw new Error(data.error.message)
      }

      // 解析模型返回的内容
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('AI 返回内容为空')
      }

      console.log('AI 审核原始响应:', content)

      // 提取 JSON 内容（可能包含在 markdown 代码块中）
      let jsonContent = content.trim()
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }

      let moderationResult
      try {
        moderationResult = JSON.parse(jsonContent)
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError)
        throw new Error(`AI 返回格式错误: ${content}`)
      }

      // 成功获取响应，处理结果
      console.log('AI 审核调用成功，结果:', moderationResult)

      if (moderationResult.flagged) {
        let categories = moderationResult.categories
        let flaggedCategories = Object.keys(categories).filter(
          (category) => categories[category],
        )
        let flaggedCategoriesText = flaggedCategories.map(
          (category) => categoriesTextMap[category],
        )

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
      lastError = error as Error
      console.error(`AI审核API调用失败（第 ${attempt + 1} 次）:`, error)

      // 如果不是最后一次尝试，继续重试
      if (attempt < MAX_RETRIES - 1) {
        console.log('将进行重试...')
        continue
      }
    }
  }

  // 所有重试都失败，抛出最后的错误
  console.error(`AI审核API在 ${MAX_RETRIES} 次尝试后仍然失败`)
  throw lastError || new Error('AI审核API调用失败')
}

export async function triggerDataUpdate(): Promise<void> {
  await dispatchWorkflow('create_data.yml', 'main')
}
