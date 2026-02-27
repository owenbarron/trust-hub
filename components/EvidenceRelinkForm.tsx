"use client";

import { useState } from "react";

export function EvidenceRelinkForm({
  evidenceId,
  auditId,
  disabled,
}: {
  evidenceId: number;
  auditId: string;
  disabled: boolean;
}) {
  const [controlId, setControlId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={controlId}
        onChange={(event) => setControlId(event.target.value.toUpperCase())}
        placeholder="CTL-000"
        className="w-24 rounded border border-gray-300 px-2 py-1 text-xs"
        disabled={disabled || saving}
      />
      <button
        type="button"
        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || saving || !controlId}
        onClick={async () => {
          setSaving(true);
          setMessage(null);

          const res = await fetch("/api/evidence/relink-control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auditId, controlId, evidenceId }),
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            setMessage(data?.error ?? "Link failed.");
            setSaving(false);
            return;
          }

          setMessage("Linked.");
          setControlId("");
          setSaving(false);
        }}
      >
        Link to control
      </button>
      {message ? <span className="text-[11px] text-gray-600">{message}</span> : null}
    </div>
  );
}
