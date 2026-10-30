"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginResult = { ok: true } | { ok: false; reason: "invalid" | "locked" | "error" };

// Signing in on the server avoids next-auth/react, whose client calls ignore the /letters base path
export async function login(email: string, password: string): Promise<LoginResult> {
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return { ok: false, reason: "invalid" };
  }
  try {
    await signIn("credentials", { email: email.trim(), password, redirect: false });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, reason: err instanceof CredentialsSignin && err.code === "rate_limited" ? "locked" : "invalid" };
    }
    console.error("[login] unexpected error", err);
    return { ok: false, reason: "error" };
  }
}
