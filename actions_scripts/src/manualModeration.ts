import core from '@actions/core'
import github from '@actions/github'
import { moderateContent, triggerDataUpdate } from './moderationLogic'
import { toIssuePayloadFromRestIssue } from './syncClient'

export async function manualModeration() {
  const dryRun = process.env.DRY_RUN === 'true'

  if (dryRun) {
    console.log('🔍 试运行模式：不会执行实际操作')
  }

  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN 不存在')
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN)

  // 获取所有带有"文案"或"梗图"标签的已打开issues
  console.log('正在获取所有带有"文案"或"梗图"标签的已打开issues...')

  // 分别获取两种标签的 issues
  const [textIssues, memeIssues] = await Promise.all([
    octokit.rest.issues.listForRepo({
      ...github.context.repo,
      state: 'open',
      labels: '文案',
      per_page: 100,
    }),
    octokit.rest.issues.listForRepo({
      ...github.context.repo,
      state: 'open',
      labels: '梗图',
      per_page: 100,
    }),
  ])

  // 合并并去重（按 issue number）
  const issueMap = new Map<number, typeof textIssues.data[0]>()
  for (const issue of [...textIssues.data, ...memeIssues.data]) {
    issueMap.set(issue.number, issue)
  }
  const issues = Array.from(issueMap.values())

  console.log(`找到 ${issues.length} 个待审核issues（文案: ${textIssues.data.length}, 梗图: ${memeIssues.data.length}）`)

  let processedCount = 0
  let similarCount = 0
  let violationCount = 0
  let approvedCount = 0
  let pendingCount = 0

  for (const issue of issues) {
    console.log(`\n--- 处理 Issue #${issue.number}: ${issue.title} ---`)

    if (!issue.body) {
      console.log('跳过：issue内容为空')
      continue
    }

    processedCount++

    try {
      // 使用新的审核逻辑模块
      const issuePayload = toIssuePayloadFromRestIssue(issue)
      const result = await moderateContent(issue.number, issue.body, dryRun, issuePayload)

      // 根据审核结果统计
      switch (result.type) {
        case 'similar':
          similarCount++
          break
        case 'violation':
          violationCount++
          break
        case 'approved':
          approvedCount++
          break
        case 'pending':
          pendingCount++
          break
      }
    } catch (error) {
      console.error(`处理Issue #${issue.number}时出错:`, error)
    }
  }

  // 输出统计信息
  console.log('\n=== 审核统计 ===')
  console.log(`总处理数: ${processedCount}`)
  console.log(`重复文案: ${similarCount}`)
  console.log(`违规内容: ${violationCount}`)
  console.log(`审核通过: ${approvedCount}`)
  console.log(`待审内容: ${pendingCount}`)

  if (dryRun) {
    console.log('\n🔍 试运行模式：以上操作未实际执行')
  } else if (approvedCount > 0) {
    console.log('\n触发数据更新工作流...')
    await triggerDataUpdate()
  }
}

manualModeration().catch((err) => core.setFailed(err.message))
