// 共享类型定义文件 - 可以在客户端和服务端使用

// 贡献者信息
export interface Contributor {
  username: string
  count: number
  avatarUrl: string
  url: string
}

// Summary 数据结构
export interface Summary {
  totalItems: number
  totalContributors: number
  months: {
    month: string
    count: number
  }[]
  contributors: Contributor[]
  topContributors: Contributor[]
  updatedAt: string
}

// GitHub reaction统计信息（用于显示总数）
export interface ReactionGroup {
  content: string
  users: {
    totalCount: number
  }
}

// GitHub reaction详细信息（用于用户状态跟踪）
export interface ReactionNode {
  id: string
  content: string
  user: {
    login: string
  }
}

export interface IKfcItem {
  id: string
  title: string
  url: string
  body: string
  createdAt: string
  updatedAt: string
  author: {
    username: string
    avatarUrl: string
    url: string
  }
  reactions?: {
    totalCount: number
  }
}

export interface JokeDisplayItem {
  content: string
  author: string
  avatar: string
  date: string
  likes: number
}

// Issue统计数据 - 包含两种reaction数据
export interface IssueStats {
  [key: string]: {
    reactions: number
    reactionDetails: ReactionGroup[]  // 统计信息：每种reaction的总数
    reactionNodes: ReactionNode[]     // 详细信息：每个reaction的ID和用户
  }
}

// GitHub支持的reaction类型
export type GitHubReaction = 'THUMBS_UP' | 'THUMBS_DOWN' | 'LAUGH' | 'CONFUSED' | 'HEART' | 'HOORAY' | 'ROCKET' | 'EYES'

// 点赞操作相关类型
export interface LikeRequest {
  issueId: string
  reaction: GitHubReaction
}

export interface LikeResponse {
  success: boolean
  message: string
  reactionId?: string
}

// 文案提交相关类型
export interface SubmitJokeRequest {
  title: string
  content: string
}

export interface SubmitJokeResponse {
  success: boolean
  message: string
  issueUrl?: string
  issueNumber?: number
  issueId?: string
  detailPath?: string
}
