"use client";

import { useState } from "react";
import Link from "next/link";
import { BASE_PATH } from "@/lib/utils";
import {
  TicketStatus,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
} from "@/types";
import { formatDate } from "@/lib/utils";

interface TicketSummary {
  ticketRef: string;
  status: string;
  createdAt: string;
  submissionDeadline: string | null;
  rejectionReason: string | null;
}

export default function StatusPage() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!admissionNumber.trim()) return;
    setLoading(true);
    setError(null);
    setTickets(null);

    const res = await fetch(
      `${BASE_PATH}/api/status?admissionNumber=${encodeURIComponent(admissionNumber.trim())}`
    );
    const data = await res.json();

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
    } else {
      setTickets(data.tickets);
    }
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-sm">
            ← Back
          </Link>
          <Link href="/submit" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium">
            Submit a request
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Track Your Request</h1>
        <p className="text-gray-600 dark:text-slate-400 text-sm mb-8">
          Enter your CyberGirls admission number to see the status of your recommendation letter requests.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            placeholder="e.g. CG/xx/xxxx"
            className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !admissionNumber.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {searched && tickets !== null && tickets.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-500 dark:text-slate-400 font-medium mb-1">No requests found</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm">
              No recommendation letter requests found for this admission number.
            </p>
            <Link
              href="/submit"
              className="inline-block mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Submit a new request →
            </Link>
          </div>
        )}

        {tickets && tickets.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketRef}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {ticket.ticketRef}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Submitted {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      TICKET_STATUS_COLORS[ticket.status as TicketStatus] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {TICKET_STATUS_LABELS[ticket.status as TicketStatus] ?? ticket.status}
                  </span>
                </div>

                {ticket.submissionDeadline && (
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    <span className="text-gray-500 dark:text-slate-400">Deadline: </span>
                    {formatDate(ticket.submissionDeadline)}
                  </p>
                )}

                {ticket.status === "REJECTED" && ticket.rejectionReason && (
                  <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Rejection reason</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{ticket.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
