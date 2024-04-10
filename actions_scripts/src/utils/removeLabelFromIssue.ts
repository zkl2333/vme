import * as github from "@actions/github";

export async function removeLabelFromIssue(issueNumber: number, label: string) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  await octokit.rest.issues.removeLabel({
    ...github.context.repo,
    issue_number: issueNumber,
    name: label,
  });
}
