# 01 Architecture

## Purpose
Trust Hub is a local SOC 2 compliance management proof of concept for USEFULL that replaces the core workflow from subscription GRC tooling with a lightweight, auditable system. It is intentionally scoped as a localhost POC (not production) with audit-scoped compliance operations, global policy management, and explicit lifecycle controls for closing and starting audits.

## Tech Stack (POC)

| Layer | POC Stack | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | UI and API routes in one codebase |
| Database | SQLite (`better-sqlite3`) | Local file DB for POC |
| ORM | Drizzle ORM | Schema/query layer |
| Styling | Tailwind CSS | Shared design tokens/components from branded spec |
| File storage | Local filesystem (`./evidence` / `seed-data/evidence`) | Evidence metadata in DB; files referenced by path |

## Complete Schema Reference
Ground truth for column names/types is `scripts/seed.ts` (`SCHEMA` DDL).

### `audits`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `TEXT` | No | Primary key |
| `name` | `TEXT` | No | Audit display name |
| `status` | `TEXT` | No | Check constraint: `active` or `closed` |
| `period_start` | `TEXT` | Yes | ISO date |
| `period_end` | `TEXT` | Yes | ISO date |
| `auditor_firm` | `TEXT` | Yes | Audit firm name |
| `closed_at` | `TEXT` | Yes | ISO date/datetime when audit was closed |
| `created_at` | `TEXT` | No | Default `datetime('now')` |
| `updated_at` | `TEXT` | No | Default `datetime('now')` |

### `controls`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `TEXT` | No | Primary key (stable control identity, e.g. `CTL-001`) |
| `name` | `TEXT` | No | Canonical control name |
| `description` | `TEXT` | Yes | Global control description |
| `domain` | `TEXT` | Yes | Control domain/category |
| `created_at` | `TEXT` | No | Default `datetime('now')` |
| `updated_at` | `TEXT` | No | Default `datetime('now')` |

### `control_snapshots`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | Primary key, autoincrement |
| `control_id` | `TEXT` | No | FK to `controls.id` |
| `audit_id` | `TEXT` | No | FK to `audits.id` |
| `name` | `TEXT` | No | Snapshot copy of control name |
| `description` | `TEXT` | Yes | Snapshot copy of control description |
| `implementation_status` | `TEXT` | Yes | Default `Not started` |
| `testing_status` | `TEXT` | Yes | Default `Not tested` |
| `automation_status` | `TEXT` | Yes | Default `Not started` |
| `owner` | `TEXT` | Yes | Stored as source owner string (often `Name (email)`) |
| `freshness_date` | `TEXT` | Yes | ISO date |
| `notes` | `TEXT` | Yes | Snapshot notes |
| `created_at` | `TEXT` | No | Default `datetime('now')` |
| `updated_at` | `TEXT` | No | Default `datetime('now')` |

Constraints:
- Unique key: `UNIQUE(control_id, audit_id)`

### `criteria`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `TEXT` | No | Primary key (e.g. `CC1.1`, `A1.1`, `C1.1`) |
| `name` | `TEXT` | No | Criteria title/statement |
| `category` | `TEXT` | Yes | Top-level grouping |
| `subcategory` | `TEXT` | Yes | Sub-grouping |

### `control_criteria`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `control_id` | `TEXT` | No | FK to `controls.id` |
| `criteria_id` | `TEXT` | No | FK to `criteria.id` |

Constraints:
- Composite primary key: `(control_id, criteria_id)`

### `policies`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | Primary key, autoincrement |
| `name` | `TEXT` | No | Policy name |
| `description` | `TEXT` | Yes | Policy summary |
| `version` | `TEXT` | Yes | Version string |
| `owner` | `TEXT` | Yes | Policy owner |
| `file_path` | `TEXT` | Yes | Path to policy document |
| `review_date` | `TEXT` | Yes | Next review date |
| `created_at` | `TEXT` | No | Default `datetime('now')` |
| `updated_at` | `TEXT` | No | Default `datetime('now')` |

### `policy_controls`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `policy_id` | `INTEGER` | No | FK to `policies.id` |
| `control_id` | `TEXT` | No | FK to `controls.id` |
| `relationship_type` | `TEXT` | No | Check constraint: `fulfills`, `governs`, `requires_acknowledgement` |

Constraints:
- Composite primary key: `(policy_id, control_id)`

### `evidence`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | Primary key, autoincrement |
| `filename` | `TEXT` | No | Evidence filename |
| `file_path` | `TEXT` | No | Local file path |
| `file_type` | `TEXT` | Yes | Derived extension/type |
| `file_size` | `INTEGER` | Yes | File size in bytes |
| `description` | `TEXT` | Yes | Optional description |
| `uploaded_by` | `TEXT` | Yes | Uploader name |
| `uploaded_at` | `TEXT` | No | Default `datetime('now')` |

### `control_evidence`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `control_id` | `TEXT` | No | FK to `controls.id` |
| `evidence_id` | `INTEGER` | No | FK to `evidence.id` |
| `audit_id` | `TEXT` | No | FK to `audits.id`; makes linkage audit-scoped |

Constraints:
- Composite primary key: `(control_id, evidence_id, audit_id)`

### `requests`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `TEXT` | No | Primary key (request reference, e.g. `REQ001`) |
| `audit_id` | `TEXT` | No | FK to `audits.id` |
| `hyperproof_id` | `TEXT` | Yes | External/internal Hyperproof ID |
| `summary` | `TEXT` | No | Request summary |
| `description` | `TEXT` | Yes | Request description/detail |
| `status` | `TEXT` | Yes | Default `Open` |
| `priority` | `TEXT` | Yes | Default `Medium` |
| `assignee` | `TEXT` | Yes | Assignee name |
| `source` | `TEXT` | Yes | Source descriptor |
| `due_date` | `TEXT` | Yes | ISO date |
| `created_at` | `TEXT` | No | Default `datetime('now')` |
| `updated_at` | `TEXT` | No | Default `datetime('now')` |

### `request_controls`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `request_id` | `TEXT` | No | FK to `requests.id` |
| `control_id` | `TEXT` | No | FK to `controls.id` |

Constraints:
- Composite primary key: `(request_id, control_id)`

### `request_evidence`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `request_id` | `TEXT` | No | FK to `requests.id` |
| `evidence_id` | `INTEGER` | No | FK to `evidence.id` |

Constraints:
- Composite primary key: `(request_id, evidence_id)`

### `comments`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | Primary key, autoincrement |
| `request_id` | `TEXT` | No | FK to `requests.id` |
| `author` | `TEXT` | No | Comment author |
| `body` | `TEXT` | No | Comment body |
| `visible_to_auditor` | `INTEGER` | Yes | Default `0` (false) |
| `created_at` | `TEXT` | No | Default `datetime('now')` |

### `audit_log`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | Primary key, autoincrement |
| `timestamp` | `TEXT` | No | Default `datetime('now')` |
| `user` | `TEXT` | Yes | Actor identifier |
| `action` | `TEXT` | No | Action name |
| `resource_type` | `TEXT` | Yes | Resource kind |
| `resource_id` | `TEXT` | Yes | Resource identifier |
| `metadata` | `TEXT` | Yes | JSON/string payload |

## Key Scoping Rules
- `controls` stores global stable control identity.
- Audit-specific mutable control state is in `control_snapshots` keyed by `(control_id, audit_id)`.
- Requests are audit-scoped through `requests.audit_id`.
- Control-evidence links are audit-scoped through `control_evidence.audit_id`.
- Policies are global (not audit-scoped).
- Policy-control links are global (`policy_controls` has no `audit_id`).
- Audit context drives all scoped pages (dashboard, controls, requests, criteria, evidence).

## Core Constraints
- Exactly one audit is active at a time (`audits.status = 'active'`).
- Closed audit mode is read-only in the app: no status changes, uploads, relinking, or comment posting.
- Evidence uploaded from request/control context is expected to appear in the selected audit context and in related views via linking.
- Policy relationship values are constrained to: `fulfills`, `governs`, `requires_acknowledgement`.
- Policy documents are referenced through `policies.file_path`; policy files are not auto-created as `evidence` rows.
- Acknowledgement heuristic in v1: a `requires_acknowledgement` control is treated as acknowledged when any evidence is linked to that control in the selected audit.

## API Routes (V1)
- `/api/audits`
  - `GET` list audits
  - `POST` create/start new audit from previous snapshots
  - `PATCH` close current audit
- `/api/controls`
  - `GET` list controls for selected audit (joined with snapshot and counts)
- `/api/controls/[id]`
  - `GET` control detail for selected audit
  - `PATCH` update snapshot fields (active audit only)
- `/api/requests`
  - CRUD scoped by `audit_id`
- `/api/requests/[id]`
  - Detail and status updates (active audit only)
- `/api/evidence`
  - `GET` evidence library for selected audit
  - `POST` upload/link evidence from control/request contexts
- `/api/evidence/relink-control`
  - `POST` add control link for selected audit (active audit only)
- `/api/policies`
  - CRUD for global policies
- `/api/policies/[id]`
  - Detail and updates
- `/api/comments`
  - Add comments to requests (active audit only)

## Application Directory Structure (V1 Reference)
```text
usefull-compliance/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── controls/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── requests/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── criteria/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── controls/
│   │       │   └── route.ts
│   │       ├── requests/
│   │       │   └── route.ts
│   │       ├── evidence/
│   │       │   └── route.ts
│   │       └── comments/
│   │           └── route.ts
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── migrations/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── ControlTable.tsx
│   │   ├── ControlDetail.tsx
│   │   ├── EvidenceList.tsx
│   │   ├── RequestList.tsx
│   │   ├── RequestDetail.tsx
│   │   ├── CommentThread.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── CriteriaMatrix.tsx
│   │   └── StatsCard.tsx
│   └── lib/
│       ├── types.ts
│       └── utils.ts
├── scripts/
│   └── seed.ts
├── seed-data/
├── evidence/
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```
