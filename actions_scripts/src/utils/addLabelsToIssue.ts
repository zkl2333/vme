import * as github from "@actions/github";

export async function addLabelsToIssue(issueNumber: number, labels: string[]) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: issueNumber,
    labels: labels,
  });
}
