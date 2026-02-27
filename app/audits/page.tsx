import { AppShell } from "@/components/AppShell";
import { AuditLifecycleActions } from "@/components/AuditLifecycleActions";
import { resolveAuditContext } from "@/lib/db";
import { pickParam } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function AuditsPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const activeAudit = context.audits.find((audit) => audit.status === "active") ?? null;

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audits</h1>
        <p className="mt-1 text-sm text-gray-600">Global audit lifecycle management.</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Active Audit</h2>
          {activeAudit ? (
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Name:</span> {activeAudit.name}</p>
              <p><span className="font-semibold">ID:</span> {activeAudit.id}</p>
              <p><span className="font-semibold">Period:</span> {activeAudit.period_start ?? "—"} to {activeAudit.period_end ?? "—"}</p>
              <p><span className="font-semibold">Auditor Firm:</span> {activeAudit.auditor_firm ?? "—"}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No active audit.</p>
          )}

          <div className="mt-6">
            <AuditLifecycleActions activeAudit={activeAudit} />
          </div>
        </article>

        <article className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Audit History</h2>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Period</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Closed</th>
                </tr>
              </thead>
              <tbody>
                {context.audits.map((audit) => (
                  <tr key={audit.id} className="border-b border-gray-100">
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-gray-900">{audit.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{audit.id}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className={
                        audit.status === "active"
                          ? "bg-cyan-50 text-cyan-700 border border-cyan-200/60 px-2.5 py-1 rounded-full text-xs font-medium"
                          : "bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium"
                      }>
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-sm text-gray-700">
                      {audit.period_start ?? "—"} to {audit.period_end ?? "—"}
                    </td>
                    <td className="px-3 py-3 align-top text-sm text-gray-700">{audit.closed_at ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
