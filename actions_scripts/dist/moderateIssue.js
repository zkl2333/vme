import * as core from '@actions/core';
import * as github from '@actions/github';

async function addCommentToIssue(issueNumber, comment) {
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

async function addLabelsToIssue(issueNumber, labels) {
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

async function removeLabelFromIssue(issueNumber, label) {
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

async function closeIssue(issueNumber) {
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

const categoriesTextMap = {
    hate: "仇恨",
    sexual: "色情",
    violence: "暴力",
    "hate/threatening": "仇恨/威胁",
    "self-harm": "自残",
    "sexual/minors": "未成年人色情",
    "violence/graphic": "暴力/血腥",
};
async function moderateIssue() {
    const issueNumber = github.context.issue.number;
    const issueBody = process.env.ISSUE_BODY;
    const API_URL = "https://api.aiproxy.io/v1/moderations";
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.AI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: issueBody }),
    });
    const data = await response.json();
    if (data.error && data.error.message) {
        throw new Error(data.error.message);
    }
    if (data.results[0].flagged) {
        let categories = data.results[0].categories;
        let flaggedCategories = Object.keys(categories).filter((category) => categories[category]);
        let flaggedCategoriesText = flaggedCategories.map((category) => categoriesTextMap[category]);
        await addLabelsToIssue(issueNumber, ["不当"]);
        await removeLabelFromIssue(issueNumber, "文案");
        await addCommentToIssue(issueNumber, `问题内容被标记为：${flaggedCategoriesText.join("、")}。不予收录。`);
        await closeIssue(issueNumber);
    }
    else {
        await addLabelsToIssue(issueNumber, ["收录"]);
        await closeIssue(issueNumber);
    }
}
moderateIssue().catch((err) => core.setFailed(err.message));

export { moderateIssue };
