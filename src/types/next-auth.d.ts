import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    pwv?: string; // password version fingerprint, see auth.ts
  }
}
