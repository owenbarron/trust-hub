import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveAuditContext } from "@/lib/db";
import { getControlsList } from "@/lib/queries";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function ControlsPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const q = pickParam(searchParams.q);
  const implementation = pickParam(searchParams.implementation);
  const testing = pickParam(searchParams.testing);
  const hasEvidence = pickParam(searchParams.hasEvidence);
  const sort = pickParam(searchParams.sort);

  const controls = getControlsList({
    auditId: context.selectedAudit.id,
    q,
    implementation,
    testing,
    hasEvidence,
    sort,
  });

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Controls</h1>
        <p className="mt-1 text-sm text-gray-600">Primary controls operating view for the selected audit.</p>
      </section>

      <form className="bg-white px-6 py-3 border border-gray-200 rounded-lg flex flex-wrap items-center gap-3 shadow-sm mb-4">
        <input type="hidden" name="audit" value={context.selectedAudit.id} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by ID or name"
          className="w-full max-w-sm border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]"
        />
        <select
          name="implementation"
          defaultValue={implementation ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Implementation: All</option>
          <option value="Not started">Not started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Effective">Effective</option>
        </select>
        <select
          name="testing"
          defaultValue={testing ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Testing: All</option>
          <option value="Not tested">Not tested</option>
          <option value="In Progress">In Progress</option>
          <option value="Submitted to Auditor">Submitted to Auditor</option>
          <option value="Effective">Effective</option>
        </select>
        <select
          name="hasEvidence"
          defaultValue={hasEvidence ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Evidence: All</option>
          <option value="yes">Has evidence</option>
          <option value="no">No evidence</option>
        </select>
        <select
          name="sort"
          defaultValue={sort ?? "name"}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="name">Sort: Name</option>
          <option value="id">ID</option>
          <option value="implementation">Implementation</option>
          <option value="testing">Testing</option>
          <option value="freshness">Freshness</option>
          <option value="evidence">Evidence count</option>
          <option value="criteria">Criteria count</option>
        </select>
        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm" type="submit">
          Apply
        </button>
      </form>

      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Implementation</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Testing</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Freshness</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Evidence</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Criteria</th>
              </tr>
            </thead>
            <tbody>
              {controls.map((control) => (
                <tr key={control.id} className="group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100">
                  <td className="px-3 py-4 align-top">
                    <Link
                      href={withAudit(`/controls/${control.id}`, context.selectedAudit.id)}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      {control.id}
                    </Link>
                  </td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{control.name}</td>
                  <td className="px-3 py-4 align-top"><StatusBadge value={control.implementation_status} /></td>
                  <td className="px-3 py-4 align-top"><StatusBadge value={control.testing_status} /></td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{control.freshness_date ?? "—"}</td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{control.evidence_count}</td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{control.criteria_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {controls.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="verified_user" className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No controls match the current filters.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
