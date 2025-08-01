import core from '@actions/core'
import github from '@actions/github'
import { moderateContent, triggerDataUpdate } from './moderationLogic'

export async function moderateIssue(issueNumber?: number, issueBody?: string) {
  // 如果没有传入参数，则使用环境变量（向后兼容）
  const targetIssueNumber = issueNumber || github.context.issue.number
  const targetIssueBody = issueBody || process.env.ISSUE_BODY

  if (!targetIssueBody) {
    throw new Error('ISSUE_BODY 不存在')
  }

  const result = await moderateContent(
    targetIssueNumber,
    targetIssueBody,
    false,
  )

  // 如果审核通过，触发数据更新
  if (result.type === 'approved') {
    await triggerDataUpdate()
  }
}

moderateIssue().catch((err) => core.setFailed(err.message))
