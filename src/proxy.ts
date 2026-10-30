import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Auth gate for /admin and /api/admin. Uses authConfig only (no Prisma): the DB-backed check lives in auth()
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
