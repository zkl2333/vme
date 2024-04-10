import { O as Octokit, a as core } from './index-n69jnTp_.js';
import require$$0 from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import 'os';
import 'http';
import 'https';
import 'net';
import 'tls';
import 'events';
import 'assert';
import 'util';
import 'stream';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:stream';
import 'node:util';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';

async function fetchIssues(owner, name, labels, afterCursor = null) {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const query = `query ($owner: String!, $name: String!, $labels: [String!], $afterCursor: String) {
    repository(owner: $owner, name: $name) {
      issues(labels: $labels, first: 10, after: $afterCursor) {
        edges {
          node {
            title
            url
            body
            author {
              username: login
              avatarUrl
              url
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }`;
    const variables = {
        owner,
        name,
        labels,
        afterCursor,
    };
    const data = await octokit.graphql(query, variables);
    const issues = data.repository.issues.edges.map((edge) => edge.node);
    const pageInfo = data.repository.issues.pageInfo;
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
        return issues.concat(await fetchIssues(owner, name, labels, pageInfo.endCursor));
    }
    else {
        return issues;
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function createData() {
    console.log("开始创建数据");
    if (!process.env.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN 必须存在");
    }
    const data = {
        ...(await fetchIssues("zkl2333", "vme", ["收录"])),
        ...(await fetchIssues("whitescent", "KFC-Crazy-Thursday", ["文案提供"])),
    };
    console.log(`获取到 ${Object.keys(data).length} 条数据`);
    // 输出到文件到仓库根目录
    const filePath = path.join(__dirname, "../..", "data.json");
    require$$0.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("数据已经写入到 data.json 文件", filePath);
    // 提交到仓库
    execSync("git config --global user.name github-actions[bot]");
    execSync("git config --global user.email github-actions[bot]@users.noreply.github.com");
    // 检查文件变化
    const status = execSync(`git status ${filePath} --porcelain`).toString().trim();
    console.log(status);
    if (status) {
        console.log("文件有变化，开始提交到仓库");
        try {
            execSync(`git add ${filePath}`);
            execSync('git commit -m "自动更新数据"');
            execSync("git push");
            console.log("data.json 的变化已经提交到仓库");
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("提交过程中发生错误：", error.message);
                throw error;
            }
            else {
                console.log("发生了未知类型的错误");
            }
        }
    }
    else {
        console.log("data.json 没有变化，跳过提交");
    }
}
createData().catch((err) => core.setFailed(err.message));
