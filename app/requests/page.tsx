import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveAuditContext } from "@/lib/db";
import { getAssigneeOptions, getRequestsList } from "@/lib/queries";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function RequestsPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const q = pickParam(searchParams.q);
  const status = pickParam(searchParams.status);
  const priority = pickParam(searchParams.priority);
  const assignee = pickParam(searchParams.assignee);
  const sort = pickParam(searchParams.sort);

  const requests = getRequestsList({
    auditId: context.selectedAudit.id,
    q,
    status,
    priority,
    assignee,
    sort,
  });

  const assigneeOptions = getAssigneeOptions(context.selectedAudit.id);

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Requests</h1>
        <p className="mt-1 text-sm text-gray-600">Audit-scoped auditor request tracking and fulfillment.</p>
      </section>

      <form className="bg-white px-6 py-3 border border-gray-200 rounded-lg flex flex-wrap items-center gap-3 shadow-sm mb-4">
        <input type="hidden" name="audit" value={context.selectedAudit.id} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by reference or summary"
          className="w-full max-w-sm border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Status: All</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Submitted to Auditor">Submitted to Auditor</option>
          <option value="Needs Revision">Needs Revision</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          name="priority"
          defaultValue={priority ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Priority: All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select
          name="assignee"
          defaultValue={assignee ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Assignee: All</option>
          {assigneeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select
          name="sort"
          defaultValue={sort ?? "reference"}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="reference">Sort: Reference</option>
          <option value="status">Status</option>
          <option value="priority">Priority</option>
          <option value="assignee">Assignee</option>
          <option value="evidence">Evidence count</option>
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
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Reference</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Summary</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Linked Controls</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Assignee</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Priority</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100">
                  <td className="px-3 py-4 align-top">
                    <Link
                      href={withAudit(`/requests/${encodeURIComponent(request.id)}`, context.selectedAudit.id)}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      {request.id}
                    </Link>
                  </td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{request.summary}</td>
                  <td className="px-3 py-4 align-top"><StatusBadge value={request.status} /></td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{request.linked_controls}</td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{request.assignee ?? "Unassigned"}</td>
                  <td className="px-3 py-4 align-top"><StatusBadge value={request.priority} /></td>
                  <td className="px-3 py-4 align-top text-sm text-gray-700">{request.evidence_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="fact_check" className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No requests match the current filters.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
