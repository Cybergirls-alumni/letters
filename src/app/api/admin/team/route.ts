import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";
import bcrypt from "bcryptjs";

const addMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await prisma.adminUser.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only an owner can add team members" }, { status: 403 });
  }

  const body = await readJson(req);
  if (body === undefined) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json({ error: "A team member with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const member = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json({ member }, { status: 201 });
}
