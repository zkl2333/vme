# vme

![Social preview](https://repository-images.githubusercontent.com/784130959/c8f54bbe-3f0e-4588-8928-e02702b946e5)

## 介绍

这是一个肯德基疯狂星期四文案库，用于收集、展示、分享各种疯狂星期四文案。
创建的原因之一是朋友给我了有一个 vme.im 域名，我想用它整个活。

## 致敬

项目创意来自 [whitescent/KFC-Crazy-Thursday](https://github.com/whitescent/KFC-Crazy-Thursday)

## 使用

### 不稳定的 API 服务，（包含其他数据来源，可能 api 会随时修改）：

- 获取随机文本：https://kfc.vme.im/get-text
- 获取随机 JSON：https://kfc.vme.im/get-json

### 获取所有数据

https://fastly.jsdelivr.net/gh/zkl2333/vme/data.json

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
