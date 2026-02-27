# Spec History and Change Log

## Purpose
This file is a reviewer guide for all `.md` files in `specs/`. It explains:
- Which document introduced which decisions
- What changed between versions
- Which files are canonical for implementation
- How to interpret mockups (origin, strengths, and limits)

## Current Canonical Set (Build From These)
- `v4-implementation-plan.md`
- `v4-ui-decisions.md`
- `implementation-questions.md`

Supporting reference (visual system only):
- `SOC2-ui-spec-USEFULL-branded.md`

Legacy history (do not treat as final authority):
- `usefull-soc2-implementation-plan.md`
- `v2-implementation-plan-with-audit-scoping.md`
- `v2-UI spec with audit scoping.md`
- `v3-implementation-plan-with-policies.md`
- `v3-UI spec with policies.md`

## High-Level Evolution

### v1 Baseline
Files:
- `usefull-soc2-implementation-plan.md`
- `SOC2-ui-spec-USEFULL-branded.md`

What it established:
- Core SOC2 app scope: dashboard, controls, requests, criteria
- Initial schema (`controls`, `criteria`, `evidence`, `requests`, join tables, `comments`)
- Critical rule: request-uploaded evidence must also appear on linked controls
- Branded visual system (USEFULL colors, badge semantics, table patterns)

Limitations discovered later:
- No explicit multi-audit scoping model for historical fidelity across years
- No policy module
- No direct evidence library page

### v2 Audit-Scoped Expansion
Files:
- `v2-implementation-plan-with-audit-scoping.md`
- `v2-UI spec with audit scoping.md`

Major changes from v1:
- Added `audits` and `control_snapshots`
- Shifted controls from in-place editing to per-audit snapshot model
- Added one-active-audit rule, close/start workflow, and closed-audit read-only behavior
- Scoped request and control evidence linkage by audit
- Added audit switcher/read-only banner UI expectations

Net effect:
- Solved annual audit separation and historical immutability needs
- Introduced lifecycle complexity and audit-context requirements across pages/routes

### v3 Policy Expansion
Files:
- `v3-implementation-plan-with-policies.md`
- `v3-UI spec with policies.md`

Major changes from v2:
- Added policies domain (`policies`, `policy_controls`)
- Added policy pages (`/policies`, `/policies/[id]`) and policy relationships on controls
- Added relationship semantics: `fulfills`, `governs`, `requires_acknowledgement`

Important inconsistency in v3 drafts:
- Some prose implied policy linkage could be audit-scoped, but table design used global `policy_controls` (no `audit_id`).
- Later decisions resolved this: policy linkage is global; audit scoping remains in evidence linkage.

### v4 Consolidation and Scope Lock
Files:
- `implementation-questions.md`
- `v4-implementation-plan.md`
- `v4-ui-decisions.md`

Major changes from v3:
- Formal precedence and conflict resolution rules
- Explicit final v1 page map includes `/evidence` and `/audits`
- Dedicated `/audits` page for lifecycle actions (not hidden in switcher)
- Policies and `policy_controls` locked as global (not audit-scoped)
- Evidence library locked as read/search/sort/relink, no upload
- Controls list locked to include Criteria count and no pagination
- Vendors/Settings removed from v1
- Criteria page retained despite lack of mockup

Net effect:
- Decision-complete scope for implementation
- Contradictions from earlier drafts normalized

## Per-File Summary

### `SOC2-ui-spec-USEFULL-branded.md`
Role:
- Base branded UI language and component system.
Use it for:
- Tokens, badge colors, table/card/button patterns, density, interaction expectations.
Do not use it for:
- Final feature scope where later v4 docs override behavior.

### `usefull-soc2-implementation-plan.md`
Role:
- Original implementation baseline.
Key value:
- Defines initial architecture and core workflows.
Status:
- Historical; superseded by v4 for final behavior.

### `v2-implementation-plan-with-audit-scoping.md`
Role:
- Introduces audit lifecycle and snapshot architecture.
Key value:
- Core audit model adopted into v4.
Status:
- Historical source for audit mechanics; superseded by v4 for final scope details.

### `v2-UI spec with audit scoping.md`
Role:
- UI guidance for audit switcher/read-only mode.
Status:
- Historical UI variant; use v4 + branded UI spec for final implementation.

### `v3-implementation-plan-with-policies.md`
Role:
- Adds policy domain and pages.
Key value:
- Policy entity and relationship model adopted into v4.
Caveat:
- Contains internal prose/table mismatch about policy link audit scoping; resolved in v4.

### `v3-UI spec with policies.md`
Role:
- UI guidance for policies pages and control policy tab patterns.
Status:
- Useful for patterns; not authoritative where conflicts with v4 decisions.

### `implementation-questions.md`
Role:
- Decision log from reconciliation work.
Key value:
- Explicitly records resolved discrepancies and risks.
Status:
- Canonical decision ledger for v4.

### `v4-implementation-plan.md`
Role:
- Canonical behavior/spec for build.
Key value:
- Final data model, routes, lifecycle behavior, acceptance criteria, and out-of-scope lock.
Status:
- Primary source of truth for implementation.

### `v4-ui-decisions.md`
Role:
- Compact UI addendum for deltas and exclusions.
Key value:
- Clarifies what was accepted from mockups and what was explicitly excluded.
Status:
- Canonical UI decision companion to v4 implementation plan.

## Mockups: Origin and How to Use Them

## Origin
Mockups in `mockups/` were generated by Google Stitch from ChatGPT-produced screen descriptions derived from:
- Existing Hyperproof content/screens
- Earlier planning documents

Included artifacts:
- HTML and PNG for:
  - Dashboard
  - Controls Library
  - Control Detail
  - Request Detail

## Nature of Mockups
- They are **reference renderings**, not source-of-truth product specs.
- They are **not exhaustive** (for example, no Criteria Matrix mockup).
- They may include legacy or extra modules not in final scope (`Vendors`, `Settings`, certain nav variants).
- They may include mixed design-system traits from iterative prompt generations.

## What Should Be Considered
- Non-functional UX/aesthetic ideas:
  - visual density
  - card/table composition
  - hierarchy and scanability
  - layout rhythm
- Useful interaction affordances that do not contradict locked scope.

## What Should Not Be Considered Authoritative
- High-level feature scope decisions when they conflict with v4 plan.
- Extra modules/pages that were not promoted into v4.
- Table/pagination/nav details that contradict resolved decisions.

## Conflict Resolution Rule (Final)
When mockups and plan disagree:
1. `v4-implementation-plan.md` controls feature behavior and scope.
2. `v4-ui-decisions.md` controls accepted/rejected UI deltas.
3. `SOC2-ui-spec-USEFULL-branded.md` controls visual tokens/components.
4. Mockups are tertiary references only.

## Reviewer Quick Start (for Claude)
1. Read `v4-implementation-plan.md` first.
2. Read `v4-ui-decisions.md` second.
3. Read `implementation-questions.md` for rationale/risk context.
4. Use `SOC2-ui-spec-USEFULL-branded.md` for concrete styling implementation.
5. Treat all v1/v2/v3 plan/UI docs and mockups as historical context, not as current authority.
