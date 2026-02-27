# Spec Reorganization — Instructions for Agent

## Goal

Reorganize `specs/` so a builder agent gets a clean, minimal set of build instructions — no history, no superseded drafts, no decision archaeology. The current folder has 15+ files spanning 4 spec iterations. We need 3-4 files that say "build this."

## New Structure

```
specs/
├── build/                          ← NEW: everything a builder needs
│   ├── 01-architecture.md          ← schema, tech stack, data model, constraints
│   ├── 02-pages.md                 ← every page spec with behavior + sample data
│   ├── 03-styles.md                ← visual system, components, tokens
│   └── 04-seed-data.md             ← what the seed script produces, how to run it
├── archive/                        ← OLD: moved here, not deleted
│   ├── usefull-soc2-implementation-plan.md
│   ├── usefull-soc2-conversation-history.md
│   ├── v2-implementation-plan-with-audit-scoping.md
│   ├── v2-UI spec with audit scoping.md
│   ├── v3-implementation-plan-with-policies.md
│   ├── v3-UI spec with policies.md
│   ├── implementation-questions.md
│   ├── v4-implementation-plan.md
│   ├── v4-ui-decisions.md
│   ├── spec-history.md
│   ├── plan-evaluation.md
│   └── seed-pipeline-implementation-plan.md
├── mockup-prompts/
│   └── mockup-prompt-*.md          ← KEEP in place (builder references these)
└── SOC2-ui-spec-USEFULL-branded.md ← source material for 03-styles.md, then archive
```

## File-by-File Instructions

### `build/01-architecture.md`

**Source from:** `v4-implementation-plan.md` sections 1-6, `implementation-questions.md`, `plan-evaluation.md` schema gap callout

**Contains:**
- Purpose (1 paragraph — what Trust Hub is, why it exists, that it's a local POC)
- Tech stack table (Next.js, SQLite, Drizzle, Tailwind — POC column only, no production column)
- Complete schema reference — **every table with columns, types, nullability, and notes** in the same tabular format the v1 plan used for controls/requests/etc. This is the main deliverable of this file. Pull column definitions from:
  - v1 plan (`usefull-soc2-implementation-plan.md`) for: controls, criteria, control_criteria, evidence, control_evidence, requests, request_controls, request_evidence, comments, audit_log
  - v4 plan prose + the actual schema in `scripts/seed.ts` for: audits, control_snapshots, policies, policy_controls
  - The seed script's CREATE TABLE statements are the ground truth for column names and types
- Key scoping rules (audit-scoped vs global, one active audit, snapshot model)
- Core constraints (closed audit = read-only, evidence auto-link behavior, policy relationship types)
- API routes list from v4 plan section 8
- Application directory structure from v1 plan

**Does NOT contain:** build order, acceptance tests, history, migration path, out-of-scope list, UI anything

### `build/02-pages.md`

**Source from:** `v4-implementation-plan.md` section 7, `v4-ui-decisions.md`, all 6 `mockup-prompts/mockup-prompt-*.md` files

**Contains:**
- Final page map (10 pages, with routes)
- Sidebar navigation order: Dashboard, Controls, Requests, Criteria, Policies, Evidence, Audits
- For each page, a self-contained section with:
  - Route
  - Scope (audit-scoped or global)
  - Purpose (1 sentence)
  - Columns/layout (table structure, card layout, etc.)
  - Interactive behavior (filters, sort, search, actions)
  - Key UX rules (e.g., "no upload on evidence page", "no pagination on controls")
  - Reference: which `mockup-prompts/mockup-prompt-*.md` file has the detailed visual spec (by filename, don't inline)
  - Reference: which HTML mockup in `mockups/` to use as aesthetic reference (by path)
- Closed-audit read-only behavior (what gets disabled, amber banner spec)
- Build order recommendation (from plan-evaluation.md: layout → controls → control detail → dashboard → requests → criteria → evidence → policies → audits)

**Does NOT contain:** CSS classes, color hex values, Tailwind tokens (that's 03-styles.md), schema details (that's 01), seed data details (that's 04)

### `build/03-styles.md`

**Source from:** `SOC2-ui-spec-USEFULL-branded.md` (primary), mockup prompt files (for specific component patterns)

**Contains:**
- Tailwind config (copy the exact `tailwind.config` block from any mockup-prompt file — they're all identical)
- Color system table (base palette + status colors + chip colors)
- Typography table
- Component patterns with Tailwind classes:
  - Status badges (by status value → exact classes)
  - Linked-entity chips (control chips, request chips, auditor-visible chips)
  - Policy relationship chips (fulfills, governs, requires_acknowledgement)
  - Table pattern (header, row, hover, cell padding, zebra striping)
  - Card pattern
  - Action buttons (primary, secondary, destructive)
  - Filter bar pattern
  - Sidebar pattern (with active/inactive states, exact icon names)
  - Breadcrumb pattern
  - Empty states
- Review date color logic (from policies mockup prompt: past=red, <30 days=amber, >30 days=green)
- File type icon mapping (from evidence mockup prompt: pdf→description/red, image→image/purple, xlsx/csv→table_view/green)
- The user avatar block pattern (OB initials, gradient, admin label)

**Does NOT contain:** page-specific layouts (that's 02), schema (that's 01), prose design philosophy (cut it — the classes speak for themselves)

### `build/04-seed-data.md`

**Source from:** `scripts/seed.ts` output, `plan-evaluation.md` evidence strategy section

**Contains:**
- How to run the seed script (`npx tsx scripts/seed.ts`)
- What it produces (the row-count table from the seed script output)
- Source files it reads and where they live
- Evidence strategy: metadata-only in DB, files exist locally at `seed-data/evidence/` paths, app should show file if present and graceful "not available" if not
- The one known data warning (REQ032 → CTL-051 skipped)
- Key data characteristics the builder should know:
  - All 54 requests belong to the 2025 (closed) audit — the 2026 audit has no requests yet
  - Evidence is linked to controls in the 2025 audit only — 2026 has no evidence links
  - Policy data is synthetic (not from Hyperproof) — realistic but not from export
  - Comments are synthetic across 3 requests
  - Control owners include email in parentheses (the app should display name only)

**Does NOT contain:** the seed pipeline plan, transformation rules, parser implementation details

## Execution Steps

1. Create `specs/build/` and `specs/archive/` directories
2. Move all files listed under "archive" into `specs/archive/`
3. Draft the 4 build files by pulling content from the sources listed above
4. For `01-architecture.md`: the schema tables are the critical part. Cross-reference `scripts/seed.ts` CREATE TABLE statements against the prose in the v1/v4 plans. The seed script is ground truth for column names — the prose in older plans may use slightly different names.
5. For `02-pages.md`: don't reproduce the mockup prompts inline — reference them by filename. The builder will read them separately. This file is the index/overview.
6. For `03-styles.md`: this is primarily a reorganization of `SOC2-ui-spec-USEFULL-branded.md` with the concrete Tailwind classes from the mockup prompts added. Strip the design philosophy prose. Keep the tables and code blocks.
7. For `04-seed-data.md`: short file. Mostly facts and numbers.
8. Keep all `mockup-prompts/mockup-prompt-*.md` files in `specs/mockup-prompts/` (not in build/, not in archive/) — they're active references
9. Verify nothing was lost: every decision from `v4-implementation-plan.md` and `implementation-questions.md` should be represented in one of the 4 build files

## What NOT to Do

- Don't rewrite or editorialize the specs — just reorganize and consolidate
- Don't add new requirements or change any decisions
- Don't inline the full mockup prompt content into 02-pages.md — keep it as references
- Don't include the production migration path, future work, or out-of-scope lists — that's post-POC planning and doesn't belong in build instructions
- Don't delete anything — move to archive
