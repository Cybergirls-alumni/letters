import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

const lookupSchema = z.object({
  admissionNumber: z.string().trim().min(1).max(30),
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
      { error: "Admission number and email are required" },
      { status: 400 }
    );
  }

  const candidates = await prisma.ticket.findMany({
    where: { admissionNumber: parsed.data.admissionNumber },
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
