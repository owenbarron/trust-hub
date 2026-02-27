import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveAuditContext } from "@/lib/db";
import { getCriteriaMatrix } from "@/lib/queries";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function CriteriaPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const q = pickParam(searchParams.q);
  const category = pickParam(searchParams.category);
  const coverage = pickParam(searchParams.coverage);

  const matrix = getCriteriaMatrix({
    auditId: context.selectedAudit.id,
    q,
    category,
    coverage,
  });

  const groupedByCategory = new Map<string, typeof matrix.criteria>();
  for (const criterion of matrix.criteria) {
    const key = `${criterion.category}|||${criterion.subcategory}`;
    const bucket = groupedByCategory.get(key) ?? [];
    bucket.push(criterion);
    groupedByCategory.set(key, bucket);
  }

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Criteria Matrix</h1>
        <p className="mt-1 text-sm text-gray-600">SOC 2 criteria coverage with control effectiveness context.</p>
      </section>

      <form className="bg-white px-6 py-3 border border-gray-200 rounded-lg flex flex-wrap items-center gap-3 shadow-sm mb-4">
        <input type="hidden" name="audit" value={context.selectedAudit.id} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by criteria ID or description"
          className="w-full max-w-sm border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]"
        />

        <select
          name="category"
          defaultValue={category ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Category: All</option>
          {matrix.categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select
          name="coverage"
          defaultValue={coverage ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Coverage: All</option>
          <option value="covered">Covered</option>
          <option value="partial">Partial</option>
          <option value="uncovered">Uncovered</option>
        </select>

        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm" type="submit">
          Apply
        </button>
      </form>

      <section className="space-y-3">
        {Array.from(groupedByCategory.entries()).map(([key, criteria]) => {
          const [cat, subcat] = key.split("|||");
          return (
            <details key={key} open className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <summary className="cursor-pointer list-none px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cat}</p>
                    <p className="text-xs text-gray-500">{subcat}</p>
                  </div>
                  <span className="text-xs text-gray-500">{criteria.length} criteria</span>
                </div>
              </summary>

              <div className="divide-y divide-gray-100">
                {criteria.map((criterion) => (
                  <details key={criterion.id} className="px-4 py-3" open>
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{criterion.id}</p>
                          <p className="text-sm text-gray-700 mt-1">{criterion.name}</p>
                        </div>
                        <span className="text-xs text-gray-500">{criterion.controls.length} linked controls</span>
                      </div>
                    </summary>

                    {criterion.controls.length > 0 ? (
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 border-y border-gray-200">
                            <tr>
                              <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Control</th>
                              <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Implementation</th>
                              <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Testing</th>
                              <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Evidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {criterion.controls.map((control) => (
                              <tr key={control.id} className="border-b border-gray-100">
                                <td className="px-2 py-2">
                                  <Link
                                    href={withAudit(`/controls/${control.id}`, context.selectedAudit.id)}
                                    className="text-primary hover:text-primary-dark font-medium"
                                  >
                                    {control.id} · {control.name}
                                  </Link>
                                </td>
                                <td className="px-2 py-2"><StatusBadge value={control.implementation} /></td>
                                <td className="px-2 py-2"><StatusBadge value={control.testing} /></td>
                                <td className="px-2 py-2">
                                  {control.hasEvidence ? (
                                    <span className="bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium">Linked</span>
                                  ) : (
                                    <span className="bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-xs font-medium">Missing</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">No controls mapped to this criterion.</p>
                    )}
                  </details>
                ))}
              </div>
            </details>
          );
        })}

        {matrix.criteria.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Icon name="grid_view" className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No criteria match the selected filters.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
