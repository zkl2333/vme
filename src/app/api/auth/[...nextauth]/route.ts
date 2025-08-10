import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { NextAuthOptions } from 'next-auth'

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
    async jwt({ token, user, profile }) {
      if (user && profile) {
        token.id = Number(user.id)
        token.username = (profile as any).login  // GitHub 登录名
        token.image = user.image
      }
      // 保存access token到JWT中（只在服务器端可用）
      if (profile) {
        token.accessToken = (profile as any).access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as number
        session.user.username = token.username as string
        session.user.image = token.image as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
