import "dotenv/config";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

function resolveDbUrl(rawUrl: string): string {
  if (rawUrl.startsWith("file:./") || rawUrl.startsWith("file:../")) {
    const rel = rawUrl.replace("file:", "");
    return `file:${path.resolve(process.cwd(), rel)}`;
  }
  return rawUrl;
}

async function main() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is not set — run from project root with .env");
  const url = resolveDbUrl(rawUrl);
  console.log("Connecting to:", url);

  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@cybersafefoundation.org";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD (min 12 characters) before seeding");
  }
  const name = process.env.SEED_ADMIN_NAME ?? "CyberGirls Admin";

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin user already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: { email, name, passwordHash, role: "OWNER" },
    });

    console.log(`✅ Created admin user:`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: (the SEED_ADMIN_PASSWORD you provided)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
