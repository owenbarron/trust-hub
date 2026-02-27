# V4 UI Decisions Addendum

## 1) Source of Truth
- Visual system source: `SOC2-ui-spec-USEFULL-branded.md`
- Feature behavior source: `v4-implementation-plan.md`
- Mockups are references, not canonical requirements.

## 2) Core Visual Tokens and Patterns

### Colors
- Use branded neutral + teal system from branded UI spec.
- Status badges keep semantic mapping:
  - green: completed/effective/closed
  - amber: in progress/submitted
  - gray: not started/not tested
  - red: expired/needs revision/high priority
  - cyan/sky: informational/open/auditor-visible

### Typography
- Use the system sans stack defined by branded UI spec.
- Keep dense enterprise table readability and compact metadata sizing.

### Components
- Sidebar with active indicator and compact nav density.
- Compact status badges with no semantic outlines.
- Shared table pattern for controls, requests, policies, and evidence.
- Shared card pattern for detail panels.
- Consistent teal action buttons and link styles.
- Consistent keyboard focus ring behavior.

## 3) Accepted UX Deltas from Mockups
- Add dedicated `/evidence` nav/page in v1.
- Keep `/audits` as a dedicated management page for lifecycle actions.
- Keep assignee visible in request list/detail.
- Keep high-density information layout from mockups where consistent with branded spec.

## 4) Resolved UI Normalization Decisions
- Controls list does not paginate in v1.
- Controls list includes `Criteria` count and tooltip behavior.
- Control detail tabs are: `Details | Criteria | Policies | Evidence | Requests`.
- Criteria matrix remains required despite no mockup.
- Closed-audit mode visually communicates read-only state and disables mutation actions.
- Evidence library is find-and-fix focused (search/sort/link), not upload focused.

## 5) Page-Level UI Notes

### `/audits`
- Show audit history table with status, period, and closed date.
- Lifecycle actions use explicit confirmation modals with consequence copy.

### `/evidence`
- Default sort: most recent first.
- Show `Linked to` chips for controls and requests.
- Provide `Link to control` row action only when selected audit is active.

### `/policies` and `/policies/[id]`
- Policies are shown as living docs (global scope).
- Relationship grouping labels are required:
  - fulfills
  - governs
  - requires acknowledgement

## 6) Explicit Exclusions for V1 UI
- No Vendors module.
- No Settings module.
- No dark mode requirement.
- No mobile-first optimization beyond basic desktop compatibility.
- No advanced timeline/activity feed replacing comments.

## 7) QA UI Checklist
- Navigation set exactly: Dashboard, Controls, Requests, Criteria, Policies, Evidence, Audits.
- Read-only closed-audit state is obvious and enforced in UI affordances.
- Table density and badge semantics match branded UI spec.
- No pagination appears on controls table.
- Criteria matrix page is present and accessible from control criteria links.
