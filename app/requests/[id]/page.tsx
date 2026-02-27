import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CommentComposer } from "@/components/CommentComposer";
import { RequestEvidenceUploader } from "@/components/RequestEvidenceUploader";
import { RequestStatusEditor } from "@/components/RequestStatusEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveAuditContext } from "@/lib/db";
import { getRequestDetail } from "@/lib/queries";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

type PageProps = {
  params: { id: string };
  searchParams: Params;
};

export default function RequestDetailPage({ params, searchParams }: PageProps) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const detail = getRequestDetail(params.id, context.selectedAudit.id);
  if (!detail) {
    notFound();
  }

  const { request, controls, evidence, comments } = detail;

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <Breadcrumbs
        items={[
          { label: "Requests", href: withAudit("/requests", context.selectedAudit.id) },
          { label: request.id },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Reference</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 tracking-tight">{request.id}</h1>
            <p className="mt-1 text-sm text-gray-700">{request.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
              <div className="mt-2">
                {context.isReadOnly ? (
                  <StatusBadge value={request.status} />
                ) : (
                  <RequestStatusEditor
                    requestId={request.id}
                    auditId={context.selectedAudit.id}
                    initialStatus={request.status}
                  />
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Priority</p>
              <div className="mt-2"><StatusBadge value={request.priority} /></div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Assignee</p>
              <p className="mt-1 text-sm text-gray-900">{request.assignee ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Source</p>
              <p className="mt-1 text-sm text-gray-900">{request.source ?? "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {request.description || "No description."}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Linked Controls</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {controls.map((control) => (
                <Link
                  key={control.id}
                  href={withAudit(`/controls/${control.id}`, context.selectedAudit.id)}
                  className="bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded text-xs font-medium"
                >
                  {control.id}
                </Link>
              ))}
              {controls.length === 0 ? <p className="text-sm text-gray-500">No linked controls.</p> : null}
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Evidence</h2>
            <p className="mt-1 text-sm text-gray-600">Request evidence for the selected audit.</p>

            <div className="mt-3 space-y-2">
              {evidence.map((item) => (
                <div key={item.id} className="rounded border border-gray-200 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{item.filename}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.uploaded_at} · {item.uploaded_by ?? "Unknown"}</p>
                </div>
              ))}
              {evidence.length === 0 ? <p className="text-sm text-gray-500">No evidence linked.</p> : null}
            </div>

            <div className="mt-3">
              <RequestEvidenceUploader
                requestId={request.id}
                auditId={context.selectedAudit.id}
                disabled={context.isReadOnly}
              />
            </div>
          </article>

          <article className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
            <div className="mt-3 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded border border-gray-200 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{comment.author}</span>
                    <span>{comment.created_at}</span>
                    {comment.visible_to_auditor ? (
                      <span className="bg-[#E6F8FB] text-[#0E7490] px-2 py-0.5 rounded text-xs font-medium">
                        Auditor visible
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                </div>
              ))}
              {comments.length === 0 ? <p className="text-sm text-gray-500">No comments yet.</p> : null}
            </div>

            <div className="mt-4">
              <CommentComposer requestId={request.id} disabled={context.isReadOnly} />
            </div>
          </article>
        </aside>
      </section>
    </AppShell>
  );
}
