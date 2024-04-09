# vme
肯德基疯狂星期四文案库

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
