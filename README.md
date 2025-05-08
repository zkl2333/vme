# vme

![Social preview](https://repository-images.githubusercontent.com/784130959/c8f54bbe-3f0e-4588-8928-e02702b946e5)

## 介绍

这是一个肯德基疯狂星期四文案库，用于收集、展示、分享各种疯狂星期四文案。
创建的原因之一是朋友给我了有一个 vme.im 域名，我想用它整个活。

## 致敬

项目创意来自 [whitescent/KFC-Crazy-Thursday](https://github.com/whitescent/KFC-Crazy-Thursday)

## 使用

### API 服务

#### 获取随机文案
- `GET /api/random` - 随机获取一条文案（JSON格式）
- `GET /api/random?format=text` - 随机获取一条文案（纯文本格式）

#### 获取所有文案
- `GET /api/items` - 获取所有文案数据（JSON格式）

### 获取所有数据（旧版，不推荐）

https://fastly.jsdelivr.net/gh/zkl2333/vme/data.json

## 如何贡献文案？

新建一个新的 [issue](https://github.com/zkl2333/vme/issues/new?assignees=&labels=%E6%96%87%E6%A1%88&projects=&template=data_provided.md&title=) 填写标题（随意）和文本即可。
