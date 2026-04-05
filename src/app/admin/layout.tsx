import { auth } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only show nav on authenticated pages (login page handled separately)
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">CG</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">CyberGirls Admin</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Tickets
              </Link>
              <Link
                href="/admin/team"
                className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Team
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 dark:text-slate-400">{session.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/admin/login` });
              }}
            >
              <button
                type="submit"
                className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
