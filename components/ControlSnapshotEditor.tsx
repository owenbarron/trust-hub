"use client";

import { useState } from "react";

export function ControlSnapshotEditor({
  auditId,
  controlId,
  defaults,
}: {
  auditId: string;
  controlId: string;
  defaults: {
    implementation_status: string;
    testing_status: string;
    automation_status: string;
    owner: string | null;
    freshness_date: string | null;
    notes: string | null;
  };
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        const form = new FormData(event.currentTarget);
        const payload = {
          auditId,
          implementation_status: String(form.get("implementation_status") ?? ""),
          testing_status: String(form.get("testing_status") ?? ""),
          automation_status: String(form.get("automation_status") ?? ""),
          owner: String(form.get("owner") ?? "") || null,
          freshness_date: String(form.get("freshness_date") ?? "") || null,
          notes: String(form.get("notes") ?? "") || null,
        };

        const res = await fetch(`/api/controls/${encodeURIComponent(controlId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setMessage(data?.error ?? "Failed to update control snapshot.");
          setSaving(false);
          return;
        }

        setMessage("Saved.");
        setSaving(false);
      }}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-gray-700">
          Implementation
          <select
            name="implementation_status"
            defaultValue={defaults.implementation_status}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="Not started">Not started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Effective">Effective</option>
          </select>
        </label>

        <label className="text-sm text-gray-700">
          Testing
          <select
            name="testing_status"
            defaultValue={defaults.testing_status}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="Not tested">Not tested</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted to Auditor">Submitted to Auditor</option>
            <option value="Effective">Effective</option>
          </select>
        </label>

        <label className="text-sm text-gray-700">
          Automation
          <select
            name="automation_status"
            defaultValue={defaults.automation_status}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="Not started">Not started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-gray-700">
          Owner
          <input
            name="owner"
            defaultValue={defaults.owner ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="text-sm text-gray-700">
          Freshness date
          <input
            name="freshness_date"
            type="date"
            defaultValue={defaults.freshness_date ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="block text-sm text-gray-700">
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults.notes ?? ""}
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Save Snapshot"}
        </button>
        {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      </div>
    </form>
  );
}
