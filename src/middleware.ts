import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use only authConfig (no Prisma) for Edge-compatible middleware
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
