# V50 图文投稿方案与技术选型

## 背景与目标
vme 是社区驱动的 V50 文案库。为增强传播力与梗感，需要支持图文并茂的投稿（文案 + 梗图），并保持现有"Issue 作为单一事实来源 + Actions 生成 data"的双层架构不变。

本方案目标：
- 保持文案展示与现有样式一致
- 新增"梗图字段"与"梗图资源存储"能力
- 前端投稿页提供明确的"梗图投稿入口"
- 明确支持"纯图投稿"（仅梗图，无文案）
- 现有"文字文案投稿"流程不做改动

## 用户流程

### 文字文案投稿（现有流程，不变）
1. 用户填写标题/内容
2. 前端创建 Issue，自动打 `文案` 标签
3. Actions 监听 `文案` 标签触发审核

### 梗图投稿（新增入口）
1. 用户在前端上传图片 → 调用 `/api/image-upload` 获取链接
2. 用户填写标题/内容（可为空），图片链接以 markdown 语法嵌入 body
3. 前端创建 Issue，自动打 `梗图` 标签
4. Actions 监听 `梗图` 标签触发审核（与文案流程一致）

## Issue 标签区分

| 标签 | 类型 | 说明 |
|-----|------|------|
| `文案` | 文字投稿 | 现有流程，不变 |
| `梗图` | 图文投稿 | 新增，body 中含 markdown 图片 |

## Issue Body 格式

不再强制要求特定段落结构。图片直接用 markdown 语法嵌入：

```markdown
## 文案标题
{title}

## 文案内容
{content}

![](https://example.com/image1.jpg)
![](https://example.com/image2.jpg)
```

### 解析规则
- 根据 Issue label 判断类型
- 有 `梗图` 标签 → 用正则提取 body 中所有 `![...](url)` 图片链接
- 纯图投稿：`文案内容` 可为空，但必须有至少一张图片

## 技术选型

### 图片存储：Cloudflare R2

选择 R2 而非 GitHub 仓库的原因：
- 用户 GitHub Token 无仓库写入权限
- 避免仓库体积膨胀
- R2 免费额度充足，无出口流量费

**Cloudflare R2 免费额度：**
- 10GB 存储空间
- 100 万次写入/月（Class A）
- 1000 万次读取/月（Class B）
- 无出口流量费

**存储配置：**
- Bucket：`vme-images`（或自定义）
- 路径规范：`memes/{timestamp}-{hash}.{ext}`
- 访问域名：绑定自定义域名或使用 R2.dev 公开访问

**环境变量：**
```
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=vme-images
R2_PUBLIC_URL=https://img.example.com
```

### 图片上传 API
- Endpoint：`POST /api/image-upload`
- 认证：需要用户登录（防滥用）
- 存储：服务端使用 R2 API Token 上传（非用户 Token）
- 表单字段：
  - `file`：必填，图片文件
- 返回：
  - `url`：图片公开访问链接
  - `key`：R2 存储路径

**依赖：**
```bash
pnpm add @aws-sdk/client-s3
```

R2 兼容 S3 API，使用 AWS SDK 即可操作。

## 数据结构扩展（JSON）

在现有文案数据结构中新增字段：

```ts
interface KfcItem {
  // 原字段不变
  images?: string[]
  cover?: string
}
```

- `images`：梗图列表（从 body 中提取的图片链接）
- `cover`：首图（`images[0]`）

## 审核策略

### 文字文案
- 现有 AI 审核流程不变

### 梗图投稿
- **乐观审核，默认放行**：暂无图片审核自动化能力和 API
- 提交后直接通过，由管理员事后下架不合适内容
- 后续可接入图片审核 API 升级为自动审核

## Actions 改动

### issue_moderation.yml
```yaml
if: github.event.label.name == '文案' || github.event.label.name == '梗图'
```

### moderateIssue.ts
- 读取 Issue labels 判断类型
- `文案` 标签：走现有 AI 审核流程
- `梗图` 标签：跳过内容审核，直接通过，提取图片链接写入数据

## 前端改动

### SubmitForm
- 新增 Tab 或入口切换"文案投稿" / "梗图投稿"
- 梗图模式：显示图片上传区域，调用 `/api/image-upload`
- 提交时根据模式打不同标签

## 安全与限制
- 格式：jpg/png/webp/gif
- 数量：建议最多 6 张
- 单图大小：服务端限制（默认 6MB）

## 兼容性说明
- 旧文案无 `梗图` 标签，不受影响
- 梗图入口为新增功能，不改现有文字投稿
- 前端模块新增梗图能力，但不影响现有文案展示样式
