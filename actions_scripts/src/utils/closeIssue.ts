import * as github from "@actions/github";

export async function closeIssue(issueNumber: any) {
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
