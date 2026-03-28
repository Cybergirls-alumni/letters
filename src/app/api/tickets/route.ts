import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateTicketRef } from "@/lib/utils";
import {
  sendNewTicketNotification,
  sendSubmissionConfirmation,
} from "@/lib/email";

const submitSchema = z.object({
  admissionNumber: z
    .string()
    .regex(/^CG\/\d{2}\/\d{4}$/, "Invalid admission number format"),
  candidateName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  candidateEmail: z
    .string()
    .email("Valid email is required"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-\(\)]{7,20}$/, "Invalid phone number")
    .optional(),
  purpose: z.enum(["SCHOOL_ADMISSION", "JOB_APPLICATION", "OTHER"]),
  organizationName: z
    .string()
    .min(2, "Organisation name is required")
    .max(200, "Organisation name is too long"),
  submissionDeadline: z
    .string()
    .refine(
      (v) => !v || new Date(v) >= new Date(new Date().toDateString()),
      "Deadline cannot be in the past"
    )
    .optional(),
  additionalInfo: z.string().max(2000, "Must be under 2000 characters").optional(),
  // Accept local upload paths or Vercel Blob URLs
  letterFileUrl: z.union([
    z.string().startsWith("/uploads/"),
    z.string().url(),
  ]).optional(),
  orgFormUrl: z.string().url("Must be a valid URL").optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    // generateTicketRef() uses a random suffix — no race condition
    const ticketRef = generateTicketRef();

    const ticket = await prisma.ticket.create({
      data: {
        ticketRef,
        admissionNumber: data.admissionNumber,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        phoneNumber: data.phoneNumber,
        purpose: data.purpose,
        organizationName: data.organizationName,
        submissionDeadline: data.submissionDeadline
          ? new Date(data.submissionDeadline)
          : null,
        additionalInfo: data.additionalInfo,
        letterFileUrl: data.letterFileUrl,
        orgFormUrl: data.orgFormUrl || null,
        status: "SUBMITTED",
      },
    });

    // Fire-and-forget notifications — don't fail the request if email fails
    sendNewTicketNotification({
      ticketRef: ticket.ticketRef,
      candidateName: ticket.candidateName,
      candidateEmail: ticket.candidateEmail,
      purpose: ticket.purpose,
      organizationName: ticket.organizationName,
    }).catch(console.error);

    sendSubmissionConfirmation({
      ticketRef: ticket.ticketRef,
      candidateName: ticket.candidateName,
      candidateEmail: ticket.candidateEmail,
    }).catch(console.error);

    return NextResponse.json({ ticketRef: ticket.ticketRef }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tickets]", err);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
