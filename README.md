# CyberGirls Letters

A recommendation letter request tracker for [CyberSafe Foundation](https://cybersafefoundation.org) CyberGirls alumni.

---

## The Problem

CyberGirls alumni regularly need recommendation letters for school applications, job opportunities, and other pursuits. Before this tool existed, requests came in through email — and email is a terrible ticketing system. Requests got lost, went unacknowledged, sat in inboxes without an owner, and alumni were left in the dark about where their letter stood.

This app gives the process a backbone. Alumni submit a structured request with all the information the team needs. Every request becomes a ticket with a unique reference number, a clear status, and an assigned team member. Alumni can check their status at any time without having to chase anyone down.

---

## What It Does

### For alumni

- Submit a recommendation letter request with their CyberGirls admission number, purpose, organisation name, submission deadline, and an optional drafted letter
- Receive an email confirmation with their ticket reference number immediately after submitting
- Track their request status at any time using their admission number — no account needed

### For the admin team

- See all incoming requests in a shared dashboard with status filters and assignee filters
- Assign tickets to specific team members
- Move tickets through a clear workflow: Submitted → Under Review → Verified → Being Edited → Sent to CyberSafe → Signed & Returned → Delivered
- Reject requests with a written reason (visible to the alumni)
- Add internal notes to tickets — not visible to alumni, just for team coordination
- Receive email notifications for new submissions; team members get notified when a ticket is assigned to them or its status changes

---

## Ticket Lifecycle

```
SUBMITTED → VERIFYING → VERIFIED → EDITING → SENT_TO_CYBERSAFE → SIGNED_RETURNED → DELIVERED
                                                                                  ↘ REJECTED (at any stage)
```

Each status transition is logged with a timestamp and the name of the admin who made the change.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via [libsql](https://github.com/tursodatabase/libsql) (local) / [Turso](https://turso.tech) (production) |
| ORM | Prisma 7 with `@prisma/adapter-libsql` |
| Auth | NextAuth v5 (credentials — admin only) |
| Email | [Resend](https://resend.com) |
| File uploads | [Vercel Blob](https://vercel.com/storage/blob) |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Runtime | Bun |

---

## Project Structure

```
src/
  app/
    page.tsx               ← Public landing page
    submit/                ← Alumni request submission form
    status/                ← Alumni status tracker
    admin/
      page.tsx             ← Ticket dashboard (auth-gated)
      tickets/[id]/        ← Ticket detail view
      team/                ← Team member management
    api/
      tickets/             ← POST: create a new ticket
      status/              ← GET: look up tickets by admission number
      upload/              ← POST: upload a drafted letter
      admin/
        tickets/[id]/      ← PATCH: update status, assignee, rejection reason
        team/              ← Admin team management endpoints
  lib/
    auth.ts                ← NextAuth configuration
    email.ts               ← All transactional email functions
    prisma.ts              ← Prisma client (handles both local + Turso)
    utils.ts               ← Shared helpers (dates, ticket ref generation)
  types/
    index.ts               ← Ticket status/purpose enums and labels
  generated/
    prisma/                ← Generated Prisma client (do not edit)
prisma/
  schema.prisma            ← Database schema
  seed.ts                  ← Creates the initial admin user
```

---

## Data Model

**`Ticket`** — a recommendation letter request. Holds all candidate information, request details, current status, and file references.

**`AdminUser`** — a member of the CyberSafe team who can log in, be assigned tickets, and take actions.

**`StatusHistory`** — an immutable log of every status change on a ticket. Records who changed it and when. Cannot be modified or deleted.

**`Note`** — an internal note on a ticket. Visible only to admins, never to the requesting alumna.

---

## Contributing

This project is maintained by the CyberSafe Foundation alumni team. If you are a team member and need access, contact the current alumni president.
