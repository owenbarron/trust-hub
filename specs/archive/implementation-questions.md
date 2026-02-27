# Implementation Questions and Decisions (V4)

## Resolved Decisions
- Use audit-scoped `control_snapshots` for control state; `controls` remains a stable master ID table.
- Only one audit can be `active` at a time.
- Audit lifecycle actions (`Close audit`, `Start new audit`) live on a dedicated `/audits` page.
- Policies are global (not audit-scoped).
- `policy_controls` is global (no `audit_id`).
- Add full `/evidence` page in v1: read/search/sort list plus `Link to control` action.
- `/evidence` is read-only for closed audits.
- `/evidence` does not upload files; uploads occur from control/request contexts.
- Keep assignee on request records and request UI.
- Add `Policies` tab to control detail.
- Controls list includes `Criteria` count and does not include pagination in v1.
- Remove `Vendors` and `Settings` from v1 scope.
- Keep `/criteria` page in v1 even though no mockup exists.
- Styling authority: `SOC2-ui-spec-USEFULL-branded.md` for visual system; implementation plan for high-level feature behavior.
- Acknowledgement rule: for `requires_acknowledgement`, acknowledgement is treated as present when any evidence is linked to that control in the selected audit.
- Policy files are stored via `policies.file_path`; policy files are not auto-created as `evidence` rows.

## Resolved Low-Level Discrepancies
- Mockups contain extra modules/nav items (`Vendors`, `Settings`, legacy `Audits` variants). These are excluded unless explicitly promoted.
- Mockups and plan differ on some cosmetic structures (optional right-side health cards, decorative summary panels). These are non-blocking and optional.
- Controls-list mockup pagination is treated as a mockup-only pattern; v1 uses a full list with sorting/filtering/search.
- Controls-list `Criteria` column is restored as required by plan and UI spec.
- Criteria matrix has no mockup but remains a required page with collapsible grouped sections.
- Evidence direct navigation is promoted from mockup inconsistency into explicit v1 scope via `/evidence`.

## High-Impact Concerns
- Audit close/start actions are irreversible from a workflow standpoint (closed snapshots become read-only, new audit clones 88 snapshots).
- Closing/starting an audit requires strong confirmation UX and clear language to prevent accidental lifecycle transitions.
- Evidence relink must enforce selected-audit boundaries (`control_evidence.audit_id`) to prevent cross-audit data leakage.
- Evidence page should make missing/broken linkage visible (e.g., evidence linked to request but missing control linkage).
- Acknowledgement heuristic (`any linked evidence`) is intentionally simple for v1 and may be loosened semantically; future versions may require evidence typing.
- Global `policy_controls` means relationship semantics are stable across audits; historical nuance is represented by audit-scoped evidence, not per-audit relationship mappings.

## Open Questions
- None. Current v4 scope is decision-complete for implementation.
