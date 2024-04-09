# vme

## 介绍

这是一个肯德基疯狂星期四文案库，用于收集、展示、分享各种疯狂星期四文案。
创建的原因之一是朋友给我了有一个 vme.im 域名，我想用它整个活。

## 致敬

项目创意来自 [whitescent/KFC-Crazy-Thursday](https://github.com/whitescent/KFC-Crazy-Thursday)

## 使用

### 不稳定的 API 服务，（包含其他数据来源，可能 api 会随时修改）：

- 获取随机文本：https://kfc.vme.im/get-text
- 获取随机 JSON：https://kfc.vme.im/get-json

### 使用 GitHub API 获取文案（仅包含当前仓库）：

本仓库所有

- 已收录文案：https://api.github.com/search/issues?q=label:收录+repo:zkl2333/vme
- 随机文本：https://api.github.com/search/issues?q=label:收录+repo:zkl2333/vme&per_page=1&sort=random
- graphql：
  ```graphql
  {
    repository(owner: "zkl2333", name: "vme") {
      issues(first: 10, labels: ["收录"]) {
        edges {
          node {
            title
            body
            url
            createdAt
          }
        }
      }
    }
  }
  ```

whitescent 仓库所有

- 已收录文案：https://api.github.com/search/issues?q=label:文案提供+repo:whitescent/KFC-Crazy-Thursday
- 随机文本：https://api.github.com/search/issues?q=label:文案提供+repo:whitescent/KFC-Crazy-Thursday&per_page=1&sort=random
- graphql：
  ```graphql
  {
    repository(owner: "whitescent", name: "KFC-Crazy-Thursday") {
      issues(first: 10, labels: ["文案提供"]) {
        edges {
          node {
            title
            body
            url
            createdAt
          }
        }
      }
    }
  }
  ```

## 如何使用 graphql？

```javascript
fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_ACCESS_TOKEN",
  },
  body: JSON.stringify({
    query: `
        {
          repository(owner: "zkl2333", name: "vme") {
            issues(first: 10, labels: ["收录"]) {
              edges {
                node {
                    title
                    body
                    url
                    createdAt
                }
              }
            }
          }
        }
        `,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## 如何贡献文案？

新建一个新的 [issue](https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title=) 填写标题（随意）和文本即可。

## 开发

### laf-cli

[官方文档](https://doc.laf.run/zh/cli/)

### 避免全局安装 laf-cli

在不希望或不能全局安装 laf-cli 的情况下，您可以通过修改环境变量 PATH 来临时添加项目本地 node_modules/.bin 目录到 PATH。这样做可以让您在项目目录下使用 laf 命令，而不需要全局安装它。以下是如何在不同的终端中实现这一点：

#### PowerShell

```powershell
$env:PATH += ";$PWD\node_modules\.bin"
```

#### Bash

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
```
