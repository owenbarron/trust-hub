import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { resolveAuditContext } from "@/lib/db";
import { getPoliciesList } from "@/lib/queries";
import { reviewDateState } from "@/lib/status";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function PoliciesPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const q = pickParam(searchParams.q);
  const relationshipType = pickParam(searchParams.relationshipType);
  const reviewState = pickParam(searchParams.reviewState);
  const sort = pickParam(searchParams.sort);

  const policies = getPoliciesList({ q, relationshipType, reviewState, sort });

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Policies</h1>
        <p className="mt-1 text-sm text-gray-600">Global policy register with control relationship coverage.</p>
      </section>

      <form className="bg-white px-6 py-3 border border-gray-200 rounded-lg flex flex-wrap items-center gap-3 shadow-sm mb-4">
        <input type="hidden" name="audit" value={context.selectedAudit.id} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by policy name or description"
          className="w-full max-w-sm border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]"
        />

        <select
          name="relationshipType"
          defaultValue={relationshipType ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Relationship: All</option>
          <option value="fulfills">fulfills</option>
          <option value="governs">governs</option>
          <option value="requires_acknowledgement">requires_acknowledgement</option>
        </select>

        <select
          name="reviewState"
          defaultValue={reviewState ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Review health: All</option>
          <option value="past">Past due</option>
          <option value="soon">Due in 30 days</option>
          <option value="healthy">Healthy</option>
        </select>

        <select
          name="sort"
          defaultValue={sort ?? "review"}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="review">Sort: Review date</option>
          <option value="controls">Linked controls</option>
          <option value="name">Policy name</option>
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
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Policy Name</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Next Review</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Linked Controls</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Relationship Types</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Document</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const review = reviewDateState(policy.review_date);
                return (
                  <tr key={policy.id} className="group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100">
                    <td className="px-3 py-4 align-top">
                      <Link
                        href={withAudit(`/policies/${policy.id}`, context.selectedAudit.id)}
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        {policy.name}
                      </Link>
                    </td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">{policy.description ?? "—"}</td>
                    <td className={`px-3 py-4 align-top text-sm ${review.className}`}>
                      <span className="inline-flex items-center gap-1">
                        <Icon name={review.icon} className="h-4 w-4" />
                        {policy.review_date ?? "No date"}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">{policy.linked_controls}</td>
                    <td className="px-3 py-4 align-top">
                      <div className="flex flex-wrap gap-1">
                        {policy.relationship_types
                          .split(",")
                          .filter(Boolean)
                          .map((value) => {
                            const chipClass =
                              value === "fulfills"
                                ? "bg-[#E8F4F4] text-[#006C75]"
                                : value === "governs"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-amber-50 text-amber-700";
                            return (
                              <span key={value} className={`${chipClass} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                                {value}
                              </span>
                            );
                          })}
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">
                      {policy.file_path ? (
                        <a href={policy.file_path} className="text-primary hover:text-primary-dark">Open</a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {policies.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="policy" className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No policies match the selected filters.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
