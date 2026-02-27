# USEFULL SOC 2 Compliance System - V4 Canonical Implementation Plan

## 1) Purpose
This document is the canonical v4 implementation plan for the local SOC 2 POC. It supersedes conflicting guidance in prior drafts by locking decisions for:
- Audit scoping and lifecycle
- Policy management
- Evidence library/relink workflows
- Final v1 page scope and behavior

The goal remains unchanged: provide a local, auditable replacement for subscription compliance tooling with a clean migration path to production later.

## 2) Precedence Rules
When documents conflict, use this order:
1. This v4 implementation plan (feature behavior and data model)
2. `SOC2-ui-spec-USEFULL-branded.md` (visual tokens, components, style patterns)
3. Mockups in `mockups/` (aesthetic/UX reference only)

Mockups are non-exhaustive and may include deferred modules.

## 3) Scope (V1)

### Final Page Map
- `/` Dashboard
- `/controls`
- `/controls/[id]`
- `/requests`
- `/requests/[id]`
- `/criteria`
- `/policies`
- `/policies/[id]`
- `/evidence`
- `/audits`

### Explicitly Included
- Audit switcher context (active/closed audits)
- Close/start audit lifecycle flow on `/audits`
- Read-only behavior for closed audits
- Policy register + control links + policy detail
- Evidence library page scoped to selected audit
- Evidence relink-to-control action on evidence rows (active audits only)

### Explicitly Excluded (V1)
- Authentication/authorization
- Cloud deployment/storage/auth integrations
- Automated evidence collection
- Notifications
- Vendor module
- Settings module
- Multi-framework support beyond SOC 2

## 4) Tech Stack
- Next.js 14+ (App Router)
- SQLite + `better-sqlite3`
- Drizzle ORM
- Tailwind CSS
- Local file storage under `./evidence`

## 5) Data Model (Canonical)

## Tables
- `audits`
- `controls`
- `control_snapshots`
- `criteria`
- `control_criteria`
- `policies`
- `policy_controls`
- `evidence`
- `control_evidence` (audit-scoped join)
- `requests` (audit-scoped)
- `request_controls`
- `request_evidence`
- `comments`
- `audit_log` (schema only for POC; no active middleware requirement)

## Key Scoping Rules
- **Controls**: stable identity in `controls`, editable per-audit state in `control_snapshots`.
- **Requests**: belong to one audit via `requests.audit_id`.
- **Evidence linkage to controls**: audit-scoped via `control_evidence.audit_id`.
- **Policies**: global, not audit-scoped.
- **Policy-control links**: global (`policy_controls` has no `audit_id`).

## Core Constraints
- One and only one `audits.status = 'active'`.
- `control_snapshots` unique key: `(control_id, audit_id)`.
- `control_evidence` primary key: `(control_id, evidence_id, audit_id)`.
- Closed audits are read-only at application layer.

## Important Modeling Clarifications
- `policy_controls.relationship_type` values:
  - `fulfills`
  - `governs`
  - `requires_acknowledgement`
- Policy documents are stored in `policies.file_path`.
- Policy files are **not** automatically mirrored into `evidence` rows.
- Acknowledgement heuristic for v1:
  - For a `requires_acknowledgement` link, acknowledgement is considered present if **any** evidence is linked to that control in the selected audit.

## 6) Audit Lifecycle Behavior

## Switcher Behavior
- Audit switcher is global context.
- Default selection: active audit.
- Closed audits display lock indicator.

## Read-Only Behavior (Closed Audit Selected)
Disable or hide:
- Inline edits on controls/policies where context is audit-sensitive
- Evidence upload actions
- Request status changes
- Comment inputs/submission
- Evidence relink actions

Show top banner indicating closed-audit read-only mode.

## Lifecycle Actions (Dedicated `/audits` Page)
- `Close audit`
  - Sets selected active audit to `closed`
  - Sets `closed_at`
  - Makes all related snapshots operationally read-only
- `Start new audit`
  - Creates new audit with `active` status
  - Clones all control snapshots from prior active/last-closed audit
  - Does **not** copy audit-scoped control evidence links

## UX Safety Requirements
- Strong confirmation modal for both actions
- Confirmation copy must state consequences clearly
- Action buttons isolated from simple navigation controls

## 7) Page-Level Requirements

## Dashboard (`/`)
- Fully scoped to selected audit
- Stats: controls totals/statuses, evidence coverage, open requests, expired freshness
- Attention table for freshness/evidence gaps

## Controls List (`/controls`)
- Columns include: ID, Name, Implementation, Testing, Freshness, Evidence count, Criteria count
- Filters: implementation, testing, has evidence
- Search by ID/name
- Sortable columns
- **No pagination in v1**

## Control Detail (`/controls/[id]`)
Tabs in this order:
- `Details`
- `Criteria`
- `Policies`
- `Evidence`
- `Requests`

Behavior:
- Details uses selected audit snapshot
- Criteria uses global `control_criteria`
- Policies uses global `policy_controls` + policy metadata
- Evidence tab must include all control evidence for selected audit (including request-originated uploads via auto-link)
- Requests tab shows linked requests in selected audit

## Requests List (`/requests`)
- Scoped to selected audit
- Sort/filter/search
- Includes assignee and linked controls

## Request Detail (`/requests/[id]`)
- Scoped to request audit
- Shows request metadata including assignee
- Evidence upload supported in active audits
- Comment thread + visible-to-auditor flag
- Request status updates in active audits only

## Criteria Matrix (`/criteria`)
- Required even without mockup
- Group by category
- Collapsible criteria sections
- Coverage health indicators

## Policies List (`/policies`)
- Global page (not scoped by audit for data ownership)
- Shows policy metadata and linked-control counts
- Includes review-date overdue highlighting

## Policy Detail (`/policies/[id]`)
- Policy metadata + document link actions
- Linked controls grouped by relationship type
- Control status badges drawn from selected audit snapshot context

## Evidence Library (`/evidence`)
- Scoped to selected audit through `control_evidence.audit_id`
- Default sort: `uploaded_at DESC`
- Search + sort supported
- Columns: filename, file type icon, uploaded date, uploaded by, linked-to chips
- `Linked to` includes control and request references where available
- Per-row `Link to control` action (active audits only)
- No upload action on this page

## Audits (`/audits`)
- Table/history of audits and statuses
- Active/closed labels
- Close/start lifecycle actions with confirmation UX

## 8) API/Interface Contracts (V1)

## API Routes (Target)
- `/api/audits`
  - `GET`: list audits
  - `POST`: create/start new audit from previous snapshots
  - `PATCH`: close current audit
- `/api/controls`
  - `GET`: list controls for selected audit (joined with snapshot and counts)
- `/api/controls/[id]`
  - `GET`: control detail for selected audit
  - `PATCH`: update snapshot fields (active audit only)
- `/api/requests`
  - CRUD scoped by `audit_id`
- `/api/requests/[id]`
  - detail + status updates (active audit only)
- `/api/evidence`
  - `GET`: evidence library for selected audit
  - `POST`: upload/link evidence from control/request contexts
- `/api/evidence/relink-control`
  - `POST`: add control link for selected audit (active audit only)
- `/api/policies`
  - CRUD for global policies
- `/api/policies/[id]`
  - detail + updates
- `/api/comments`
  - add comments to requests (active audit only)

## Types/Contracts
- Global audit context type in UI (`selectedAuditId`, `isReadOnlyAudit`)
- Control detail tab contract includes `policies` payload
- Evidence row contract includes `linkedControls[]` and `linkedRequests[]`

## 9) Seed Data Requirements
- Seed two audits:
  - `2025-soc2-type2` (closed)
  - `2026-soc2-type2` (active)
- Seed 88 `controls` master rows
- Seed 176 `control_snapshots` rows (88 per audit)
- Seed 38 criteria + `control_criteria` mappings
- Seed 5-8 sample requests across statuses
- Seed sample comments
- Seed placeholder evidence linked to 2025 control links only
- Seed sample policies and `policy_controls` relationships

## 10) Build Order

### Phase 1: Foundation and Schema
1. Initialize app scaffold and DB stack.
2. Implement schema and migrations for all canonical tables.
3. Implement seed scripts and verify row counts.

### Phase 2: Audit Context and Core Shell
4. Build global layout/sidebar and audit switcher.
5. Implement read-only banner and disabled-state wiring.
6. Build `/audits` management page with confirmations.

### Phase 3: Controls, Criteria, Policies
7. Build `/controls` list and `/controls/[id]` tabs with `Policies` tab included.
8. Build `/criteria` matrix and criteria-link navigation.
9. Build `/policies` and `/policies/[id]`.

### Phase 4: Requests and Evidence
10. Build `/requests` and `/requests/[id]` with comments and status transitions.
11. Implement evidence upload auto-link behavior from request context.
12. Build `/evidence` library with relink action.

### Phase 5: Hardening and QA
13. Add loading/empty/error states.
14. Validate closed-audit protections across all mutation surfaces.
15. Run scenario-based acceptance tests.

## 11) Acceptance Test Matrix
1. Audit switching scopes dashboard/controls/requests/criteria/evidence correctly.
2. Closed audit blocks edits/uploads/status changes/comments/relinking.
3. Closing audit freezes snapshots; starting new audit clones snapshots and resets control-evidence links.
4. Request evidence upload auto-links to all linked controls in selected audit.
5. Evidence page shows linked entities and supports relink only in active audits.
6. Controls list includes criteria count and no pagination.
7. Policy list/detail operate globally, independent of audit ownership.
8. Policy relationship labels render correctly on control policies tab.
9. Acknowledgement indicator follows the chosen any-evidence heuristic.
10. Criteria matrix remains available and linked from controls.

## 12) Out of Scope (Reaffirmed)
- Auth and RBAC
- Cloud deployment
- Production hardening and security controls
- Real immutable audit log middleware implementation
- Vendor management module
- Settings module
