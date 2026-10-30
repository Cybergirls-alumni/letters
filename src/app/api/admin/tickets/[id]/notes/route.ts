import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";

const noteSchema = z.object({
  body: z.string().min(1, "Note body is required").max(5000, "Note is too long"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await readJson(req);
  if (body === undefined) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id }, { ticketRef: id }] },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const adminId = session.user.id as string;
  const note = await prisma.note.create({
    data: {
      body: parsed.data.body,
      authorId: adminId,
      ticketId: ticket.id,
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({ note }, { status: 201 });
}
