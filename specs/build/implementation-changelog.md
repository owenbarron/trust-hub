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

## Handoff — 2026-02-27

### What Was Done
- Created `CLAUDE.md`: thin pointer that directs Claude Code to read `AGENTS.md` on every session start.
- Created `AGENTS.md`: single source of truth for all agents — covers absolute rules, validation checklist, server restart requirements, changelog/handoff protocol, architecture quick reference, key code patterns, and common gotchas.

### What Is Next
- Nothing outstanding from this task. Continue v1 feature work or bug fixes as needed.

### Blockers
- None.

### Notes for Next Agent
- `AGENTS.md` is the file to edit when broadcasting new rules to all agents. Do not edit `CLAUDE.md`.
- The v1 build is fully validated (`typecheck` + `build` passed). DB is seeded. Dev server requires `trust-hub.db` to exist before starting (see §8).
