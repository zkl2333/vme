# vme

![Social preview](https://repository-images.githubusercontent.com/784130959/c8f54bbe-3f0e-4588-8928-e02702b946e5)

## 介绍

这是一个肯德基疯狂星期四文案库，用于收集、展示、分享各种疯狂星期四文案。
创建的原因之一是朋友给我了有一个 vme.im 域名，我想用它整个活。

## 特性

- 🍗 **精美的KFC主题设计** - 红黄配色，炸鸡元素，满满的疯狂星期四氛围
- 📱 **响应式设计** - 完美适配手机和桌面端
- 🎲 **随机段子推荐** - 每次刷新都有新的惊喜
- 👑 **梗王排行榜** - 展示最受欢迎的段子贡献者
- 📊 **实时统计数据** - 显示GitHub Issues的真实点赞和评论数量
- 📄 **智能分页** - 支持翻页浏览，省略号智能显示
- ⚡ **API缓存** - 5分钟缓存机制，避免频繁请求GitHub API
- 🎨 **炫酷动画** - 炸鸡旋转、按钮脉冲等趣味动效

## 致敬

项目创意来自 [whitescent/KFC-Crazy-Thursday](https://github.com/whitescent/KFC-Crazy-Thursday)

## 配置

### 环境变量

为了启用实时GitHub统计功能（显示真实的点赞数和评论数），可选配置GitHub Token：

1. 复制 `env.local.example` 到 `.env`
2. 添加你的GitHub Personal Access Token

详细配置说明请查看：[ENVIRONMENT.md](./ENVIRONMENT.md)

### 开发环境

```bash
# 安装依赖
npm install

# 配置环境变量（可选，启用实时统计功能）
cp env.local.example .env
# 编辑 .env 添加你的 GITHUB_TOKEN

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

## 使用

### API 服务

#### 获取随机文案
- `GET /api/random` - 随机获取一条文案（JSON格式）
- `GET /api/random?format=text` - 随机获取一条文案（纯文本格式）

#### 获取所有文案
- `GET /api/items` - 获取所有文案数据（JSON格式）

#### 获取分页文案
- `GET /api/items/page?page=1&pageSize=10` - 分页获取文案数据

#### 获取实时统计数据
- `POST /api/stats` - 获取GitHub Issues的实时点赞和评论数据

### 开发工具

```bash
# 代码格式检查
npm run lint
```

### 获取所有数据（旧版，不推荐）

https://fastly.jsdelivr.net/gh/zkl2333/vme/data.json

## 如何贡献文案？

新建一个新的 [issue](https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title=) 填写标题（随意）和文本即可。
