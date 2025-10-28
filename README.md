# 🍗 vme - 肯德基疯狂星期四文案库

![Social preview](https://repository-images.githubusercontent.com/784130959/484af8b9-64c2-4f54-a171-f855678c9bee)

> 一个社区驱动的肯德基疯狂星期四段子分享平台，让每个星期四都充满欢乐！

## ✨ 项目特色

- 🎯 **社区驱动** - 通过 GitHub Issues 收集和管理段子内容
- 🎲 **随机推荐** - 每次访问都有新的段子惊喜
- 👑 **梗王排行** - 展示最受欢迎的段子创作者
- 📊 **实时互动** - 支持点赞、评论等社交功能
- 📱 **完美适配** - 响应式设计，手机电脑都能畅享
- 🎨 **KFC主题** - 经典红黄配色，满满的疯狂星期四氛围
- ⚡ **极速体验** - 智能缓存，秒开页面

## 🚀 快速开始

### 在线体验
直接访问 [vme.im](https://vme.im) 即可开始使用！

### 本地部署
如果你想在本地运行这个项目：

```bash
# 1. 克隆项目
git clone https://github.com/zkl2333/vme.git
cd vme

# 2. 安装依赖
npm install

# 3. 配置环境变量（用于GitHub OAuth登录功能）
cp env.local.example .env.local
# 编辑 .env.local 添加你的 GitHub OAuth 应用配置

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器访问 http://localhost:3000
```

## 🎯 如何使用

### 浏览段子
- **首页** - 查看随机推荐的段子
- **段子列表** - 浏览所有段子，支持分页
- **排行榜** - 查看最受欢迎的创作者

### 互动功能
- **点赞** - 为喜欢的段子点赞（需要 GitHub 登录）
- **分享** - 复制段子内容分享给朋友
- **贡献** - 提交你自己的段子创意

### 贡献段子
1. 点击"贡献文案"按钮
2. 使用 GitHub 账号登录
3. 填写段子标题和内容
4. 提交后会自动进入审核流程
5. 审核通过后就会出现在段子库中

## 🔧 开发者信息

### API 接口
如果你需要集成我们的 API：

```bash
# 获取随机段子
GET /api/random
GET /api/random?format=text  # 纯文本格式

# 获取段子列表
GET /api/items
GET /api/items/page?page=1&pageSize=10  # 分页数据

# 获取统计数据
GET /api/stats
```

### 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **认证**: NextAuth.js + GitHub OAuth
- **数据**: GitHub Issues + GitHub API
- **部署**: Vercel

## 🤝 贡献指南

### 贡献段子内容
1. **在线提交** - 访问网站点击"贡献文案"按钮
2. **GitHub Issues** - 直接创建 [Issue](https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title=) 提交段子

### 贡献代码
1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 项目创意来自 [whitescent/KFC-Crazy-Thursday](https://github.com/whitescent/KFC-Crazy-Thursday)
- 感谢所有贡献段子的朋友们！
- 感谢 GitHub 提供的免费服务支持

---

**让每个星期四都充满欢乐！** 🍗✨
