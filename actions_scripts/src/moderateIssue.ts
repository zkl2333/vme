import core from '@actions/core'
import github from '@actions/github'
import {
  addCommentToIssue,
  addLabelsToIssue,
  closeIssue,
  findSimilarIssue,
  // removeLabelFromIssue,
  getIssueLabels,
} from './utils'
import { dispatchWorkflow } from './utils'

const categoriesTextMap: Record<string, string> = {
  hate: '仇恨',
  sexual: '色情',
  violence: '暴力',
  'hate/threatening': '仇恨/威胁',
  'self-harm': '自残',
  'sexual/minors': '未成年人色情',
  'violence/graphic': '暴力/血腥',
}

export async function moderateIssue(issueNumber?: number, issueBody?: string) {
  // 如果没有传入参数，则使用环境变量（向后兼容）
  const targetIssueNumber = issueNumber || github.context.issue.number
  const targetIssueBody = issueBody || process.env.ISSUE_BODY

  if (!targetIssueBody) {
    throw new Error('ISSUE_BODY 不存在')
  }

  // 检查issue是否已被审核（已有特定标签）
  const currentLabels = await getIssueLabels(targetIssueNumber)
  const moderationLabels = ['违规', '收录', '重复', '待审']

  // 如果已有任何审核相关标签，跳过审核
  if (currentLabels.some((label) => moderationLabels.includes(label))) {
    console.log(
      `Issue #${targetIssueNumber} 已有审核标签: ${currentLabels.join(', ')}，跳过审核。`,
    )
    return
  }

  // 查找相似的 issue
  console.log(`开始查找相似文案，当前文案长度: ${targetIssueBody.length}`)
  const similarIssue = await findSimilarIssue(targetIssueBody)

  if (similarIssue) {
    console.log(`找到相似文案: ${similarIssue.url}`)
    await addLabelsToIssue(targetIssueNumber, ['重复'])
    await addCommentToIssue(
      targetIssueNumber,
      `🔍查找到相似文案：${similarIssue.url}`,
    )
    await closeIssue(targetIssueNumber)
    return
  } else {
    console.log('未找到相似文案，继续审核流程')
  }

  const API_URL = 'https://aihubmix.com/v1/moderations'
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: targetIssueBody }),
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

    if (flaggedCategoriesText.length > 0) {
      await addLabelsToIssue(targetIssueNumber, ['违规'])
      await addCommentToIssue(
        targetIssueNumber,
        `⛔️此内容因包含以下违规类别被标记：${flaggedCategoriesText.join('、')}。不予收录。`,
      )
      await closeIssue(targetIssueNumber)
    } else {
      await addLabelsToIssue(targetIssueNumber, ['待审'])
      await addCommentToIssue(
        targetIssueNumber,
        `⚠️内容可能违规，正等待进一步人工审核确认。`,
      )
    }
  } else {
    await addLabelsToIssue(targetIssueNumber, ['收录'])
    await addCommentToIssue(
      targetIssueNumber,
      `🤝您的内容已成功收录，感谢您的贡献！`,
    )
    await closeIssue(targetIssueNumber)
    await dispatchWorkflow('create_data.yml', 'main')
  }
}

// 保持向后兼容性，如果没有传入参数则使用原来的逻辑
if (require.main === module) {
  moderateIssue().catch((err) => core.setFailed(err.message))
}
