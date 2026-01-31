import github from '@actions/github'

export interface GitHubIssuePayload {
  id: string
  number: number
  title: string
  body: string | null
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
}

function normalizeSyncUrl(value: string): string {
  if (value.endsWith('/api/sync')) {
    return value
  }
  return `${value.replace(/\/$/, '')}/api/sync`
}

export function toIssuePayloadFromRestIssue(issue: any): GitHubIssuePayload {
  return {
    id: issue.node_id || String(issue.id || ''),
    number: issue.number,
    title: issue.title || '',
    body: issue.body ?? '',
    user: {
      login: issue.user?.login || 'unknown',
      avatar_url: issue.user?.avatar_url || '',
      html_url: issue.user?.html_url || '',
    },
    created_at: issue.created_at || new Date().toISOString(),
    updated_at: issue.updated_at || new Date().toISOString(),
    html_url: issue.html_url || '',
  }
}

export async function fetchIssuePayload(issueNumber: number): Promise<GitHubIssuePayload> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN 不存在')
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
  const response = await octokit.rest.issues.get({
    ...github.context.repo,
    issue_number: issueNumber,
  })

  return toIssuePayloadFromRestIssue(response.data)
}

export async function syncIssueToApp(issuePayload: GitHubIssuePayload): Promise<void> {
  const syncUrlRaw = process.env.SYNC_API_URL
  const apiKey = process.env.SYNC_API_KEY

  if (!syncUrlRaw || !apiKey) {
    console.warn('SYNC_API_URL 或 SYNC_API_KEY 未配置，跳过同步')
    return
  }

  const repo = github.context.repo
  const syncUrl = normalizeSyncUrl(syncUrlRaw)

  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      mode: 'single',
      issue: issuePayload,
      repo: { owner: repo.owner, name: repo.repo },
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Sync API 失败: ${response.status} ${response.statusText} ${text}`)
  }
}
