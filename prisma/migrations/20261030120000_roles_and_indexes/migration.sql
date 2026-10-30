-- Admin roles: OWNER can manage the team, ADMIN cannot. The earliest-created admin becomes OWNER.
ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'ADMIN';
UPDATE "AdminUser" SET "role" = 'OWNER'
  WHERE "id" = (SELECT "id" FROM "AdminUser" ORDER BY "createdAt" ASC LIMIT 1);

-- Indexes for the status lookup, dashboard filters and sorting
CREATE INDEX "Ticket_admissionNumber_idx" ON "Ticket"("admissionNumber");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_assignedAdminId_idx" ON "Ticket"("assignedAdminId");
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");
