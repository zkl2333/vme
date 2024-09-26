import github from "@actions/github";
import path from "path";
import fs from "fs";
import { IssueNode } from "./fetchIssues";
import { removeSeparator } from "./removeSeparator";

// 获取 Octokit 实例
export function getOctokit() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }
  return github.getOctokit(process.env.GITHUB_TOKEN);
}

// 获取仓库的所有 issues
export async function addCommentToIssue(issueNumber: number, comment: string) {
  const octokit = getOctokit();
  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: issueNumber,
    body: comment,
  });
}

// 为 issue 添加标签
export async function addLabelsToIssue(issueNumber: number, labels: string[]) {
  const octokit = getOctokit();
  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: issueNumber,
    labels: labels,
  });
}

// 为 issue 移除标签
export async function removeLabelFromIssue(issueNumber: number, label: string) {
  const octokit = getOctokit();
  await octokit.rest.issues.removeLabel({
    ...github.context.repo,
    issue_number: issueNumber,
    name: label,
  });
}

// 关闭 issue
export async function closeIssue(issueNumber: number) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  await octokit.rest.issues.update({
    ...github.context.repo,
    issue_number: issueNumber,
    state: "closed",
  });
}

// 触发工作流
export async function dispatchWorkflow(workflow_id: string, ref: string) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  await octokit.rest.actions.createWorkflowDispatch({
    ...github.context.repo,
    workflow_id,
    ref,
  });
}

// 最短编辑距离
export function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;
  const dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
      }
    }
  }
  return dp[m][n];
}

// 判断两个文本是否相似
export function isSimilar(str1: string, str2: string): boolean {
  const distance = minDistance(removeSeparator(str1), removeSeparator(str2));
  const maxLength = Math.max(str1.length, str2.length);
  return distance / maxLength < 0.2;
}

// 读取本地文件保存的所有文案
export async function fetchLocalIssues(): Promise<IssueNode[]> {
  const filePath = path.join(process.cwd(), "../", "data.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// 判断新的文案是否有相似的存在，如果有则返回相似的文案
export async function findSimilarIssue(newIssue: string): Promise<IssueNode | null> {
  const issues = await fetchLocalIssues();
  for (const issue of issues) {
    if (isSimilar(issue.body, newIssue)) {
      return issue;
    }
  }
  return null;
}
