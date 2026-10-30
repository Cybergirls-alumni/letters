import { TicketStatus, TICKET_STATUS_LABELS } from "@/types";

// Lazy-load Resend only if API key is configured
async function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const { Resend } = await import("resend");
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? "CyberGirls <noreply@cybersafefoundation.org>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "alumni@cybersafefoundation.org";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Escape user-supplied values before interpolating into email HTML
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendNewTicketNotification(ticket: {
  ticketRef: string;
  candidateName: string;
  candidateEmail: string;
  purpose: string;
  organizationName: string;
}) {
  const resend = await getResend();
  if (!resend) {
    console.log("[email] No RESEND_API_KEY — skipping admin notification for", ticket.ticketRef);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[CyberGirls] New recommendation letter request — ${ticket.ticketRef}`,
    html: `
      <h2>New Recommendation Letter Request</h2>
      <p><strong>Ticket:</strong> ${ticket.ticketRef}</p>
      <p><strong>Name:</strong> ${esc(ticket.candidateName)}</p>
      <p><strong>Email:</strong> ${esc(ticket.candidateEmail)}</p>
      <p><strong>Purpose:</strong> ${esc(ticket.purpose)}</p>
      <p><strong>Organisation:</strong> ${esc(ticket.organizationName)}</p>
      <p><a href="${APP_URL}/admin/tickets/${ticket.ticketRef}">View in Dashboard →</a></p>
    `,
  });
}

export async function sendSubmissionConfirmation(ticket: {
  ticketRef: string;
  candidateName: string;
  candidateEmail: string;
}) {
  const resend = await getResend();
  if (!resend) {
    console.log("[email] No RESEND_API_KEY — skipping confirmation for", ticket.ticketRef);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: ticket.candidateEmail,
    subject: `Your recommendation letter request has been received — ${ticket.ticketRef}`,
    html: `
      <h2>Request Received!</h2>
      <p>Hi ${esc(ticket.candidateName)},</p>
      <p>We've received your recommendation letter request. Your ticket reference is:</p>
      <h3 style="font-size:24px;color:#1d4ed8;">${ticket.ticketRef}</h3>
      <p>You can use your admission number and this email address to track the status of your request at any time:</p>
      <p><a href="${APP_URL}/status">Check Status →</a></p>
      <p>Please note that we require at least <strong>two weeks' notice</strong> to process recommendation letter requests.</p>
      <p>The CyberSafe Foundation Team</p>
    `,
  });
}

export async function sendStatusUpdateNotification(ticket: {
  ticketRef: string;
  candidateName: string;
  candidateEmail: string;
  newStatus: TicketStatus;
  rejectionReason?: string | null;
}) {
  const resend = await getResend();
  if (!resend) {
    console.log("[email] No RESEND_API_KEY — skipping status update for", ticket.ticketRef);
    return;
  }
  const statusLabel = TICKET_STATUS_LABELS[ticket.newStatus];
  await resend.emails.send({
    from: FROM,
    to: ticket.candidateEmail,
    subject: `Update on your recommendation letter request — ${ticket.ticketRef}`,
    html: `
      <h2>Request Status Update</h2>
      <p>Hi ${esc(ticket.candidateName)},</p>
      <p>Your recommendation letter request <strong>${ticket.ticketRef}</strong> has been updated.</p>
      <p><strong>New Status:</strong> ${statusLabel}</p>
      ${ticket.rejectionReason ? `<p><strong>Reason:</strong> ${esc(ticket.rejectionReason)}</p>` : ""}
      <p><a href="${APP_URL}/status">Check your full status →</a></p>
      <p>The CyberSafe Foundation Team</p>
    `,
  });
}

export async function sendAssigneeStatusUpdateNotification(
  assignee: { name: string; email: string },
  ticket: { ticketRef: string; newStatus: TicketStatus }
) {
  const resend = await getResend();
  if (!resend) return;
  const statusLabel = TICKET_STATUS_LABELS[ticket.newStatus];
  await resend.emails.send({
    from: FROM,
    to: assignee.email,
    subject: `Ticket ${ticket.ticketRef} status updated — ${statusLabel}`,
    html: `
      <h2>Ticket Status Update</h2>
      <p>Hi ${esc(assignee.name)},</p>
      <p>Ticket <strong>${ticket.ticketRef}</strong>, which is assigned to you, has been updated to <strong>${statusLabel}</strong>.</p>
      <p><a href="${APP_URL}/admin/tickets/${ticket.ticketRef}">View Ticket →</a></p>
    `,
  });
}

export async function sendAssignmentNotification(assignee: {
  name: string;
  email: string;
}, ticket: {
  ticketRef: string;
  candidateName: string;
}) {
  const resend = await getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: assignee.email,
    subject: `Ticket assigned to you — ${ticket.ticketRef}`,
    html: `
      <h2>You've been assigned a ticket</h2>
      <p>Hi ${esc(assignee.name)},</p>
      <p>Ticket <strong>${ticket.ticketRef}</strong> for <strong>${esc(ticket.candidateName)}</strong> has been assigned to you.</p>
      <p><a href="${APP_URL}/admin/tickets/${ticket.ticketRef}">View Ticket →</a></p>
    `,
  });
}
