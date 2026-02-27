"use client";

import { useState } from "react";

export function RequestEvidenceUploader({
  requestId,
  auditId,
  disabled,
}: {
  requestId: string;
  auditId: string;
  disabled: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (disabled) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Evidence uploads are disabled for closed audits.
      </div>
    );
  }

  return (
    <form
      className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        const form = new FormData(event.currentTarget);
        const payload = {
          auditId,
          filename: String(form.get("filename") ?? "").trim(),
          filePath: String(form.get("filePath") ?? "").trim(),
          fileType: String(form.get("fileType") ?? "").trim() || null,
          description: String(form.get("description") ?? "").trim() || null,
          uploadedBy: String(form.get("uploadedBy") ?? "").trim() || "System",
          requestIds: [requestId],
        };

        const res = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setMessage(data?.error ?? "Upload failed.");
          setSaving(false);
          return;
        }

        setMessage("Evidence linked to request and related controls. Refresh to see latest rows.");
        (event.currentTarget as HTMLFormElement).reset();
        setSaving(false);
      }}
    >
      <p className="text-sm font-medium text-gray-900">Upload/Link Evidence</p>
      <div className="grid gap-2 md:grid-cols-2">
        <input
          name="filename"
          required
          placeholder="filename.pdf"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="filePath"
          required
          placeholder="seed-data/evidence/CTL-001/filename.pdf"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="fileType"
          placeholder="pdf"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="uploadedBy"
          placeholder="Uploader"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="description"
        rows={2}
        placeholder="Description"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          {saving ? "Uploading..." : "Upload Evidence"}
        </button>
        {message ? <p className="text-xs text-gray-600">{message}</p> : null}
      </div>
    </form>
  );
}
