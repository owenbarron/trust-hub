# USEFULL SOC 2 Compliance System — Implementation Plan

## Purpose

This document is an implementation plan for a coding agent (Codex, Claude Code) to build a lightweight, local proof-of-concept compliance management system for USEFULL. The goal is to demonstrate that a custom-built tool can replace Hyperproof ($5–10k/year) for managing USEFULL's SOC 2 program.

**This is a local POC, not a production system.** It runs on localhost with SQLite. There is no authentication, no cloud storage, and no deployment. The architecture is designed so that it can later be migrated to GCP/Firebase (see Migration Path section at the end).

---

## Tech Stack

| Layer | POC | Future Production |
|-------|-----|-------------------|
| Framework | Next.js 14+ (App Router) | Same |
| Database | SQLite via `better-sqlite3` | Cloud SQL (Postgres) or Firestore |
| ORM | Drizzle ORM | Same (swap driver) |
| File storage | Local `./evidence` directory | GCS private bucket w/ presigned URLs |
| Auth | None | Firebase Auth |
| Hosting | `npm run dev` on localhost | Cloud Run + Firebase Hosting |

**Why these choices:**
- **Drizzle ORM**: Type-safe, lightweight, works with SQLite now and Postgres later with a one-line driver swap. No heavy migration tooling.
- **SQLite**: Zero config, ships in the repo, anyone who clones can see real data immediately.
- **Next.js App Router**: Server components reduce client complexity. API routes co-located with pages.

---

## Data Model

### Schema Overview

```
┌──────────────┐
│    audits     │ (one active at a time)
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────────┐       ┌──────────────┐       ┌──────────────┐
│control_snapshots │──N:1──│   controls   │──M:N──│   criteria   │
│ (per-audit state)│       │  (master ID) │       │              │
└──────────────────┘       └──────────────┘       └──────────────┘
                                  │
                                  │ (via audit-scoped join)
                                  ▼
                           ┌──────────────┐
                           │   evidence   │ (immutable files)
                           └──────────────┘
                                  ▲
       ┌──────────────────┐       │
       │    requests      │──M:N──┘
       │  (audit-scoped)  │
       └──────┬───────────┘
              │ 1:N
              ▼
       ┌──────────────────┐
       │    comments      │
       └──────────────────┘
```

### Table Definitions

**Key design decisions:**
1. **Audit-scoped snapshots.** Controls are not edited in place. Instead, each audit period gets a frozen snapshot of every control. When you close the 2025 audit, those snapshots become read-only. When you start the 2026 audit, the system copies every control's current state into new editable snapshots. This means you can always look back at exactly what a control said during a previous audit, what evidence was linked, and what its status was — without wading through a granular version history.
2. **Evidence auto-linking.** When evidence is uploaded to a request, it is ALSO linked to the request's associated control(s) within the current audit. This eliminates the Hyperproof problem where evidence uploaded to work items wasn't discoverable from the control view.

#### `audits`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "2025-soc2-type2" |
| name | TEXT NOT NULL | e.g. "2025 SOC 2 Type II" |
| status | TEXT NOT NULL | "active" \| "closed" |
| period_start | TEXT | ISO date — start of observation period |
| period_end | TEXT | ISO date — end of observation period |
| auditor_firm | TEXT | e.g. "BARR Advisory" |
| created_at | TEXT | ISO timestamp |
| closed_at | TEXT | ISO timestamp, nullable — set when status → closed |

Only ONE audit should have `status = "active"` at a time. The app should enforce this.

**Workflow:**
1. "Close audit" → sets `status = "closed"` and `closed_at` on the current audit. All associated snapshots become read-only.
2. "Start new audit" → creates a new audit row with `status = "active"`, then copies every control snapshot from the previous audit into new snapshots linked to the new audit. The new snapshots are editable. Evidence links are NOT copied (the new audit starts fresh for evidence, though the same evidence files can be re-linked if still relevant).

#### `controls`
This is the **canonical/master** definition of a control. It stores the control ID and any fields that never change between audits (currently just the ID). The per-audit state lives in `control_snapshots`.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "CTL-001" — stable across all audits |
| created_at | TEXT | ISO timestamp |

#### `control_snapshots`
This is where the real data lives. Each row represents a control's state within a specific audit.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| control_id | TEXT FK → controls.id | e.g. "CTL-001" |
| audit_id | TEXT FK → audits.id | Which audit this snapshot belongs to |
| name | TEXT NOT NULL | e.g. "Employee Onboarding" |
| description | TEXT | Control language |
| implementation_status | TEXT | "Not started" \| "In progress" \| "Completed" |
| testing_status | TEXT | "Not tested" \| "In progress" \| "Effective" |
| automation_status | TEXT | "Not started" (all currently) |
| owner | TEXT | Name + email |
| freshness_date | TEXT | ISO date, nullable |
| notes | TEXT | |
| created_at | TEXT | ISO timestamp (when this snapshot was created) |
| updated_at | TEXT | ISO timestamp |
| UNIQUE | (control_id, audit_id) | One snapshot per control per audit |

**Read-only enforcement:** When the parent audit has `status = "closed"`, the application layer must reject any UPDATE operations on snapshots belonging to that audit. (No DB-level enforcement needed for POC — just check in the API route.)

#### `criteria`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "CC1.1" |
| name | TEXT NOT NULL | Full COSO principle name |
| category | TEXT | "Common Criteria" \| "Availability" \| "Confidentiality" |

Seed with all 38 SOC 2 trust service criteria used by USEFULL: CC1.1–CC1.5, CC2.1–CC2.3, CC3.1–CC3.4, CC4.1–CC4.2, CC5.1–CC5.3, CC6.1–CC6.8, CC7.1–CC7.5, CC8.1, CC9.1–CC9.2, A1.1–A1.3, C1.1–C1.2.

Criteria mappings are stable across audits (SOC 2 criteria don't change year-to-year), so this relationship lives on the master `controls` table, not on snapshots.

#### `control_criteria` (join table)
| Column | Type |
|--------|------|
| control_id | TEXT FK → controls.id |
| criteria_id | TEXT FK → criteria.id |
| PK | (control_id, criteria_id) |

#### `evidence`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| filename | TEXT NOT NULL | Original filename |
| file_path | TEXT NOT NULL | Path in `./evidence/` directory |
| file_type | TEXT | "pdf" \| "png" \| "jpg" \| "xlsx" \| "text" |
| description | TEXT | Optional description |
| uploaded_by | TEXT | Name of uploader |
| uploaded_at | TEXT | ISO timestamp |

Evidence files are immutable. If a newer version of a document is needed, upload a new evidence record. The old one remains linked to whatever audit it was uploaded for.

#### `control_evidence` (join table — audit-scoped)
| Column | Type | Notes |
|--------|------|-------|
| control_id | TEXT FK → controls.id | |
| evidence_id | INTEGER FK → evidence.id | |
| audit_id | TEXT FK → audits.id | Which audit this linkage belongs to |
| PK | (control_id, evidence_id, audit_id) | |

This is audit-scoped so that the 2025 audit shows the evidence that was relevant to 2025, and the 2026 audit accumulates its own evidence. The same evidence file CAN be linked to the same control in multiple audits if it's still valid.

#### `requests`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "REQ001" |
| audit_id | TEXT FK → audits.id | Which audit this request belongs to |
| internal_id | TEXT | e.g. "R-18" (Hyperproof internal ref) |
| reference | TEXT | e.g. "Follow Up - 01" |
| summary | TEXT NOT NULL | The request description |
| detail | TEXT | Extended description / auditor notes |
| status | TEXT | "Open" \| "In Progress" \| "Submitted to Auditor" \| "Needs Revision" \| "Closed" |
| priority | TEXT | "Low" \| "Medium" \| "High" |
| assignee | TEXT | |
| source | TEXT | e.g. "BARR Advisory 2025 SOC2 Type 2" |
| due_date | TEXT | ISO date, nullable |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

Requests are naturally scoped to an audit — they come from a specific auditor engagement.

#### `request_controls` (join table)
| Column | Type |
|--------|------|
| request_id | TEXT FK → requests.id |
| control_id | TEXT FK → controls.id |
| PK | (request_id, control_id) |

#### `request_evidence` (join table)
| Column | Type |
|--------|------|
| request_id | TEXT FK → requests.id |
| evidence_id | INTEGER FK → evidence.id |
| PK | (request_id, evidence_id) |

#### `comments`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| request_id | TEXT FK → requests.id | |
| author | TEXT NOT NULL | |
| body | TEXT NOT NULL | |
| visible_to_auditor | BOOLEAN DEFAULT false | |
| created_at | TEXT | ISO timestamp |

#### `audit_log` (append-only, for future production use)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| timestamp | TEXT NOT NULL | ISO timestamp |
| user | TEXT | |
| action | TEXT NOT NULL | "evidence_uploaded" \| "control_updated" \| "request_status_changed" \| "audit_closed" \| "audit_created" etc. |
| resource_type | TEXT | "control" \| "evidence" \| "request" \| "comment" \| "audit" |
| resource_id | TEXT | |
| metadata | TEXT | JSON blob with change details |

**No UPDATE or DELETE operations should ever be performed on the `audit_log` table.**

---

## Seed Data

### Audit
Seed a single closed audit representing the completed 2025 engagement, and an active audit for 2026:

```json
[
  { "id": "2025-soc2-type2", "name": "2025 SOC 2 Type II", "status": "closed", "period_start": "2025-01-01", "period_end": "2025-12-31", "auditor_firm": "BARR Advisory" },
  { "id": "2026-soc2-type2", "name": "2026 SOC 2 Type II", "status": "active", "period_start": "2026-01-01", "period_end": "2026-12-31", "auditor_firm": "BARR Advisory" }
]
```

### Controls
Import all 88 controls from the Hyperproof export. The export file is included in the repo at `./seed-data/Hyperproof-export-20260225T025221Z.xlsx`.

Write a seed script (`scripts/seed.ts`) that:
1. Creates both audit records
2. Reads the XLSX file using the `xlsx` npm package
3. Parses the "Controls" sheet (row 1 is headers, data starts row 2)
4. For each control:
   - Creates a master `controls` row (just the ID)
   - Creates a `control_snapshots` row for the **2025 closed audit** with the data as-is from the export (this is the historical record)
   - Creates a second `control_snapshots` row for the **2026 active audit** as a copy (this is the working version)
5. Column mapping:
   - B: `control_id` (e.g. "CTL-001")
   - E: `name`
   - F: `description`
   - G: `implementation_status`
   - H: `testing_status`
   - I: `freshness_date` (parse from "Fresh until M/D/YYYY" or "Expired X days ago" — store as ISO date or null)
   - J: `automation_status`
   - K: proof count (informational only)
   - N: `requirement_links` — parse this to populate `control_criteria` join table (on the master control, not the snapshot)
   - O: `owner`
   - R: `notes`
   - S: `created_at`
   - T: `updated_at`
6. For requirement links: split on ": " to separate the framework name from criteria, then split criteria on ", " to get individual criteria IDs. Insert into `control_criteria`.

### Criteria Reference Data
Seed the `criteria` table with the 38 SOC 2 criteria. Include the full AICPA names. A static JSON file (`./seed-data/soc2-criteria.json`) should contain entries like:

```json
[
  { "id": "CC1.1", "name": "COSO Principle 1: The entity demonstrates a commitment to integrity and ethical values", "category": "Common Criteria" },
  { "id": "CC1.2", "name": "COSO Principle 2: The board of directors demonstrates independence from management and exercises oversight", "category": "Common Criteria" },
  ...
  { "id": "A1.1", "name": "The entity maintains, monitors, and evaluates current processing capacity and use of system components", "category": "Availability" },
  ...
  { "id": "C1.1", "name": "The entity identifies and maintains confidential information", "category": "Confidentiality" }
]
```

The coding agent should look up the full AICPA SOC 2 (2017 Trust Services Criteria with Revised Points of Focus 2022) names for all 38 criteria and populate this file.

### Sample Requests
Seed 5–8 sample requests based on the Hyperproof work items visible in screenshots. These should demonstrate:
- A request linked to a single control (e.g. REQ001 → CTL-001)
- A request linked to multiple controls
- Requests in different statuses (Open, Submitted to Auditor, Needs Revision, Closed)
- A request with sample comments showing back-and-forth
- A follow-up request

### Sample Evidence
Since actual evidence files should NOT be in the repo (they contain sensitive infrastructure info), create placeholder evidence entries:
- For every control that has `proof_count > 0` in the export, create a corresponding evidence record with a descriptive filename (e.g., "USEFULL Onboarding Template.pdf" for CTL-001)
- Link these evidence records to the **2025 audit** via `control_evidence` (with `audit_id = "2025-soc2-type2"`)
- Do NOT link them to the 2026 audit — this simulates the real workflow where the new audit period starts with a clean evidence slate
- Create an `./evidence/.gitkeep` file and add a note in README that actual evidence files should be added locally

---

## Application Structure

```
usefull-compliance/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with sidebar nav + audit switcher
│   │   ├── page.tsx                # Dashboard / overview (scoped to active audit)
│   │   ├── audits/
│   │   │   └── page.tsx            # Audit list + create/close actions
│   │   ├── controls/
│   │   │   ├── page.tsx            # Control list (shows snapshots for selected audit)
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Control detail (snapshot for selected audit)
│   │   ├── requests/
│   │   │   ├── page.tsx            # Request list (scoped to selected audit)
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Request detail
│   │   ├── criteria/
│   │   │   └── page.tsx            # Criteria coverage matrix
│   │   └── api/
│   │       ├── audits/
│   │       │   └── route.ts        # Create, close, list audits
│   │       ├── controls/
│   │       │   └── route.ts        # CRUD for control snapshots (respects audit scope + locked status)
│   │       ├── requests/
│   │       │   └── route.ts        # CRUD for requests
│   │       ├── evidence/
│   │       │   └── route.ts        # Upload + link evidence (audit-scoped)
│   │       └── comments/
│   │           └── route.ts        # Add comments to requests
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema definitions
│   │   ├── index.ts                # DB connection (SQLite)
│   │   └── migrations/             # Drizzle migrations
│   ├── components/
│   │   ├── Sidebar.tsx             # Left nav
│   │   ├── AuditSwitcher.tsx       # Dropdown to switch between audits
│   │   ├── ReadOnlyBanner.tsx      # Warning banner when viewing a closed audit
│   │   ├── ControlTable.tsx        # Sortable/filterable control list
│   │   ├── ControlDetail.tsx       # Control detail with tabs
│   │   ├── EvidenceList.tsx        # Evidence items with download links
│   │   ├── RequestList.tsx         # Request list with status badges
│   │   ├── RequestDetail.tsx       # Request detail with comments
│   │   ├── CommentThread.tsx       # Comment display + input
│   │   ├── StatusBadge.tsx         # Colored status indicators
│   │   ├── CriteriaMatrix.tsx      # Grid view of criteria ↔ controls
│   │   └── StatsCard.tsx           # Dashboard metric cards
│   └── lib/
│       ├── types.ts                # TypeScript types
│       ├── audit-context.ts        # React context for selected audit
│       └── utils.ts                # Shared utilities
├── scripts/
│   └── seed.ts                     # Database seeder
├── seed-data/
│   ├── Hyperproof-export-20260225T025221Z.xlsx
│   └── soc2-criteria.json
├── evidence/                       # Local evidence file storage
│   └── .gitkeep
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── .gitignore                      # Include: *.db, evidence/*, .env
└── README.md
```

---

## Pages & Features

### 1. Global: Audit Switcher

All data-bearing pages (Controls, Requests, Dashboard, Criteria) are scoped to the **currently selected audit**. The audit switcher is a dropdown in the sidebar or page header area.

**Behavior:**
- Defaults to the active audit on page load
- Dropdown lists all audits (active first, then closed in reverse chronological order)
- Active audit shows a green dot; closed audits show a lock icon
- When a closed audit is selected, a **read-only banner** appears at the top of the content area: "You are viewing the 2025 SOC 2 Type II audit (closed). Controls and evidence are read-only." The banner should be a soft yellow/amber background (`bg-amber-50 border-amber-200 text-amber-800`) with a lock icon.
- When a closed audit is selected, all edit buttons, upload buttons, status dropdowns, and comment inputs should be hidden or disabled.

### 2. Dashboard (`/`)

A summary overview **scoped to the selected audit**, showing:
- Total controls: 88
- Controls by implementation status (pie or bar): Not started / In progress / Completed
- Controls by testing status: Not tested / In progress / Effective
- Evidence coverage: X controls with evidence, Y without (highlight gaps)
- Open requests count, broken down by status
- Controls with expired freshness (flag these prominently)

### 3. Controls List (`/controls`)

A table matching the Hyperproof controls view with columns:
- ID (sortable, links to detail)
- Name
- Implementation status (colored badge)
- Testing status (colored badge)
- Freshness (green if valid, red if expired, gray if unset)
- Evidence count
- Criteria count (hover to show which criteria)

Features:
- Filter by implementation status, testing status
- Search by name or ID
- Sort by any column
- Click row to navigate to detail

### 4. Control Detail (`/controls/[id]`)

Tabbed interface mirroring Hyperproof's layout:

**Details tab:**
- Control metadata: ID, name, description, owner, implementation status, testing status, freshness date, automation status, notes
- Editable fields (for POC: simple inline editing, no auth check)

**Criteria tab:**
- List of linked SOC 2 criteria with full names
- Each criteria is clickable → navigates to criteria matrix filtered to that criteria

**Evidence tab:**
- Table of linked evidence: filename, type, uploaded date, uploader, version
- File viewer/download for local files
- Upload button (POC: basic file input that copies to `./evidence/` and creates DB record)
- **Critical: shows ALL evidence for this control, whether it was uploaded directly or via a request**

**Requests tab:**
- List of requests linked to this control
- Status badge, reference, summary
- Click to navigate to request detail

### 5. Requests List (`/requests`)

A table/list view showing:
- Reference (e.g. "REQ001", "Follow Up - 01")
- Summary (truncated)
- Status (colored badge with dropdown to change)
- Linked controls (chips)
- Assignee
- Priority
- Due date

Features:
- Filter by status
- Search
- Sort by any column

### 6. Request Detail (`/requests/[id]`)

Split view similar to Hyperproof's work items:

**Left side:**
- Full request description and detail
- Linked controls (clickable)
- Evidence list with upload capability
- Status, priority, assignee, source, due date

**Right side / below:**
- Comment thread (chronological)
- Each comment shows author, timestamp, and whether it's visible to external auditors
- Comment input with "visible to auditor" checkbox

### 7. Criteria Coverage Matrix (`/criteria`)

A grid/table view showing:
- Rows: SOC 2 criteria (CC1.1, CC1.2, etc.)
- For each criteria: linked controls, and a visual indicator of coverage health
- Useful for identifying criteria with weak or missing control coverage
- Grouping by category (Common Criteria, Availability, Confidentiality)

---

## Build Order

Implement in this sequence. Each step should result in a working, viewable state.

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up Drizzle ORM with SQLite (`better-sqlite3`)
3. Define all tables in `schema.ts`
4. Run initial migration to create tables
5. Create the seed data files (`soc2-criteria.json`)
6. Write and run the seed script to populate controls, criteria, and mappings from the XLSX export
7. Verify: `SELECT COUNT(*) FROM controls` returns 88, `SELECT COUNT(*) FROM control_snapshots` returns 176 (88 × 2 audits), `SELECT COUNT(*) FROM control_criteria` returns ~220

### Phase 2: Core UI Shell
8. Create root layout with sidebar navigation (Controls, Requests, Criteria, Dashboard)
9. Build the Controls list page with a sortable table reading from SQLite
10. Build the Control detail page with tabs (Details, Criteria, Evidence, Requests)
11. Verify: can browse all 88 controls, see their descriptions, and see linked criteria

### Phase 3: Evidence & Requests
12. Build evidence upload (local file copy + DB record creation)
13. Build the auto-linking logic: when evidence is uploaded to a request, also insert into `control_evidence` for all controls linked to that request
14. Build the Requests list page
15. Build the Request detail page with comment thread
16. Seed sample requests and comments
17. Verify: can navigate from control → linked requests → evidence, and from request → linked controls

### Phase 4: Dashboard & Matrix
18. Build the dashboard with summary statistics
19. Build the criteria coverage matrix
20. Add freshness expiry highlighting (red badges for expired controls)
21. Final polish: loading states, empty states, error handling

---

## Styling Guidelines

Use Tailwind CSS. Refer to the companion document **`usefull-soc2-ui-spec.md`** for detailed UI design specifications. The high-level direction:

- Clean, professional, information-dense — this is an internal tool, not a marketing site
- Left sidebar navigation (collapsible)
- White/light gray backgrounds, blue accent color for interactive elements
- Status badges: green (effective/completed/closed), yellow (in progress), red (expired/needs revision), gray (not started/not tested)
- Tables should be compact with hover states
- The overall feel should be "polished internal tool" — think Linear, Notion, or Vercel dashboard

---

## Migration Path to GCP / Firebase

This section documents how the POC architecture maps to a production deployment. **Do not implement any of this in the POC** — this is a reference for the future migration.

### Database: SQLite → Cloud SQL (Postgres) or Firestore
- Drizzle ORM supports Postgres with a one-line driver swap: change `better-sqlite3` to `drizzle-orm/postgres-js`
- Run `drizzle-kit push` to create tables in Cloud SQL
- The seed script should work with minimal changes (parameterized queries are the same)
- Alternative: if the team prefers Firestore (already used in production app), the schema translates to collections. Controls and Requests become top-level collections; join tables become subcollections or array fields. This requires more refactoring than the Postgres path.

### File Storage: Local → GCS
- Replace local file copy with GCS upload using `@google-cloud/storage`
- Configure a private bucket with uniform bucket-level access (no public objects)
- Enable default encryption (Google-managed keys are fine)
- Generate signed URLs (expiry: 15 minutes) for file viewing/download
- Add a middleware layer that checks auth before generating signed URLs

### Auth: None → Firebase Auth
- Add Firebase Auth to the Next.js app
- Configure email/password + MFA
- Set up invitation-only registration (disable self-signup in Firebase Console)
- Create roles: `admin` (full access), `member` (read/write), `auditor` (read-only)
- Store roles in Firebase custom claims
- Add Next.js middleware to check auth + role on every API route and page
- Future: add SAML/OIDC for SSO via Firebase Auth or WorkOS

### Hosting: Localhost → Cloud Run + Firebase Hosting
- Containerize the Next.js app with a Dockerfile
- Deploy to Cloud Run in the `usefull-compliance` GCP project (separate from production)
- Use Firebase Hosting as CDN/reverse proxy in front of Cloud Run
- Configure Cloud Run to only accept traffic from Firebase Hosting (ingress settings)

### Audit Trail: POC table → Production hardening
- The `audit_log` table design carries over as-is
- Add application-level middleware to write audit entries on every mutating API call
- Periodically export audit logs to GCS as immutable backups
- Configure the DB user for the app with no DELETE permission on the audit_log table

### Security Checklist for Production
- [ ] GCP project `usefull-compliance` is fully isolated from production project
- [ ] No shared service accounts or IAM roles between projects
- [ ] Database not publicly accessible (Cloud SQL private IP or authorized networks only)
- [ ] GCS bucket has `allUsers` and `allAuthenticatedUsers` removed
- [ ] Firebase Auth has self-signup disabled
- [ ] Session timeout configured (e.g. 8 hours)
- [ ] All environment secrets in Secret Manager, not in code
- [ ] HTTPS enforced on all endpoints
- [ ] File upload validation (check MIME type server-side, reject executables)
- [ ] Automated daily database backups with point-in-time recovery enabled
- [ ] `evidence/` directory excluded from git (`.gitignore`)

---

## Out of Scope for POC

These are explicitly deferred and should NOT be built:
- Authentication / authorization
- Deployment / hosting
- Real file storage infrastructure
- Automated evidence collection / integrations
- Email notifications
- Multi-framework support (ISO 27001 etc.)
- Penetration testing or security hardening
- Audit log middleware (table exists for schema purposes, not actively written to)
- Version history / diffing on control edits
