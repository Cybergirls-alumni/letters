import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

const TICKET_REF = /^CG-\d{4}-[A-Z0-9]{5}$/i;

const lookupSchema = z.object({
  // Either the ticket reference from the confirmation (CG-2026-XXXXX) or the CyberGirls admission number
  reference: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(254),
});

// POST (not GET) so the email never lands in URLs or access logs
export async function POST(req: NextRequest) {
  // Admission numbers follow a guessable CG/YY/NNNN pattern — slow down enumeration
  const limited = rateLimit(req, "status", 30, 10 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(req);
  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ticket reference or admission number, and email, are required" },
      { status: 400 }
    );
  }

  const candidates = await prisma.ticket.findMany({
    where: TICKET_REF.test(parsed.data.reference)
      ? { ticketRef: parsed.data.reference.toUpperCase() }
      : { admissionNumber: parsed.data.reference },
    orderBy: { createdAt: "desc" },
    select: {
      ticketRef: true,
      status: true,
      createdAt: true,
      submissionDeadline: true,
      rejectionReason: true,
      candidateEmail: true,
    },
  });

  // Both must match; a wrong email looks identical to "no requests found".
  // Compared in JS because SQLite's = is case-sensitive and Prisma has no insensitive mode here.
  const email = parsed.data.email.toLowerCase();
  const tickets = candidates
    .filter((t) => t.candidateEmail.toLowerCase() === email)
    .map((t) => ({
      ticketRef: t.ticketRef,
      status: t.status,
      createdAt: t.createdAt,
      submissionDeadline: t.submissionDeadline,
      rejectionReason: t.rejectionReason,
    }));

  return NextResponse.json({ tickets });
}
