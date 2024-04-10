import * as github from "@actions/github";

export async function addCommentToIssue(issueNumber: number, comment: string) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: issueNumber,
    body: comment,
  });
}
