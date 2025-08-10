import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: number
      username: string   // GitHub 登录名
      nickname?: string | null  // 显示名 / 昵称
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: number
    name?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number
    username: string
    nickname?: string | null
    picture?: string | null
    accessToken?: string
  }
}
