import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check email uniqueness if updating email
  if (parsed.data.email) {
    const conflict = await prisma.adminUser.findFirst({
      where: { email: parsed.data.email, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "A team member with that email already exists" },
        { status: 409 }
      );
    }
  }

  const member = await prisma.adminUser.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json({ member });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent deleting your own account
  if (session.user.id === id) {
    return NextResponse.json(
      { error: "You cannot remove your own account." },
      { status: 403 }
    );
  }

  // Check for existing status history or notes authored by this member
  const [historyCount, notesCount] = await Promise.all([
    prisma.statusHistory.count({ where: { changedById: id } }),
    prisma.note.count({ where: { authorId: id } }),
  ]);

  if (historyCount > 0 || notesCount > 0) {
    return NextResponse.json(
      { error: "Cannot remove — this member has existing activity history on tickets." },
      { status: 409 }
    );
  }

  // Unassign any tickets assigned to this member, then delete
  await prisma.ticket.updateMany({
    where: { assignedAdminId: id },
    data: { assignedAdminId: null },
  });

  await prisma.adminUser.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
