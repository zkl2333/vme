# 组件结构说明

## 📁 按功能组织的目录结构

```
src/components/
├── jokes/           段子功能模块
│   ├── List.tsx                    # 列表容器（服务端）
│   ├── ListWithReactions.tsx       # 批量反应数据注入器（客户端）
│   ├── Card.tsx                    # 段子卡片
│   ├── Detail.tsx                  # 段子详情（服务端）
│   ├── DetailClient.tsx            # 详情客户端交互
│   └── index.ts                    # 统一导出
│
├── reactions/       互动反应模块
│   ├── Interactive.tsx             # 容器组件（数据+状态）
│   ├── UI.tsx                      # 纯UI组件
│   ├── Loading.tsx                 # 加载状态UI
│   ├── Login.tsx                   # 登录提示UI
│   ├── LikeButton.tsx              # 点赞按钮
│   └── index.ts                    # 统一导出
│
├── leaderboard/     排行榜模块
│   ├── List.tsx                    # 排行榜列表（服务端）
│   ├── SortTabs.tsx                # 排序标签（客户端）
│   └── index.ts                    # 统一导出
│
├── submit/          提交模块
│   ├── Form.tsx                    # 提交表单
│   ├── StarField.tsx               # 背景星空
│   └── index.ts                    # 统一导出
│
├── status/          状态监控模块
│   ├── Dashboard.tsx               # 状态仪表板
│   └── index.ts                    # 统一导出
│
├── shared/          共享组件
│   ├── CopyButton.tsx              # 复制按钮
│   ├── FormattedDate.tsx           # 日期格式化
│   ├── LoginButton.tsx             # 登录按钮
│   ├── LoginDialog.tsx             # 登录对话框
│   ├── Pagination.tsx              # 分页组件
│   └── index.ts                    # 统一导出
│
└── IconLink.tsx     # 图标链接（通用）
```

## 🎯 模块职责

### Jokes 模块（段子）

#### `List.tsx` (服务端)
- **职责**: 获取分页数据，渲染列表结构
- **层级**: Page → List → ListWithReactions → Card

#### `ListWithReactions.tsx` (客户端)
- **职责**: 批量获取所有段子的互动数据，注入到各个卡片
- **数据流**: 一次批量请求 → 注入给10个卡片
- **优化**: 避免单个组件重复请求

#### `Card.tsx`
- **职责**: 展示单个段子的内容、作者、互动
- **智能加载**: 批量加载期间显示骨架屏

#### `Detail.tsx` (服务端)
- **职责**: 展示单个段子的完整详情

#### `DetailClient.tsx` (客户端)
- **职责**: 提供"换个段子"按钮交互

### Reactions 模块（互动反应）

#### `Interactive.tsx`
- **职责**: 容器组件，管理数据获取、状态、用户会话
- **策略**: 列表页用批量数据，详情页自动请求
- **优化**: 利用 SWR 缓存避免重复请求

#### `UI.tsx`
- **职责**: 纯UI组件，展示反应按钮和数据
- **无状态**: 只接收 props，不含逻辑

#### `Loading.tsx`
- **职责**: 加载状态UI（骨架屏）

#### `Login.tsx`
- **职责**: 未登录状态UI（模糊数据 + 登录提示）

#### `LikeButton.tsx`
- **职责**: 处理单个反应的点击、显示和状态管理

### Leaderboard 模块（排行榜）

#### `List.tsx`
- **职责**: 获取和展示排行榜数据（服务端）

#### `SortTabs.tsx`
- **职责**: 排序方式切换（客户端）

### Submit 模块（提交）

#### `Form.tsx`
- **职责**: 段子提交表单

#### `StarField.tsx`
- **职责**: 背景动画效果

### Status 模块（状态监控）

#### `Dashboard.tsx`
- **职责**: 系统状态和 API 限流监控

### Shared 模块（共享组件）

通用组件，可在多个模块中使用：
- `CopyButton` - 复制功能
- `FormattedDate` - 日期格式化
- `LoginButton` - 登录/登出按钮
- `LoginDialog` - 登录确认对话框
- `Pagination` - 分页控件

## 💡 设计原则

1. **按功能分组**: 相关组件放在同一模块
2. **语义化命名**: 名称清楚表达职责
3. **清晰的分层**: UI、逻辑、状态分离
4. **统一导出**: 每个模块有 index.ts
5. **易于维护**: 职责单一，便于测试

## 🔄 数据流示例（Jokes 列表页）

```
Page (SSR)
  ↓ 获取段子列表数据
jokes/List (Server)
  ↓ 传递 items[]
jokes/ListWithReactions (Client)
  ↓ 批量获取互动数据（1个请求）
  ↓ 注入到各个卡片
jokes/Card × 10
  ↓ 渲染段子 + 互动
reactions/Interactive
  ↓ 使用批量数据（不发起请求）
reactions/UI
  ↓ 显示反应按钮
```

### 批量获取优化

**问题**: 10个段子 × 1个请求 = 10个请求 ❌

**解决方案**: 
1. `ListWithReactions` 发起 **1个批量请求** 获取所有数据 ✅
2. 数据填充到 SWR 全局缓存
3. 批量加载期间显示 `Loading` 状态
4. 加载完成后，各个 `Interactive` 组件直接从缓存读取

**效果**: 
- 列表页刷新：1个批量请求
- 翻页：1个批量请求
- 无重复请求 🎉

## 📦 使用示例

```typescript
// 导入整个模块
import { JokesList, JokeCard, JokeDetail } from '@/components/jokes'
import { InteractiveReactions, LikeButton } from '@/components/reactions'

// 或单独导入
import JokesList from '@/components/jokes/List'
import InteractiveReactions from '@/components/reactions/Interactive'
import { FormattedDate, CopyButton } from '@/components/shared'
```

## ✨ 重组完成

✅ 所有组件已按功能模块重新组织  
✅ 删除了 `client/` 和 `server/` 文件夹  
✅ 结构清晰，易于维护  
✅ 批量获取优化，避免重复请求  
✅ 无 Lint 错误
