# 02 Pages

## Final Page Map

| Page | Route | Scope |
|---|---|---|
| Dashboard | `/` | Audit-scoped |
| Controls List | `/controls` | Audit-scoped |
| Control Detail | `/controls/[id]` | Audit-scoped snapshot + global relationships |
| Requests List | `/requests` | Audit-scoped |
| Request Detail | `/requests/[id]` | Audit-scoped |
| Criteria Matrix | `/criteria` | Audit-scoped status context + global criteria mappings |
| Policies List | `/policies` | Global |
| Policy Detail | `/policies/[id]` | Global policy data + audit-scoped control status context |
| Evidence Library | `/evidence` | Audit-scoped |
| Audits Management | `/audits` | Global lifecycle management |

## Sidebar Navigation Order
1. Dashboard
2. Controls
3. Requests
4. Criteria
5. Policies
6. Evidence
7. Audits

V1 excludes `Vendors` and `Settings` from navigation and page scope.

## Page Specs

### Dashboard
- Route: `/`
- Scope: Audit-scoped
- Purpose: Show audit-specific SOC 2 program health and immediate gaps.
- Columns/layout: Top summary stats (controls totals/status buckets, evidence coverage, open requests, freshness issues) plus an attention table for freshness/evidence gaps.
- Interactive behavior: Audit switcher controls dataset; linked rows navigate to control/request detail.
- Key UX rules: Values always represent the selected audit; show gap-focused items prominently.
- Visual prompt reference: `mockup-prompts/mockup-prompt-dashboard.md`
- HTML mockup reference: `mockups/Dashboard/dashboard.html`

### Controls List
- Route: `/controls`
- Scope: Audit-scoped
- Purpose: Primary controls operating view for scanning and triage.
- Columns/layout: `ID`, `Name`, `Implementation`, `Testing`, `Freshness`, `Evidence count`, `Criteria count`.
- Interactive behavior: Filter by implementation/testing/has-evidence, search by ID/name, sortable columns.
- Key UX rules: No pagination in v1; criteria count/visibility is required.
- Visual prompt reference: `mockup-prompts/mockup-prompt-controls-library.md`
- HTML mockup reference: `mockups/Controls Library.md/controls-library.html`

### Control Detail
- Route: `/controls/[id]`
- Scope: Audit-scoped snapshot with global joins
- Purpose: Inspect one control across metadata, criteria, policies, evidence, and linked requests.
- Columns/layout: Header + tabbed detail layout.
- Interactive behavior: Tabs in exact order `Details | Criteria | Policies | Evidence | Requests`; details tab reads selected audit snapshot; criteria tab uses global mappings; policies tab uses global policy links; evidence/requests tabs show selected-audit links.
- Key UX rules: Evidence tab includes all control evidence in selected audit (including request-originated auto-links).
- Visual prompt reference: `mockup-prompts/mockup-prompt-control-detail.md`
- HTML mockup reference: `mockups/Control Details/control-detail.html`

### Requests List
- Route: `/requests`
- Scope: Audit-scoped
- Purpose: Manage and track auditor requests for the selected audit.
- Columns/layout: `Reference`, `Summary`, `Status`, `Linked Controls`, `Assignee`, `Priority`, `Evidence`.
- Interactive behavior: Status/priority/assignee filters, search by reference/summary, sortable columns.
- Key UX rules: Follow-up requests appear in the same table; assignee remains visible in list view.
- Visual prompt reference: `mockup-prompts/mockup-prompt-requests-list.md`
- HTML mockup reference: `mockups/Requests List/requests-list.html`

### Request Detail
- Route: `/requests/[id]`
- Scope: Audit-scoped (request’s audit)
- Purpose: Fulfill a single auditor request with evidence, status updates, and comments.
- Columns/layout: Request metadata + description, linked controls chips, evidence table, comments thread.
- Interactive behavior: Status update (active audits only), evidence upload from request context (active audits only), comment posting with visible-to-auditor flag (active audits only).
- Key UX rules: Uploaded request evidence should auto-link to request-linked controls in the same selected audit.
- Visual prompt reference: `mockup-prompts/mockup-prompt-request-detail.md`
- HTML mockup reference: `mockups/Request Details/Request Details.html`

### Criteria Matrix
- Route: `/criteria`
- Scope: Audit-scoped status context + global criteria links
- Purpose: Show SOC 2 criteria coverage and control effectiveness by criteria group.
- Columns/layout: Collapsible hierarchy by category/subcategory with criteria rows; expanded criteria shows linked-controls table with implementation/testing/evidence indicators.
- Interactive behavior: Category/coverage filters, search by criteria ID/description, expand/collapse criteria sections.
- Key UX rules: Page is required in v1 even though it started without legacy mockup coverage.
- Visual prompt reference: `mockup-prompts/mockup-prompt-criteria-matrix.md`
- HTML mockup reference: `mockups/Criteria Matrix/criteria-matrix.html`

### Policies List
- Route: `/policies`
- Scope: Global
- Purpose: Show organization policy register and policy-to-control relationship coverage.
- Columns/layout: `Policy Name`, `Description`, `Next Review`, `Linked Controls`, `Relationship Types`, `Document`.
- Interactive behavior: Filter by review status/relationship type, search by name/description, sort by review date/control count.
- Key UX rules: Policies are global (not audit-scoped); review date health indicator is required.
- Visual prompt reference: `mockup-prompts/mockup-prompt-policies-list.md`
- HTML mockup reference: `mockups/Policies List/policies-list.html`

### Policy Detail
- Route: `/policies/[id]`
- Scope: Global policy data + selected-audit control status context
- Purpose: Display one policy with linked controls grouped by relationship type.
- Columns/layout: Two-column layout with grouped relationship sections (`fulfills`, `governs`, `requires_acknowledgement`) and metadata sidebar.
- Interactive behavior: Expand/collapse relationship groups; control links navigate back to control detail.
- Key UX rules: Status badges come from selected audit snapshots; `requires_acknowledgement` rows surface acknowledgement state from evidence presence.
- Visual prompt reference: `mockup-prompts/mockup-prompt-policy-detail.md`
- HTML mockup reference: `mockups/Policy Detail/policy-detail.html`

### Evidence Library
- Route: `/evidence`
- Scope: Audit-scoped through `control_evidence.audit_id`
- Purpose: Canonical evidence index for search/sort/relink workflows.
- Columns/layout: `File Name`, `Type`, `Uploaded`, `Uploaded By`, `Linked To`, `Actions`.
- Interactive behavior: Default sort newest first, filter/search, per-row `Link to control` action (active audits only).
- Key UX rules: No upload action on this page; show control/request linked chips and surface missing control links.
- Visual prompt reference: `mockup-prompts/mockup-prompt-evidence-library.md`
- HTML mockup reference: `mockups/Evidence Library/evidence-library.html`

### Audits Management
- Route: `/audits`
- Scope: Global lifecycle management
- Purpose: Manage active/closed audit lifecycle and review history.
- Columns/layout: Active audit hero/action area + audit history table.
- Interactive behavior: `Close audit` and `Start new audit` actions with explicit confirmation UX and consequence copy.
- Key UX rules: Actions are workflow-significant and irreversible from a process perspective; buttons must be isolated from routine navigation actions.
- Visual prompt reference: `mockup-prompts/mockup-prompt-audits.md`
- HTML mockup reference: `mockups/Audits/audits.html`

## Closed-Audit Read-Only Behavior
When a closed audit is selected:
- Show a top amber read-only banner identifying the selected closed audit and closed date.
- Disable or hide all mutation affordances:
  - Control snapshot edits
  - Request status changes
  - Evidence uploads
  - Evidence relink actions
  - Comment submission
- Preserve navigation, filtering, sorting, search, and read-only inspection.

## Build Order Recommendation
From `plan-evaluation.md`:
1. Layout shell and audit context plumbing
2. Controls list
3. Control detail
4. Dashboard
5. Requests list and request detail
6. Criteria matrix
7. Evidence library
8. Policies list and policy detail
9. Audits lifecycle page
