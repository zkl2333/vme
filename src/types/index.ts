// 共享类型定义文件 - 可以在客户端和服务端使用

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
  comments?: {
    totalCount: number
  }
}

export interface JokeDisplayItem {
  content: string
  author: string
  avatar: string
  date: string
  likes: number
  comments: number
}

export interface IssueStats {
  [key: string]: {
    reactions: number
    comments: number
  }
}
