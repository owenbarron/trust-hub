import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ControlSnapshotEditor } from "@/components/ControlSnapshotEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { getControlDetail } from "@/lib/queries";
import { resolveAuditContext } from "@/lib/db";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

type PageProps = {
  params: { id: string };
  searchParams: Params;
};

const TABS = ["details", "criteria", "policies", "evidence", "requests"] as const;

export default function ControlDetailPage({ params, searchParams }: PageProps) {
  const auditId = pickParam(searchParams.audit);
  const tab = pickParam(searchParams.tab) ?? "details";
  const context = resolveAuditContext(auditId);

  const control = getControlDetail(params.id, context.selectedAudit.id);
  if (!control) {
    notFound();
  }

  const activeTab = TABS.includes(tab as (typeof TABS)[number]) ? tab : "details";

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <Breadcrumbs
        items={[
          { label: "Controls", href: withAudit("/controls", context.selectedAudit.id) },
          { label: control.id },
        ]}
      />

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{control.id} · {control.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Domain: {control.domain ?? "Unspecified"}</p>
        </div>

        <div className="px-6 pt-4 border-b border-gray-200">
          <nav className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <Link
                key={item}
                href={withAudit(`/controls/${control.id}?tab=${item}`, context.selectedAudit.id)}
                className={`rounded-t-md px-3 py-2 text-sm font-medium capitalize ${
                  activeTab === item
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "details" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Implementation</p>
                  <div className="mt-2"><StatusBadge value={control.implementation_status} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Testing</p>
                  <div className="mt-2"><StatusBadge value={control.testing_status} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Automation</p>
                  <div className="mt-2"><StatusBadge value={control.automation_status} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Owner</p>
                  <p className="mt-2 text-sm text-gray-900">{control.owner_display}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
                <p className="mt-2 text-sm text-gray-700">{control.description || "No description."}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Freshness Date</p>
                <p className="mt-2 text-sm text-gray-700">{control.freshness_date ?? "Not set"}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{control.notes || "No notes."}</p>
              </div>

              {context.isReadOnly ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Snapshot edits are disabled for closed audits.
                </div>
              ) : (
                <ControlSnapshotEditor
                  auditId={context.selectedAudit.id}
                  controlId={control.id}
                  defaults={{
                    implementation_status: control.implementation_status,
                    testing_status: control.testing_status,
                    automation_status: control.automation_status,
                    owner: control.owner,
                    freshness_date: control.freshness_date,
                    notes: control.notes,
                  }}
                />
              )}
            </div>
          ) : null}

          {activeTab === "criteria" ? (
            <div className="space-y-3">
              {control.criteria.map((criterion) => (
                <article key={criterion.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{criterion.id}</p>
                  <p className="mt-1 text-sm text-gray-900">{criterion.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {criterion.category ?? "Uncategorized"} · {criterion.subcategory ?? "General"}
                  </p>
                </article>
              ))}
              {control.criteria.length === 0 ? (
                <p className="text-sm text-gray-500">No criteria mapped.</p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "policies" ? (
            <div className="space-y-3">
              {control.policies.map((policy) => (
                <article key={policy.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={withAudit(`/policies/${policy.id}`, context.selectedAudit.id)}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      {policy.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Review date: {policy.review_date ?? "—"}</p>
                  </div>
                  <span className="bg-[#E8F4F4] text-[#006C75] px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {policy.relationship_type}
                  </span>
                </article>
              ))}
              {control.policies.length === 0 ? (
                <p className="text-sm text-gray-500">No linked policies.</p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "evidence" ? (
            <div className="space-y-3">
              {control.evidence.map((item) => (
                <article key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.filename}</p>
                    <p className="text-xs text-gray-500 mt-1">Uploaded {item.uploaded_at} by {item.uploaded_by ?? "Unknown"}</p>
                  </div>
                  <Link
                    href={item.file_path}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    Open file
                  </Link>
                </article>
              ))}
              {control.evidence.length === 0 ? (
                <p className="text-sm text-gray-500">No evidence linked in this audit.</p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "requests" ? (
            <div className="space-y-3">
              {control.requests.map((item) => (
                <article key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={withAudit(`/requests/${encodeURIComponent(item.id)}`, context.selectedAudit.id)}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      {item.id}
                    </Link>
                    <p className="text-sm text-gray-700 mt-1">{item.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={item.status} />
                    <StatusBadge value={item.priority} />
                  </div>
                </article>
              ))}
              {control.requests.length === 0 ? (
                <p className="text-sm text-gray-500">No linked requests in this audit.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
