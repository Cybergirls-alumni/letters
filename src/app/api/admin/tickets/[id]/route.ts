import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";
import {
  sendStatusUpdateNotification,
  sendAssigneeStatusUpdateNotification,
  sendAssignmentNotification,
} from "@/lib/email";
import { TicketStatus } from "@/types";

const patchSchema = z.object({
  status: z
    .enum([
      "SUBMITTED",
      "VERIFYING",
      "VERIFIED",
      "EDITING",
      "SENT_TO_CYBERSAFE",
      "SIGNED_RETURNED",
      "DELIVERED",
      "REJECTED",
    ])
    .optional(),
  assignedAdminId: z.string().nullable().optional(),
  rejectionReason: z.string().max(1000, "Reason must be under 1000 characters").optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id }, { ticketRef: id }] },
    include: {
      assignedAdmin: { select: { id: true, name: true, email: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { name: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const [existing, newAssignee] = await Promise.all([
    prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketRef: id }] },
      include: { assignedAdmin: { select: { name: true, email: true } } },
    }),
    parsed.data.assignedAdminId
      ? prisma.adminUser.findUnique({ where: { id: parsed.data.assignedAdminId } })
      : null,
  ]);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (parsed.data.assignedAdminId && !newAssignee) {
    return NextResponse.json({ error: "Assignee not found" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.assignedAdminId !== undefined)
    update.assignedAdminId = parsed.data.assignedAdminId;
  if (parsed.data.rejectionReason !== undefined)
    update.rejectionReason = parsed.data.rejectionReason;

  const adminId = session.user.id as string;

  let ticket;
  try {
    // Run update + optional status history in a single transaction
    await prisma.$transaction(async (tx) => {
      ticket = await tx.ticket.update({
        where: { id: existing.id },
        data: update,
        include: { assignedAdmin: { select: { name: true, email: true } } },
      });
      if (parsed.data.status && parsed.data.status !== existing.status) {
        await tx.statusHistory.create({
          data: {
            fromStatus: existing.status,
            toStatus: parsed.data.status,
            changedById: adminId,
            ticketId: existing.id,
          },
        });
      }
    });
  } catch (err) {
    console.error("[PATCH /api/admin/tickets/[id]]", err);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }

  // Send status update email
  if (parsed.data.status && parsed.data.status !== existing.status) {
    sendStatusUpdateNotification({
      ticketRef: existing.ticketRef,
      candidateName: existing.candidateName,
      candidateEmail: existing.candidateEmail,
      newStatus: parsed.data.status as TicketStatus,
      rejectionReason: parsed.data.rejectionReason,
    }).catch(console.error);
  }

  // Notify assignee if status changed and ticket has an assignee
  if (parsed.data.status && parsed.data.status !== existing.status && existing.assignedAdmin) {
    sendAssigneeStatusUpdateNotification(
      { name: existing.assignedAdmin.name, email: existing.assignedAdmin.email },
      { ticketRef: existing.ticketRef, newStatus: parsed.data.status as TicketStatus }
    ).catch(console.error);
  }

  // Send assignment email if newly assigned
  if (
    parsed.data.assignedAdminId &&
    parsed.data.assignedAdminId !== existing.assignedAdminId
  ) {
    if (newAssignee) {
      sendAssignmentNotification(
        { name: newAssignee.name, email: newAssignee.email },
        { ticketRef: existing.ticketRef, candidateName: existing.candidateName }
      ).catch(console.error);
    }
  }

  return NextResponse.json({ ticket });
}
