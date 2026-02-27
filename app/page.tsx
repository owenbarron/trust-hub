import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveAuditContext } from "@/lib/db";
import { getDashboardAttentionRows, getDashboardMetrics } from "@/lib/queries";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function DashboardPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const metrics = getDashboardMetrics(context.selectedAudit.id);
  const attention = getDashboardAttentionRows(context.selectedAudit.id);

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Audit-scoped SOC 2 health for {context.selectedAudit.name}.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Controls</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.totalControls}</p>
          <p className="mt-1 text-sm text-gray-600">
            {metrics.implementationDone} implementation complete
          </p>
        </article>

        <article className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Evidence Coverage</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.controlsWithEvidence}</p>
          <p className="mt-1 text-sm text-gray-600">Controls with linked evidence</p>
        </article>

        <article className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Open Requests</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.openRequests}</p>
          <p className="mt-1 text-sm text-gray-600">Requests requiring action</p>
        </article>

        <article className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Testing Complete</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.testingDone}</p>
          <p className="mt-1 text-sm text-gray-600">Controls tested/effective</p>
        </article>

        <article className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Freshness Issues</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.staleControls}</p>
          <p className="mt-1 text-sm text-gray-600">Expired freshness dates</p>
        </article>
      </section>

      <section className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Attention Needed</h2>
        </div>

        {attention.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="check_circle" className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No immediate freshness or evidence gaps.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Control
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Implementation
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Testing
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Freshness
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {attention.map((row) => (
                  <tr key={row.control_id} className="group border-b border-gray-100 transition-colors hover:bg-[#F1F5F9]">
                    <td className="px-3 py-4 align-top">
                      <Link
                        className="font-medium text-primary hover:text-primary-dark"
                        href={withAudit(`/controls/${row.control_id}`, context.selectedAudit.id)}
                      >
                        {row.control_id} · {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <StatusBadge value={row.implementation_status} />
                    </td>
                    <td className="px-3 py-4 align-top">
                      <StatusBadge value={row.testing_status} />
                    </td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">
                      {row.freshness_date ?? "—"}
                    </td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">{row.evidence_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
