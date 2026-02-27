# Trust Hub — Agent Operating Manual

This file is the single source of truth for all agents (Claude Code, OpenAI Codex, etc.).
Edit **this file only** to broadcast operational rules to all agents.

---

## §0 Absolute Rules

1. **Never commit or push** unless the user explicitly asks.
2. **Never run `npm run seed`** unless the user asks, or the DB file (`trust-hub.db`) is absent and the dev server cannot start.
3. **Never bypass TypeScript** with `@ts-ignore`, `as any`, or type-casting hacks to silence errors. Fix the underlying type problem.
4. **Never modify the changelog** except to append entries (§4) or update the Handoff block (§5).

---

## §1 Before Starting Any Task

1. Read `specs/build/implementation-changelog.md` to understand current state.
2. Identify all files you will need to change before writing a single line.
3. If the task involves schema changes (new columns, tables, or indexes), note that you must also update `scripts/seed.ts` and ask the user before running seed.
4. If you are unsure about the audit-scoping model, re-read §6 and §7 before touching any query or page.

---

## §2 Validation Checklist

Run these **in order** before marking a task done:

```
npm run typecheck   # must pass with zero errors
npm run build       # must pass with zero errors
```

Do not mark a task complete if either command fails. Fix errors first.

---

## §3 Server Restart Requirements

Restart `npm run dev` after **any** of the following changes:

| Change | Why |
|---|---|
| New or modified file under `app/api/` | Next.js route manifest update |
| New or modified file under `app/` (pages) | App Router layout/page registration |
| Changes to `next.config.js` | Config reload required |
| Changes to `lib/db.ts` | Singleton re-initialization |
| Running `npm run seed` | DB state has changed |

If you cannot restart the dev server directly, run `npm run build` as a sanity check and note in your handoff that a restart is needed.

---

## §4 Changelog Update Protocol

After every meaningful change, **append** a line to `specs/build/implementation-changelog.md` under `## Change Entries`:

```
- YYYY-MM-DD HH:MM UTC: <concise description of what changed and why>
```

Use UTC. Do not rewrite or reorder existing entries.

---

## §5 Handoff Protocol

At the end of a session, **append or replace** a `## Handoff — YYYY-MM-DD` block at the bottom of `specs/build/implementation-changelog.md`:

```markdown
## Handoff — YYYY-MM-DD

### What Was Done
- <bullet list>

### What Is Next
- <bullet list, or "Nothing outstanding">

### Blockers
- <bullet list, or "None">

### Notes for Next Agent
- <anything the next agent needs to know that isn't already in §6–§8>
```

Replace a previous Handoff block if one already exists at the bottom.

---

## §6 Architecture Quick Reference

| File / Directory | Purpose |
|---|---|
| `app/` | Next.js 14 App Router — all pages and API routes |
| `app/api/` | REST API routes (Next.js Route Handlers) |
| `components/` | Shared React components (`AppShell`, `Icon`, `StatusBadge`, …) |
| `lib/db.ts` | SQLite singleton (`db()`), `resolveAuditContext()`, audit lifecycle helpers |
| `lib/queries.ts` | All read queries (controls, policies, evidence, criteria, …) |
| `lib/api.ts` | API helpers: `ensureActiveAudit()`, `badRequest()`, `notFound()`, `conflict()` |
| `lib/url.ts` | `withAudit(path, auditId)`, `pickParam(searchParam)` |
| `lib/status.ts` | Status badge colour helpers, `reviewDateState()` |
| `lib/types.ts` | Shared TypeScript types |
| `scripts/seed.ts` | Schema DDL (CREATE TABLE) + seed data — the source of truth for the DB schema |
| `trust-hub.db` | SQLite file; created by `npm run seed`; gitignored |
| `specs/build/` | Build specs (architecture, pages, styles, seed-data) and the changelog |

**Key scripts (package.json):**

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build (good sanity check) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Drop + recreate DB from `scripts/seed.ts` |

---

## §7 Key Patterns

### Audit-scoped Server Component (standard pattern)

```tsx
// app/controls/page.tsx (example)
import { resolveAuditContext } from "@/lib/db";
import { pickParam, withAudit } from "@/lib/url";

type Params = Record<string, string | string[] | undefined>;

export default function ControlsPage({ searchParams }: { searchParams: Params }) {
  const auditId = pickParam(searchParams.audit);
  const { audits, selectedAudit, isReadOnly } = resolveAuditContext(auditId);

  // Pass audit context to AppShell for the audit switcher
  return (
    <AppShell audits={audits} selectedAudit={selectedAudit} isReadOnly={isReadOnly}>
      {/* page content */}
    </AppShell>
  );
}
```

- `resolveAuditContext(auditId?)` — resolves the audit from the `?audit=` param; falls back to the active audit; throws if no audits exist.
- `isReadOnly` is `true` when the selected audit is `closed`. UI must respect this.

### Mutation route guard (API routes)

```ts
// app/api/controls/[id]/route.ts (example PATCH)
import { ensureActiveAudit, badRequest } from "@/lib/api";

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const auditId = (body?.auditId as string | undefined)?.trim();
  if (!auditId) return badRequest("`auditId` is required.");

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) return auditCheck.response; // 404 or 409 if closed

  // ... mutation logic
}
```

### Building links with audit context

```ts
import { withAudit } from "@/lib/url";

// Produces "/controls/CTL-001?audit=AUD-2026"
const href = withAudit(`/controls/${control.id}`, selectedAudit.id);
```

---

## §8 Common Gotchas

| Gotcha | Detail |
|---|---|
| **DB must exist before dev** | `lib/db.ts` opens with `{ fileMustExist: true }`. If `trust-hub.db` is missing the server crashes on first DB call. Run `npm run seed` once to create it. |
| **No Drizzle migrations** | The project does NOT use Drizzle ORM or any migration framework. Schema lives entirely in `scripts/seed.ts` as raw `CREATE TABLE` statements. To change schema: update the seed file and re-run `npm run seed` (destructive — all data is dropped). |
| **`control_snapshots` vs `controls`** | Runtime control data (statuses, owner, notes) lives in `control_snapshots` scoped to an `audit_id`. The `controls` table holds only static identity fields (`id`, `name`, `description`, `type`). Queries must join both. |
| **`controls.type` filter** | Controls whose names match policy-like patterns are seeded with `type = 'policy'`. The Controls list and dashboard metrics filter to `type = 'control'` only. Do not remove this filter. |
| **Policies are global** | Policies (`/policies`, `/policies/[id]`) are NOT audit-scoped. `getPoliciesList()` does not take an `auditId`. The page still receives audit context for `AppShell` (switcher UI) but does not filter policies by audit. |
| **Status value casing** | Implementation status values: `implemented`, `partial`, `not_implemented`. Testing status values: `passed`, `failed`, `not_tested`. Audit status values: `active`, `closed`. These are stored as lowercase strings — do not use title case. |
| **`"use client"` boundary** | All pages under `app/` are Server Components by default. Only add `"use client"` to components that use hooks (`useState`, `useEffect`, `useRouter`, etc.). Do not add it to pages that only read `searchParams`. |
| **Google Fonts DNS warning** | The build emits a warning because `fonts.googleapis.com` is unreachable in the dev environment. This is cosmetic — build and runtime still work. |
| **Seed validation warning** | `npm run seed` prints `Request REQ032 → CTL-051 is invalid (control not found) — skipping`. This is expected and harmless. |
| **`withAudit()` on all internal links** | Every internal link that navigates within the app must carry the `?audit=` param via `withAudit()`. Omitting it causes the UI to silently fall back to the active audit, which is confusing when viewing a closed audit. |
