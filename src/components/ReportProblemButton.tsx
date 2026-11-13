"use client";

import { REPORT_EMAIL } from "@/lib/utils";

const SUBJECT = "CyberGirls Letters: problem report";

function buildHref(pageUrl: string) {
  const body = [
    "What happened:",
    "",
    "",
    "What you expected:",
    "",
    "",
    `Page: ${pageUrl}`,
    "Ticket reference (if you have one):",
    "",
    "Please do not include passwords.",
  ].join("\n");
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
}

// Fixed in the corner of every page. The current page address is added to the email at click time
// (a static href keeps server and client renders identical and works if the click handler never runs).
export default function ReportProblemButton() {
  return (
    <a
      href={buildHref("(please paste the page address)")}
      onClick={(e) => {
        e.currentTarget.href = buildHref(window.location.href);
      }}
      className="fixed bottom-4 right-4 z-40 print:hidden rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      Report a problem
    </a>
  );
}
