import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      username: string   // GitHub 登录名
      nickname?: string | null  // 显示名 / 昵称
      email?: string | null
      image?: string | null
    }
  }
}

// 服务器端专用的session类型
export interface ServerSession extends DefaultSession {
  user: {
    id: number
    username: string
    nickname?: string | null
    email?: string | null
    image?: string | null
  }
}
