import { fetchIssues } from "./utils/fetchIssues";
import core from "@actions/core";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from 'url'

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url)
// 获取当前文件所在的目录
const __dirname = path.dirname(__filename)

async function createData() {
  console.log('开始创建数据')

  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN 必须存在')
  }

  const data = [
    ...(await fetchIssues('zkl2333', 'vme', ['收录'])),
    ...(await fetchIssues('whitescent', 'KFC-Crazy-Thursday', ['文案提供'])),
  ]

  console.log(`获取到 ${Object.keys(data).length} 条数据`)

  // 按月份分组数据
  const dataByMonth: Record<string, any[]> = {}
  data.forEach((item) => {
    const date = new Date(item.createdAt)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!dataByMonth[month]) {
      dataByMonth[month] = []
    }
    dataByMonth[month].push(item)
  })

  // 确保data目录存在
  const dataDir = path.join(__dirname, '..', '..', 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log(`创建目录: ${dataDir}`)
  }

  // 记录更改的文件
  const changedFiles: string[] = []

  // 将数据按月份写入对应文件
  for (const [month, items] of Object.entries(dataByMonth)) {
    const filePath = path.join(dataDir, `${month}.json`)
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2))
    console.log(`月份数据已写入: ${filePath}，共 ${items.length} 条`)

    // 记录相对路径用于git操作
    const relativeFilePath = path.relative(
      path.join(process.cwd(), '..'),
      filePath,
    )
    changedFiles.push(relativeFilePath)
  }

  // 提交到仓库
  execSync('git config --global user.name github-actions[bot]')
  execSync(
    'git config --global user.email github-actions[bot]@users.noreply.github.com',
  )

  // 检查文件变化并提交
  if (changedFiles.length > 0) {
    console.log('文件有变化，开始提交到仓库')
    try {
      // 添加所有更改的文件
      changedFiles.forEach((file) => {
        execSync(`git add ${file}`)
      })

      execSync('git commit -m "自动更新按月份数据"')
      execSync('git push')
      console.log('数据变化已经提交到仓库')
    } catch (error) {
      if (error instanceof Error) {
        console.error('提交过程中发生错误：', error.message)
        throw error
      } else {
        console.log('发生了未知类型的错误')
      }
    }
  } else {
    console.log('数据没有变化，跳过提交')
  }
}

createData().catch((err) => core.setFailed(err.message));
