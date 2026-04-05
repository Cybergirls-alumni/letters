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

## Local Development

### Prerequisites

- [Bun](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+

### Setup

```bash
# Clone and install dependencies
git clone https://github.com/Cybergirls-alumni/letters.git
cd letters
bun install

# Copy environment variables
cp .env.example .env
```

Edit `.env` — the defaults work for local development as-is. See [Environment Variables](#environment-variables) below for what each one does.

```bash
# Push the schema to your local SQLite database
bun run prisma db push

# Create the first admin user
bun run db:seed

# Start the dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

Log into the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin) with:
- **Email:** `admin@cybersafefoundation.org`
- **Password:** `cybergirls2024!`

Change the password after first login.

---

## Environment Variables

```bash
# ── Database ───────────────────────────────────────────────────────────────────
# Local SQLite (development default):
DATABASE_URL="file:./dev.db"

# Turso (production — see Deployment section):
# DATABASE_URL="libsql://your-db-name.turso.io"
# DATABASE_AUTH_TOKEN="your-turso-auth-token"

# ── Auth ───────────────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"

# Set to your production URL when deploying
NEXTAUTH_URL="http://localhost:3000"

# ── Email (Resend) ─────────────────────────────────────────────────────────────
# Optional. If not set, email notifications are silently skipped.
RESEND_API_KEY=""
EMAIL_FROM="CyberGirls <noreply@cybersafefoundation.org>"
ADMIN_NOTIFICATION_EMAIL="alumni@cybersafefoundation.org"

# ── App ────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── Seed ───────────────────────────────────────────────────────────────────────
# Credentials for the initial admin user created by `bun run db:seed`
SEED_ADMIN_EMAIL="admin@cybersafefoundation.org"
SEED_ADMIN_PASSWORD="change-me-after-first-login!"
SEED_ADMIN_NAME="CyberGirls Admin"
```

`BLOB_READ_WRITE_TOKEN` is set automatically by Vercel when you enable Blob storage on the project. You don't need to set it manually.

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

## Database

### Local development

The app uses a local SQLite file (`dev.db`) out of the box. No setup needed.

### Production

SQLite files can't be used on serverless platforms (like Vercel) because the filesystem is ephemeral. The app is pre-configured to use **Turso**, a hosted libsql service, with no code changes required — just different environment variables.

**Setting up Turso:**

```bash
# Install the Turso CLI
brew install tursodatabase/tap/turso

turso auth login
turso db create cybergirls-letters

# Get your database URL
turso db show cybergirls-letters

# Generate an auth token
turso db tokens create cybergirls-letters
```

Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in your `.env` (or Vercel environment variables), then:

```bash
# Push the schema to Turso
bun run prisma db push

# Seed the initial admin user
bun run db:seed
```

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Enable **Vercel Blob** storage under Storage → Create → Blob (this sets `BLOB_READ_WRITE_TOKEN` automatically)
4. Add all environment variables under Settings → Environment Variables (see [Environment Variables](#environment-variables))
5. Deploy

The app will be live at your `*.vercel.app` URL. To connect a custom domain, go to Settings → Domains and add it. Vercel will give you the exact DNS record to add.

---

## Available Scripts

```bash
bun dev              # Start development server
bun run build        # Production build
bun run lint         # Run ESLint

bun run db:migrate   # Run Prisma migrations (development)
bun run db:seed      # Create the initial admin user
bun run db:studio    # Open Prisma Studio (database GUI)
```

---

## Data Model

**`Ticket`** — a recommendation letter request. Holds all candidate information, request details, current status, and file references.

**`AdminUser`** — a member of the CyberSafe team who can log in, be assigned tickets, and take actions.

**`StatusHistory`** — an immutable log of every status change on a ticket. Records who changed it and when. Cannot be modified or deleted.

**`Note`** — an internal note on a ticket. Visible only to admins, never to the requesting alumna.

---

## Contributing

This project is maintained by the CyberSafe Foundation alumni team. If you are a team member and need access, contact the current alumni coordinator.
