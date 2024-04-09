# vme
肯德基疯狂星期四文案库

## 致敬
项目创意来自[whitescent/KFC-Crazy-Thursday](https://github.com/whitescent/KFC-Crazy-Thursday)

## 如何添加新的文案？

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
