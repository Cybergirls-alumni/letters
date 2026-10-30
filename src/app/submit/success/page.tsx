import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Request Received!</h1>
        <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm">
          Your recommendation letter request has been submitted. The team will review
          it and you&apos;ll receive updates via email.
        </p>

        {ref && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-1">
              Your Ticket Reference
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">{ref}</p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Save this — you&apos;ll need it to track your request</p>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
          Use this ticket reference (or your <strong>CyberGirls admission number</strong>) with
          the email you submitted to check the status of your request at any time.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/status"
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm transition-colors text-center"
          >
            Track My Request
          </Link>
          <Link
            href="/"
            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-sm transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
