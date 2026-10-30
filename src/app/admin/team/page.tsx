import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import AddTeamMemberForm from "./AddTeamMemberForm";
import TeamMemberActions from "./TeamMemberActions";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const isOwner = session.user.role === "OWNER";

  const members = await prisma.adminUser.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Team Members</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Existing members */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Current Members</h2>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 p-5">No team members yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {members.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{m.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{m.email}</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 shrink-0 ml-3">
                      Since {formatDate(m.createdAt)}
                    </p>
                  </div>
                  {isOwner && (
                    <TeamMemberActions member={{ id: m.id, name: m.name, email: m.email }} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add member — owners only */}
        {isOwner && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Add Team Member</h2>
            <AddTeamMemberForm />
          </div>
        )}
      </div>
    </div>
  );
}
