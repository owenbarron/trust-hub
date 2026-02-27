"use client";

import { useState } from "react";

export function CommentComposer({
  requestId,
  disabled,
}: {
  requestId: string;
  disabled: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (disabled) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Comments are read-only for closed audits.
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        const form = new FormData(event.currentTarget);

        const payload = {
          requestId,
          author: String(form.get("author") ?? "").trim(),
          body: String(form.get("body") ?? "").trim(),
          visibleToAuditor: form.get("visibleToAuditor") === "on",
        };

        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setMessage(data?.error ?? "Failed to add comment.");
          setSaving(false);
          return;
        }

        setMessage("Comment posted. Refresh to see the latest thread.");
        (event.currentTarget as HTMLFormElement).reset();
        setSaving(false);
      }}
    >
      <div className="grid gap-2 md:grid-cols-[220px_1fr]">
        <input
          name="author"
          placeholder="Your name"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input name="visibleToAuditor" type="checkbox" className="rounded border-gray-300" />
          Visible to auditor
        </label>
      </div>

      <textarea
        name="body"
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        placeholder="Add a comment"
        required
      />

      <div className="flex items-center gap-3">
        <button
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          {saving ? "Posting..." : "Post Comment"}
        </button>
        {message ? <p className="text-xs text-gray-600">{message}</p> : null}
      </div>
    </form>
  );
}
