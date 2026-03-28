import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateTicketRef } from "@/lib/utils";
import {
  sendNewTicketNotification,
  sendSubmissionConfirmation,
} from "@/lib/email";

const submitSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  candidateName: z.string().min(1, "Full name is required"),
  candidateEmail: z.string().email("Valid email is required"),
  phoneNumber: z.string().optional(),
  purpose: z.enum(["SCHOOL_ADMISSION", "JOB_APPLICATION", "OTHER"]),
  organizationName: z.string().min(1, "Organisation name is required"),
  submissionDeadline: z.string().optional(),
  additionalInfo: z.string().optional(),
  // Accept local upload paths or Vercel Blob URLs
  letterFileUrl: z.union([
    z.string().startsWith("/uploads/"),
    z.string().url(),
  ]).optional(),
  orgFormUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
