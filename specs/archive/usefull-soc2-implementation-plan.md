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
┌─────────────┐       ┌───────────────────┐       ┌──────────────┐
│   controls   │──M:N──│ control_criteria   │──M:N──│   criteria   │
└─────────────┘       └───────────────────┘       └──────────────┘
       │
       │ M:N
       ▼
┌──────────────────┐       ┌──────────────┐
│ control_evidence │──M:N──│   evidence   │
└──────────────────┘       └──────────────┘
       ▲                          ▲
       │                          │
┌──────────────────┐       ┌──────────────────┐
│    requests      │──M:N──│ request_evidence │
└──────────────────┘       └──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│    comments      │
└──────────────────┘
```

### Table Definitions

**Key design decision:** When evidence is uploaded to a request, it is ALSO linked to the request's associated control(s). This eliminates the Hyperproof problem where evidence uploaded to work items wasn't discoverable from the control view.

#### `controls`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "CTL-001" |
| name | TEXT NOT NULL | e.g. "Employee Onboarding" |
| description | TEXT | Control language |
| implementation_status | TEXT | "Not started" \| "In progress" \| "Completed" |
| testing_status | TEXT | "Not tested" \| "In progress" \| "Effective" |
| automation_status | TEXT | "Not started" (all currently) |
| owner | TEXT | Name + email |
| freshness_date | TEXT | ISO date, nullable |
| notes | TEXT | |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

#### `criteria`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "CC1.1" |
| name | TEXT NOT NULL | Full COSO principle name |
| category | TEXT | "Common Criteria" \| "Availability" \| "Confidentiality" |

Seed with all 38 SOC 2 trust service criteria used by USEFULL: CC1.1–CC1.5, CC2.1–CC2.3, CC3.1–CC3.4, CC4.1–CC4.2, CC5.1–CC5.3, CC6.1–CC6.8, CC7.1–CC7.5, CC8.1, CC9.1–CC9.2, A1.1–A1.3, C1.1–C1.2.

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
| version | INTEGER DEFAULT 1 | Increment on re-upload |

#### `control_evidence` (join table)
| Column | Type |
|--------|------|
| control_id | TEXT FK → controls.id |
| evidence_id | INTEGER FK → evidence.id |
| PK | (control_id, evidence_id) |

#### `requests`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. "REQ001" |
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
| action | TEXT NOT NULL | "evidence_uploaded" \| "control_updated" \| "request_status_changed" etc. |
| resource_type | TEXT | "control" \| "evidence" \| "request" \| "comment" |
| resource_id | TEXT | |
| metadata | TEXT | JSON blob with change details |

**No UPDATE or DELETE operations should ever be performed on the `audit_log` table.**

---

## Seed Data

### Controls
Import all 88 controls from the Hyperproof export. The export file is included in the repo at `./seed-data/Hyperproof-export-20260225T025221Z.xlsx`.

Write a seed script (`scripts/seed.ts`) that:
1. Reads the XLSX file using the `xlsx` npm package
2. Parses the "Controls" sheet (row 1 is headers, data starts row 2)
3. Column mapping:
   - B: `id` (e.g. "CTL-001")
   - E: `name`
   - F: `description`
   - G: `implementation_status`
   - H: `testing_status`
   - I: `freshness_date` (parse from "Fresh until M/D/YYYY" or "Expired X days ago" — store as ISO date or null)
   - J: `automation_status`
   - K: proof count (informational only)
   - N: `requirement_links` — parse this to populate `control_criteria` join table
   - O: `owner`
   - R: `notes`
   - S: `created_at`
   - T: `updated_at`
4. For requirement links: split on ": " to separate the framework name from criteria, then split criteria on ", " to get individual criteria IDs. Insert into `control_criteria`.

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
- Create an `./evidence/.gitkeep` file and add a note in README that actual evidence files should be added locally

---

## Application Structure

```
usefull-compliance/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with sidebar nav
│   │   ├── page.tsx                # Dashboard / overview
│   │   ├── controls/
│   │   │   ├── page.tsx            # Control list (main table view)
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Control detail
│   │   ├── requests/
│   │   │   ├── page.tsx            # Request list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Request detail
│   │   ├── criteria/
│   │   │   └── page.tsx            # Criteria coverage matrix
│   │   └── api/
│   │       ├── controls/
│   │       │   └── route.ts        # CRUD for controls
│   │       ├── requests/
│   │       │   └── route.ts        # CRUD for requests
│   │       ├── evidence/
│   │       │   └── route.ts        # Upload + link evidence
│   │       └── comments/
│   │           └── route.ts        # Add comments to requests
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema definitions
│   │   ├── index.ts                # DB connection (SQLite)
│   │   └── migrations/             # Drizzle migrations
│   ├── components/
│   │   ├── Sidebar.tsx             # Left nav
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

### 1. Dashboard (`/`)

A summary overview showing:
- Total controls: 88
- Controls by implementation status (pie or bar): Not started / In progress / Completed
- Controls by testing status: Not tested / In progress / Effective
- Evidence coverage: X controls with evidence, Y without (highlight gaps)
- Open requests count, broken down by status
- Controls with expired freshness (flag these prominently)

### 2. Controls List (`/controls`)

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

### 3. Control Detail (`/controls/[id]`)

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

### 4. Requests List (`/requests`)

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

### 5. Request Detail (`/requests/[id]`)

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

### 6. Criteria Coverage Matrix (`/criteria`)

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
7. Verify: `SELECT COUNT(*) FROM controls` returns 88, `SELECT COUNT(*) FROM control_criteria` returns ~220

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
