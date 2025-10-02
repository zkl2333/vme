import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email public_repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        token.id = Number(user.id)
        token.username = (profile as any).login  // GitHub 登录名
        token.picture = user.image
      }
      // 保存access token到JWT中（只在服务器端可用）
      if (account) {
        token.accessToken = (account as any).access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as number
        session.user.username = token.username
        session.user.image = token.picture
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
