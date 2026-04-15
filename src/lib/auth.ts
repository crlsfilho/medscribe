import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Senha incorreta");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours - auto logout
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.email = user.email;
      }

      // Check for impersonation cookie if current user is the super admin
      if (token.email === "carlos@worldpackers.com") {
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const impersonateId = cookieStore.get("impersonate_user_id")?.value;

          if (impersonateId) {
            // Lazy load prisma to avoid circular dependencies if any
            const { prisma } = await import("./prisma");
            const targetUser = await prisma.user.findUnique({
              where: { id: impersonateId },
            });

            if (targetUser) {
              token.id = targetUser.id;
              token.isAdmin = targetUser.isAdmin;
              token.impersonatedFromEmail = "carlos@worldpackers.com";
              // We don't change token.email here because we need it to identify the super-admin in subsequent calls
              // But we can add a token.displayEmail or just use token.id for DB queries
            }
          }
        } catch (error) {
          // cookies() might not be available in some contexts (e.g. build time)
          console.error("Error reading impersonation cookie:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.impersonatedFromEmail = token.impersonatedFromEmail as string;
        
        // If impersonating, we might want to fetch the target user's email/name for the UI
        if (token.impersonatedFromEmail && token.id) {
           const { prisma } = await import("./prisma");
           const targetUser = await prisma.user.findUnique({ where: { id: token.id } });
           if (targetUser) {
             session.user.email = targetUser.email;
             session.user.name = targetUser.name;
           }
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
