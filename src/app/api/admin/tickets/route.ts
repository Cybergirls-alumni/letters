import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1") || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assignedAdmin: { select: { name: true } },
      },
    }),
    prisma.ticket.count(),
  ]);

  return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) });
}
