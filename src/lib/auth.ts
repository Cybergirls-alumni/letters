import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { authConfig } from "@/lib/auth.config";
import { clientIp, hitLimit } from "@/lib/rate-limit";

// Surfaced to the login form so a locked-out user isn't told their (possibly correct) password is wrong
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Hash of a random string — compared against when the email is unknown so response time doesn't reveal which emails exist
const DUMMY_HASH = "$2b$12$CPWlZgglD93OdkH1elclo.DSY4UvLT53QHUvtSvSq7NacvvcRpFMG";

// Short fingerprint of the stored password hash. Kept in the JWT so changing the password ends every older session.
const passwordVersion = (hash: string) => createHash("sha256").update(hash).digest("base64url").slice(0, 16);

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = (credentials.email as string).trim();

        if (
          hitLimit(`login-ip:${clientIp(request.headers)}`, 20, LOGIN_WINDOW_MS) ||
          hitLimit(`login-email:${email.toLowerCase()}`, 10, LOGIN_WINDOW_MS)
        ) {
          throw new RateLimitedError();
        }

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        const valid = await bcrypt.compare(
          credentials.password as string,
          admin?.passwordHash ?? DUMMY_HASH
        );
        if (!admin || !valid) return null;
        return { id: admin.id, email: admin.email, name: admin.name, pwv: passwordVersion(admin.passwordHash) };
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

/**
 * Session check that also confirms the admin still exists, so a removed admin's
 * unexpired JWT stops working, and attaches their current role. A session minted
 * before the last password change is rejected too.
 */
export async function auth() {
  const session = await nextAuth.auth();
  if (!session?.user?.id) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { role: true, passwordHash: true },
  });
  if (!admin || session.user.pwv !== passwordVersion(admin.passwordHash)) return null;

  session.user.role = admin.role;
  return session;
}
