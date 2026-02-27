"use client";

import { useState } from "react";

export function RequestStatusEditor({
  requestId,
  auditId,
  initialStatus,
}: {
  requestId: string;
  auditId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700"
      >
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Submitted to Auditor">Submitted to Auditor</option>
        <option value="Needs Revision">Needs Revision</option>
        <option value="Closed">Closed</option>
      </select>
      <button
        type="button"
        className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          setMessage(null);
          const res = await fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auditId, status }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            setMessage(data?.error ?? "Failed to update request status.");
            setSaving(false);
            return;
          }
          setMessage("Updated.");
          setSaving(false);
        }}
      >
        {saving ? "Saving..." : "Update"}
      </button>
      {message ? <span className="text-xs text-gray-600">{message}</span> : null}
    </div>
  );
}
