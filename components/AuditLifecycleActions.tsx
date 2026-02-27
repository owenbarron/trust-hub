"use client";

import { useState } from "react";
import { Audit } from "@/lib/types";

export function AuditLifecycleActions({ activeAudit }: { activeAudit: Audit | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const closeActiveAudit = async () => {
    if (!activeAudit) return;
    if (!window.confirm(`Close ${activeAudit.name}? This makes it read-only.`)) {
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/audits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId: activeAudit.id }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Failed to close audit.");
      setSaving(false);
      return;
    }

    setMessage("Audit closed. Refresh to see updated lifecycle state.");
    setSaving(false);
  };

  const startNewAudit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      id: String(form.get("id") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      periodStart: String(form.get("periodStart") ?? "") || null,
      periodEnd: String(form.get("periodEnd") ?? "") || null,
      auditorFirm: String(form.get("auditorFirm") ?? "") || null,
    };

    const res = await fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Failed to start new audit.");
      setSaving(false);
      return;
    }

    setMessage("New active audit started. Refresh to load it in the switcher.");
    (event.currentTarget as HTMLFormElement).reset();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Close Active Audit</h3>
        <p className="mt-1 text-sm text-gray-600">
          Closing an audit enables historical read-only review and prevents further mutation.
        </p>
        <button
          type="button"
          disabled={!activeAudit || saving}
          onClick={closeActiveAudit}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Close audit
        </button>
      </div>

      <form className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-3" onSubmit={startNewAudit}>
        <h3 className="text-lg font-semibold text-gray-900">Start New Audit</h3>
        <p className="text-sm text-gray-600">
          This clones control snapshots from the latest closed audit into a new active audit.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Audit ID
            <input
              name="id"
              required
              placeholder="2027-soc2-type2"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-gray-700">
            Audit Name
            <input
              name="name"
              required
              placeholder="2027 SOC 2 Type II"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-gray-700">
            Period Start
            <input name="periodStart" type="date" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-gray-700">
            Period End
            <input name="periodEnd" type="date" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-gray-700 md:col-span-2">
            Auditor Firm
            <input
              name="auditorFirm"
              placeholder="BARR Advisory"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
          type="submit"
          disabled={saving || Boolean(activeAudit)}
        >
          Start audit
        </button>
        {activeAudit ? (
          <p className="text-xs text-amber-700">Close the current active audit before starting a new one.</p>
        ) : null}
      </form>

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </div>
  );
}
