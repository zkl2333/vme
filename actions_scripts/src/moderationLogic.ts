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

  // 调用AI审核API
  console.log('调用AI审核API...')
  const API_URL = 'https://aihubmix.com/v1/moderations'

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: issueBody }),
    })

    const data = await response.json()

    if (data.error && data.error.message) {
      throw new Error(data.error.message)
    }

    if (data.results[0].flagged) {
      let categories = data.results[0].categories
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
    console.error(`AI审核API调用失败:`, error)
    throw error
  }
}

export async function triggerDataUpdate(): Promise<void> {
  await dispatchWorkflow('create_data.yml', 'main')
}
