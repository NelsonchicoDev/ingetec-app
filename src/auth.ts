import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 1. Estrategia JWT
  session: { strategy: "jwt" },

  // 2. Claves y seguridad
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  // 3. Páginas
  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password || ""
          );
          if (!passwordsMatch) return null;

          return user;
        }

        return null;
      },
    }),
  ],

  // 4. Callbacks (Sin directivas de error, ya que TS lo acepta)
  // ... resto del código ...
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // 👇 SOLUCIÓN: Usamos 'as unknown as' para forzar el tipado
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // 👇 SOLUCIÓN: Aquí también aplicamos el doble cast
        (session.user as unknown as { role: string }).role =
          token.role as string;
      }
      return session;
    },
  },
});
