"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_PATH } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function TeamMemberActions({ member }: { member: Member }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`${BASE_PATH}/api/admin/team/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to update.");
    } else {
      setMode("view");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const res = await fetch(`${BASE_PATH}/api/admin/team/${member.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to remove.");
      setMode("view");
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  if (mode === "edit") {
    return (
      <form onSubmit={handleEdit} className="flex flex-col gap-2 w-full mt-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("view"); setError(null); }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <p className="text-xs text-red-700 dark:text-red-400">
          Remove <strong>{member.name}</strong>? This cannot be undone.
        </p>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Removing..." : "Confirm Remove"}
          </button>
          <button
            onClick={() => { setMode("view"); setError(null); }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={() => setMode("edit")}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        Edit
      </button>
      <button
        onClick={() => setMode("confirm-delete")}
        className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
      >
        Remove
      </button>
    </div>
  );
}
