import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">My Account</h1>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{session.user.email}</p>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
