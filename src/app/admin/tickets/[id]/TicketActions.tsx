"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TicketStatus,
  TICKET_STATUS_LABELS,
} from "@/types";
import { formatDateTime, BASE_PATH } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
}

interface Note {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
}

interface Props {
  ticketId: string;
  currentStatus: TicketStatus;
  currentAssigneeId: string | null;
  teamMembers: TeamMember[];
  notes: Note[];
}

const VALID_STATUSES: TicketStatus[] = [
  "SUBMITTED",
  "VERIFYING",
  "VERIFIED",
  "EDITING",
  "SENT_TO_CYBERSAFE",
  "SIGNED_RETURNED",
  "DELIVERED",
  "REJECTED",
];

export default function TicketActions({
  ticketId,
  currentStatus,
  currentAssigneeId,
  teamMembers,
  notes: initialNotes,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(currentStatus);
  const [assigneeId, setAssigneeId] = useState<string>(currentAssigneeId ?? "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  async function saveChanges() {
    if (status === "REJECTED" && !rejectionReason.trim()) {
      setSaveMsg("Please provide a rejection reason.");
      return;
    }
    setSaving(true);
    setSaveMsg(null);

    const body: Record<string, unknown> = { status };
    if (assigneeId) body.assignedAdminId = assigneeId;
    else body.assignedAdminId = null;
    if (status === "REJECTED") body.rejectionReason = rejectionReason;

    const res = await fetch(`${BASE_PATH}/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSaveMsg("Saved!");
      router.refresh();
    } else {
      setSaveMsg("Error saving. Please try again.");
    }
    setSaving(false);
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    setAddingNote(true);

    const res = await fetch(`${BASE_PATH}/api/admin/tickets/${ticketId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });

    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [
        { id: note.id, body: note.body, authorName: note.author.name, createdAt: note.createdAt },
        ...prev,
      ]);
      setNoteBody("");
    }
    setAddingNote(false);
  }

  return (
    <>
      {/* Status & Assignment */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100">Update Ticket</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VALID_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {status === "REJECTED" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Why is this request being rejected?"
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            Assigned To
          </label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={saveChanges}
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {saveMsg && (
          <p
            className={`text-xs text-center ${
              saveMsg === "Saved!" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {saveMsg}
          </p>
        )}
      </div>

      {/* Internal Notes */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100">Internal Notes</h2>

        <div className="space-y-2">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            placeholder="Add an internal note visible only to the admin team..."
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={addNote}
            disabled={addingNote || !noteBody.trim()}
            className="w-full py-2 bg-gray-800 dark:bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-gray-900 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors"
          >
            {addingNote ? "Adding..." : "Add Note"}
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">No notes yet.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-3 border border-gray-100 dark:border-slate-700"
              >
                <p className="text-sm text-gray-900 dark:text-slate-200 whitespace-pre-wrap">{note.body}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  {note.authorName} · {formatDateTime(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
