# 环境变量配置

本项目可选配置GitHub Token来启用实时统计功能。

## 快速配置

1. **复制配置模板**

   ```bash
   cp env.local.example .env.local
   ```

2. **获取GitHub Token**

   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 只需勾选 **`public_repo`** 权限
   - 复制生成的token

3. **编辑.env文件**

   ```bash
   GITHUB_TOKEN=your_github_token_here
   ```

4. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 说明

- **有Token**: 显示真实的GitHub点赞和评论数据
- **无Token**: 网站正常运行，统计数据显示为0

## 注意事项

- ⚠️ 不要将 `.env` 文件提交到git仓库
- ⚠️ Token仅用于读取公开数据，不会修改任何内容
