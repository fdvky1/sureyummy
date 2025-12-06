import NextAuth, { getServerSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { compare } from "bcrypt"

import prisma from "./prisma"
 
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            email: {},
            password: {}
        },
        async authorize(credentials) {
            const user = await prisma.user.findUnique({
                where: {
                    email: credentials!.email,
                }
              });
              if (user) {
                const isCorrect = await compare(credentials!.password, user.password);
                if (isCorrect) return {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email
                }
              }
              return null;
        }
    })
  ],
  session: {
        strategy: 'jwt',
        maxAge: 2 * 24 * 60 * 60
    },
    pages: {
        signIn: '/signin'
    },
    secret: process.env.NEXTAUTH_SECRET!,
    callbacks: {
        async jwt({ token, user }){
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.role = user.role;
                token.email = user.email;
            }
            return token;
        },
        async session({ token, session }){
            // const user = await prisma.user.findUnique({ where: { id: token.id }})
            session.user = {
                id: token!.id,
                role: token!.role,
                name: token!.name,
                email: token!.email
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            return "/dashboard";
        }
    }
}


export const getAuthSession = () => getServerSession(authOptions);