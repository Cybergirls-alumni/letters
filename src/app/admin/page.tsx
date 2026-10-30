import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TicketStatus,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PURPOSE_LABELS,
  TicketPurpose,
} from "@/types";
import { formatDate } from "@/lib/utils";
import AssigneeFilter from "./AssigneeFilter";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; assignee?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const { page: pageParam, status: statusFilter, assignee: assigneeFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (assigneeFilter === "unassigned") {
    where.assignedAdminId = null;
  } else if (assigneeFilter) {
    where.assignedAdminId = assigneeFilter;
  }

  const [tickets, total, statusCounts, teamMembers] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { assignedAdmin: { select: { name: true } } },
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ["status"], _count: true }),
    prisma.adminUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const pages = Math.ceil(total / limit);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (assigneeFilter) params.set("assignee", assigneeFilter);
    params.set("page", String(p));
    return `/admin?${params.toString()}`;
  }

  function buildStatusUrl(s?: string) {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (assigneeFilter) params.set("assignee", assigneeFilter);
    return `/admin?${params.toString()}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">All Requests</h1>
        <span className="text-sm text-gray-500 dark:text-slate-400">{total} total</span>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildStatusUrl()}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              !statusFilter
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            }`}
          >
            All ({total})
          </Link>
          {statusCounts.map(({ status, _count }) => (
            <Link
              key={status}
              href={buildStatusUrl(status)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              {TICKET_STATUS_LABELS[status as TicketStatus] ?? status} ({_count})
            </Link>
          ))}
        </div>

        {/* Assignee filter */}
        <div className="ml-auto">
          <AssigneeFilter members={teamMembers} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-slate-400">No tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Ticket</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Purpose</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Deadline</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tickets/${ticket.ticketRef}`}
                        className="font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                      >
                        {ticket.ticketRef}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-200">{ticket.candidateName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                      {TICKET_PURPOSE_LABELS[ticket.purpose as TicketPurpose] ?? ticket.purpose}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                      {ticket.submissionDeadline
                        ? formatDate(ticket.submissionDeadline)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          TICKET_STATUS_COLORS[ticket.status as TicketStatus] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {TICKET_STATUS_LABELS[ticket.status as TicketStatus] ?? ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                      {ticket.assignedAdmin?.name ?? <span className="text-gray-400 dark:text-slate-500">Unassigned</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500 dark:text-slate-400">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
