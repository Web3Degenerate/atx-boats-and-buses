import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const result = await query(
        "SELECT email FROM admin_users WHERE LOWER(email) = LOWER($1) AND active = TRUE",
        [user.email]
      );

      return result.rows.length > 0;
    },
    async session({ session }) {
      return session;
    }
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login"
  }
};
