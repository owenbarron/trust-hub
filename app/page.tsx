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
        <p className="mt-1 text-sm text-gray-500">
          Audit-scoped SOC 2 health for {context.selectedAudit.name}.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Controls</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.totalControls}</p>
          <p className="mt-1 text-xs text-gray-500">{metrics.implementationDone} implemented</p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Evidence</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.controlsWithEvidence}</p>
          <p className="mt-1 text-xs text-gray-500">Controls with linked proof</p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Open Requests</p>
          <p className={`mt-2 text-2xl font-bold ${metrics.openRequests > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {metrics.openRequests}
          </p>
          <p className="mt-1 text-xs text-gray-500">Awaiting action</p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Testing</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.testingDone}</p>
          <p className="mt-1 text-xs text-gray-500">Controls tested / effective</p>
        </article>

        <article className={`rounded-xl border bg-white p-4 shadow-sm ${metrics.staleControls > 0 ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Freshness</p>
          <p className={`mt-2 text-2xl font-bold ${metrics.staleControls > 0 ? "text-red-600" : "text-gray-900"}`}>
            {metrics.staleControls}
          </p>
          <p className="mt-1 text-xs text-gray-500">Expired freshness dates</p>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Attention Needed</h2>
        </div>

        {attention.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="check_circle" className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No immediate freshness or evidence gaps.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/60">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Control
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Implementation
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Testing
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Freshness
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {attention.map((row) => (
                  <tr key={row.control_id} className="group border-b border-gray-100 transition-colors hover:bg-gray-50/80">
                    <td className="px-3 py-3.5 align-top">
                      <Link
                        className="font-medium text-primary hover:text-primary-dark"
                        href={withAudit(`/controls/${row.control_id}`, context.selectedAudit.id)}
                      >
                        {row.control_id} · {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 align-top">
                      <StatusBadge value={row.implementation_status} />
                    </td>
                    <td className="px-3 py-3.5 align-top">
                      <StatusBadge value={row.testing_status} />
                    </td>
                    <td className="px-3 py-3.5 align-top text-sm text-gray-600">
                      {row.freshness_date ?? "—"}
                    </td>
                    <td className="px-3 py-3.5 align-top text-sm text-gray-600">{row.evidence_count}</td>
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
