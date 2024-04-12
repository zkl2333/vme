import { fetchIssues } from "./utils/fetchIssues";
import core from "@actions/core";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

async function createData() {
  console.log("开始创建数据");

  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN 必须存在");
  }

  const data = [
    ...(await fetchIssues("zkl2333", "vme", ["收录"])),
    ...(await fetchIssues("whitescent", "KFC-Crazy-Thursday", ["文案提供"])),
  ];

  console.log(`获取到 ${Object.keys(data).length} 条数据`);

  // 输出到文件到仓库根目录
  const filePath = path.join(process.cwd(), "..", "data.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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
    } catch (error) {
      if (error instanceof Error) {
        console.error("提交过程中发生错误：", error.message);
        throw error;
      } else {
        console.log("发生了未知类型的错误");
      }
    }
  } else {
    console.log("data.json 没有变化，跳过提交");
  }
}

createData().catch((err) => core.setFailed(err.message));
