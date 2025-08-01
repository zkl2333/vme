// 共享类型定义文件 - 可以在客户端和服务端使用

export interface ReactionGroup {
  content: string
  users: {
    totalCount: number
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

export interface IssueStats {
  [key: string]: {
    reactions: number
    reactionDetails: ReactionGroup[]
  }
}
