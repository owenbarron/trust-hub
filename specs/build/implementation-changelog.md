# Implementation Changelog

Date: 2026-02-27
Workspace: `/Users/owenbarron/Projects/trust-hub`

## Summary
Implemented the v1 build plan in `specs/build` as a Next.js 14 App Router application with SQLite-backed data access and API routes, including all required page routes, audit scoping, read-only closed-audit behavior, and lifecycle actions.

## Change Entries
- 2026-02-27 16:46 UTC: Added `controls.type` (`control` vs `policy`) derived from control name to prevent policy-like controls from appearing in the Controls list and dashboard metrics; updated queries to filter to `type = 'control'`.
- 2026-02-27 16:46 UTC: Updated seed pipeline to link evidence to both 2025 and 2026 audits and adjusted seed validation to require evidence links for the active audit.
- 2026-02-27 16:46 UTC: Rebuilt the database via `npm run seed` to apply the updated control typing and evidence link behavior.

## Delivered

### Architecture + Tooling
- Added Next.js App Router scaffold with TypeScript + Tailwind.
- Added shared SQLite access/query layer for audit-scoped and global views.
- Added status/file/review-date style helpers and shared shell/navigation components.
- Updated `.gitignore` for Next.js/node artifacts and local DB.

### Required Routes
- `/` Dashboard (audit-scoped metrics + attention table).
- `/controls` Controls list with search/filter/sort.
- `/controls/[id]` Control detail with tab order: `Details | Criteria | Policies | Evidence | Requests`.
- `/requests` Requests list with search/filter/sort.
- `/requests/[id]` Request detail with status updates, request-context evidence linking, comments.
- `/criteria` Criteria matrix with category/subcategory hierarchy and linked control status.
- `/policies` Global policies list with relationship/review health controls.
- `/policies/[id]` Policy detail grouped by `fulfills`, `governs`, `requires_acknowledgement` with audit-context status.
- `/evidence` Audit-scoped evidence library with relink action.
- `/audits` Audit lifecycle management (close audit / start new audit from prior snapshot set).

### API Surface (V1)
- `/api/audits` `GET`/`POST`/`PATCH`
- `/api/controls` `GET`
- `/api/controls/[id]` `GET`/`PATCH`
- `/api/requests` `GET`/`POST`
- `/api/requests/[id]` `GET`/`PATCH`/`DELETE`
- `/api/evidence` `GET`/`POST`
- `/api/evidence/relink-control` `POST`
- `/api/policies` `GET`/`POST`
- `/api/policies/[id]` `GET`/`PATCH`/`DELETE`
- `/api/comments` `POST`

## Validation

### Commands Run
1. `npm install`
2. `npm run typecheck`
3. `npm run build`
4. `npm run seed`

### Results
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run seed`: passed with expected warning:
  - `Request REQ032 → CTL-051 is invalid (control not found) — skipping`
- Seed validation checks passed (`6 passed, 0 failed`).

## Gotchas
- Build emits a warning in this environment because Google-hosted Material Symbols stylesheet cannot be fetched (`fonts.googleapis.com` DNS/network restricted). Build still succeeds.
- UI links for evidence/policy files rely on local file paths from the seed data and may show unavailable content if files are missing at runtime.

## Change Entries (continued)
- 2026-02-27 18:00 UTC: Created `CLAUDE.md` (thin pointer) and `AGENTS.md` (full operating manual) at repo root to enable clean Claude Code / Codex collaboration and persist operational rules across sessions.

## Change Entries (session 2026-02-27 #2)
- 2026-02-27 UTC: Scraped all 54 audit requests from Hyperproof internal API using browser session token + OAuth client credentials. Exported request details, comments, and proof file metadata to `seed-data/hyperproof-export/` (55 JSON files). Downloaded 105 of 115 proof binary files to `seed-data/hyperproof-export/proof/` (gitignored).
- 2026-02-27 UTC: Integrated Hyperproof export into `scripts/seed.ts`. Seeds 58 real comments (resolves `{{user:UUID}}` @mentions to display names), 115 evidence records from proof metadata, 158 request→evidence links, 89 control→evidence links. Falls back to hardcoded placeholder comments if export directory absent.
- 2026-02-27 UTC: Updated `.gitignore` to track export JSON files (only exclude binary `proof/` subdir). Committed 55 JSON files so Vercel build has real data at seed time.
- 2026-02-27 UTC: Fixed seed skipping evidence records when binary proof files not on disk — Vercel now gets full 115 metadata rows; only file download is unavailable there.
- 2026-02-27 UTC: Fixed "Follow Up" request detail pages returning 404. Root cause: Next.js App Router passes `params.id` as raw URL-encoded string (`Follow%20Up%20-%2001`); added `decodeURIComponent()` in page component and all three API route handlers (`GET`/`PATCH`/`DELETE`).
- 2026-02-27 UTC: Set up Vercel deployment (`vercel-build` script, `outputFileTracingIncludes` for DB bundling, Vercel-aware `lib/db.ts` copy-to-/tmp on cold start). App live at https://trust-hub-ten.vercel.app.

## Change Entries (session 2026-02-27 #3 — UI polish)
- 2026-02-27 UTC: Switched font from Public Sans to Inter via `next/font/google`; updated Tailwind `fontFamily` to use `--font-inter` CSS variable.
- 2026-02-27 UTC: Darkened sidebar background from `#4C4C4E` to `#18181b` (`slate-custom` token) in both `AppShell.tsx` and `tailwind.config.ts`.
- 2026-02-27 UTC: Refactored `lib/status.ts` status badge classes to Tailwind ring-inset pattern (`ring-1 ring-inset ring-{color}/20`) with `inline-flex items-center gap-1.5`; changed open/informational from `cyan` to `sky`; updated fallback class to match.
- 2026-02-27 UTC: Updated `StatusBadge` component to render a small colored dot (`h-1.5 w-1.5 rounded-full bg-current opacity-70`) inside each badge.
- 2026-02-27 UTC: Dashboard metrics grid changed to 5-column (`xl:grid-cols-5`), tighter spacing, smaller label text (`text-[11px] tracking-widest`), conditional amber coloring for open requests and red tinting for freshness issues.
- 2026-02-27 UTC: Tightened "Attention Needed" table header styles (smaller text, `py-2.5`, `bg-gray-50/60`); updated row padding and cell text colors.
- 2026-02-27 UTC: Removed `bg-gray-50` header background from "Attention Needed" section title area for cleaner look.

## Handoff — 2026-02-27 (end of day)

### What Was Done
- **Hyperproof data scrape**: Built `scripts/scrape-hyperproof.ts` — exports all 54 audit requests with real comments and proof metadata from Hyperproof before contract ends. Uses browser JWT (SESSION_TOKEN) for internal API + OAuth client credentials for file downloads.
- **Real seed data**: `scripts/seed.ts` now ingests the export JSON files and seeds real comments (58), proof as evidence (115 records), and control links (89). `{{user:UUID}}` mentions resolved to `@Name`.
- **Vercel deployment**: App deploys to https://trust-hub-ten.vercel.app with seed-on-build. DB bundled via `outputFileTracingIncludes`, copied to `/tmp` at runtime.
- **Bug fix**: "Follow Up" requests now open correctly (`decodeURIComponent` on route params).
- **UI polish (session 3)**: Switched font to Inter, darkened sidebar to `#18181b`, refactored status badges to ring-inset style with colored dot indicators, tightened dashboard metrics grid to 5-column with conditional red/amber coloring.

### What Is Next
- No outstanding blockers. Potential next priorities:
  - Further UI polish on Controls, Requests, Evidence, Policies detail pages
  - Evidence file download support on Vercel (would require object storage like S3 or committing small files)
  - Any additional data cleanup or new features for the demo

### Blockers
- None.

### Notes for Next Agent
- Binary proof files (105 files, ~30MB total) live only at `seed-data/hyperproof-export/proof/` on Owen's laptop — gitignored. Evidence metadata shows on Vercel but files aren't downloadable there.
- Known HP user IDs are hardcoded in `KNOWN_HP_USERS` in `scripts/seed.ts`. If new user IDs appear in future exports, add them there.
- Hyperproof contract ending — `scripts/scrape-hyperproof.ts` requires a fresh `SESSION_TOKEN` from browser DevTools if it needs to be re-run. Token lasts a few hours.
- After any seed change: `rm -f trust-hub.db trust-hub.db-shm trust-hub.db-wal && npm run seed`, then restart `npm run dev`.
