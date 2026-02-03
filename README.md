# 🍗 vme-content - 文案数据与自动化仓库

> 该仓库只保留 **文案数据** 与 **自动化脚本**。  
> Web 应用与同步服务已拆分至 **vme-app**。

## ✅ 仓库职责

- **文案数据快照**：`data/` 与 `data.json`
- **自动化脚本**：`actions_scripts/`
  - 审核逻辑
  - 数据生成与同步脚本

## 📂 目录说明

- `data/`：按月份拆分的文案数据
- `data.json`：汇总数据
- `actions_scripts/`：审核与数据处理脚本

## 🔁 同步关系

- 文案数据由自动化脚本产出
- Web 应用与 API 同步逻辑不在本仓库维护

## 🤝 贡献说明

- 文案投稿与展示，请前往 **vme-app** 对应入口
- 本仓库主要用于数据与脚本维护

## 🚀 投稿入口

```
https://vme.im/submit
```

## 🔗 相关仓库

- [vme-content](https://github.com/vme-im/vme-content) - 文案数据与自动化脚本
- [vme-app](https://github.com/vme-im/vme-app) - Web 应用与同步服务
