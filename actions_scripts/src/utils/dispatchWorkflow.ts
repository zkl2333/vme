import * as github from "@actions/github";

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
