import { AppShell } from "@/components/AppShell";
import { EvidenceRelinkForm } from "@/components/EvidenceRelinkForm";
import { Icon } from "@/components/Icon";
import { fileTypeIcon } from "@/lib/status";
import { resolveAuditContext } from "@/lib/db";
import { getEvidenceList } from "@/lib/queries";
import { pickParam } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function EvidencePage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const context = resolveAuditContext(auditId);

  const q = pickParam(searchParams.q);
  const type = pickParam(searchParams.type);

  const evidenceRows = getEvidenceList({
    auditId: context.selectedAudit.id,
    q,
    type,
  });

  return (
    <AppShell
      audits={context.audits}
      selectedAudit={context.selectedAudit}
      isReadOnly={context.isReadOnly}
    >
      <section className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Evidence</h1>
        <p className="mt-1 text-sm text-gray-600">Audit-scoped evidence library with relink workflows.</p>
      </section>

      <form className="bg-white px-6 py-3 border border-gray-200 rounded-lg flex flex-wrap items-center gap-3 shadow-sm mb-4">
        <input type="hidden" name="audit" value={context.selectedAudit.id} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search filename or path"
          className="w-full max-w-sm border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]"
        />

        <select
          name="type"
          defaultValue={type ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]"
        >
          <option value="">Type: All</option>
          <option value="pdf">pdf</option>
          <option value="png">png</option>
          <option value="jpg">jpg</option>
          <option value="xlsx">xlsx</option>
          <option value="csv">csv</option>
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
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">File Name</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Uploaded</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Uploaded By</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Linked To</th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {evidenceRows.map((row) => {
                const typeMeta = fileTypeIcon(row.file_type);
                return (
                  <tr key={row.id} className="group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100">
                    <td className="px-3 py-4 align-top">
                      <p className="text-sm font-medium text-gray-900">{row.filename}</p>
                      <p className="text-xs text-gray-500 mt-1">{row.file_path}</p>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeMeta.badgeClass}`}>
                        <Icon name={typeMeta.icon} className={`h-4 w-4 ${typeMeta.iconClass}`} />
                        {row.file_type ?? "unknown"}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">{row.uploaded_at}</td>
                    <td className="px-3 py-4 align-top text-sm text-gray-700">{row.uploaded_by ?? "Unknown"}</td>
                    <td className="px-3 py-4 align-top">
                      <div className="flex flex-wrap gap-1">
                        {row.linkedControls.map((control) => (
                          <span key={`c-${row.id}-${control}`} className="bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded text-xs font-medium">
                            {control}
                          </span>
                        ))}
                        {row.linkedRequests.map((request) => (
                          <span key={`r-${row.id}-${request}`} className="bg-[#E6F8FB] text-[#0E7490] px-2 py-0.5 rounded text-xs font-medium">
                            {request}
                          </span>
                        ))}
                        {row.linkedControls.length === 0 && row.linkedRequests.length === 0 ? (
                          <span className="text-xs text-red-700">No audit-scoped links</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <EvidenceRelinkForm
                        evidenceId={row.id}
                        auditId={context.selectedAudit.id}
                        disabled={context.isReadOnly}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {evidenceRows.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="folder_open" className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No evidence rows match the selected filters.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
