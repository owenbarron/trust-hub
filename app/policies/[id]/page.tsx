import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveAuditContext } from "@/lib/db";
import { getPolicyDetail } from "@/lib/queries";
import { reviewDateState } from "@/lib/status";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function PolicyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Params;
}) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const policyId = Number(params.id);
  if (!Number.isFinite(policyId)) {
    notFound();
  }

  const detail = getPolicyDetail(policyId, context.selectedAudit.id);
  if (!detail) {
    notFound();
  }

  const grouped = {
    fulfills: detail.linkedControls.filter((item) => item.relationship_type === "fulfills"),
    governs: detail.linkedControls.filter((item) => item.relationship_type === "governs"),
    requires_acknowledgement: detail.linkedControls.filter(
      (item) => item.relationship_type === "requires_acknowledgement"
    ),
  };

  const review = reviewDateState(detail.policy.review_date);

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <Breadcrumbs
        items={[
          { label: "Policies", href: withAudit("/policies", context.selectedAudit.id) },
          { label: detail.policy.name },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{detail.policy.name}</h1>
          <p className="mt-2 text-sm text-gray-700">{detail.policy.description ?? "No description"}</p>

          <div className="mt-6 space-y-4">
            {(["fulfills", "governs", "requires_acknowledgement"] as const).map((relationship) => (
              <details key={relationship} className="rounded-lg border border-gray-200" open>
                <summary className="cursor-pointer list-none border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        relationship === "fulfills"
                          ? "bg-[#E8F4F4] text-[#006C75]"
                          : relationship === "governs"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {relationship}
                    </span>
                    {grouped[relationship].length} controls
                  </span>
                </summary>

                <div className="divide-y divide-gray-100">
                  {grouped[relationship].map((item) => (
                    <div key={item.control_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <Link
                          href={withAudit(`/controls/${item.control_id}`, context.selectedAudit.id)}
                          className="text-sm font-medium text-primary hover:text-primary-dark"
                        >
                          {item.control_id} · {item.control_name}
                        </Link>
                        {relationship === "requires_acknowledgement" ? (
                          <p className="mt-1 text-xs text-gray-500">
                            Acknowledged: {item.acknowledged ? "Yes" : "No evidence linked"}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={item.implementation_status} />
                        <StatusBadge value={item.testing_status} />
                      </div>
                    </div>
                  ))}

                  {grouped[relationship].length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">No controls in this relationship group.</p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </article>

        <aside className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 h-fit">
          <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Version</p>
            <p className="text-sm text-gray-900">{detail.policy.version ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Owner</p>
            <p className="text-sm text-gray-900">{detail.policy.owner ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Review Date</p>
            <p className={`inline-flex items-center gap-1 text-sm ${review.className}`}>
              <Icon name={review.icon} className="h-4 w-4" />
              {detail.policy.review_date ?? "No date"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Document</p>
            {detail.policy.file_path ? (
              <a href={detail.policy.file_path} className="text-sm text-primary hover:text-primary-dark">
                {detail.policy.file_path}
              </a>
            ) : (
              <p className="text-sm text-gray-900">—</p>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
