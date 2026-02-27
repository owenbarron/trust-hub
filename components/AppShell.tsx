"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PropsWithChildren } from "react";
import { Icon } from "@/components/Icon";
import { Audit } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/controls", label: "Controls", icon: "verified_user" },
  { href: "/requests", label: "Requests", icon: "fact_check" },
  { href: "/criteria", label: "Criteria", icon: "grid_view" },
  { href: "/policies", label: "Policies", icon: "policy" },
  { href: "/evidence", label: "Evidence", icon: "folder_open" },
  { href: "/audits", label: "Audits", icon: "history" },
] as const;

export function AppShell({
  children,
  audits,
  selectedAudit,
  isReadOnly,
}: PropsWithChildren<{
  audits: Audit[];
  selectedAudit: Audit;
  isReadOnly: boolean;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const onAuditChange = (auditId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("audit", auditId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const active = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background-light text-text-main">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-[#18181b] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <img
                src="/images/USEFULL-icons/USEFULL-Icon-Registered_KnockOut.svg"
                alt="USEFULL"
                className="h-6 w-6"
              />
              Trust Hub
            </div>
            <p className="text-sm text-gray-300">SOC 2 Operations</p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active(item.href)
                    ? "bg-[#008C95] text-white shadow-sm"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
                >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-xs font-semibold">
                OB
              </div>
              <div>
                <p className="text-sm text-white">Owen Barron</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Selected Audit
                </p>
                <p className="text-sm font-semibold text-gray-900">{selectedAudit.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600" htmlFor="audit-switcher">
                  Audit
                </label>
                <select
                  id="audit-switcher"
                  value={selectedAudit.id}
                  onChange={(event) => onAuditChange(event.target.value)}
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-[#008C95]"
                >
                  {audits.map((audit) => (
                    <option key={audit.id} value={audit.id}>
                      {audit.name} {audit.status === "closed" ? "(Closed)" : "(Active)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          {isReadOnly ? (
            <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900 lg:px-6">
              Read-only mode: {selectedAudit.name}
              {selectedAudit.closed_at ? ` was closed on ${selectedAudit.closed_at}.` : " is closed."}
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
