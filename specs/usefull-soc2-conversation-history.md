# USEFULL SOC 2 Compliance System — Conversation History & Decision Log

> This document captures the full context of the architectural planning conversation between Owen (USEFULL) and Claude. It should be provided to Claude Code / Codex so it understands the reasoning behind every decision in the implementation plan and UI spec.

---

## Project Origin & Business Case

Owen works at USEFULL, a reusable container company. They currently use Hyperproof ($5–10k/year) to manage their SOC 2 compliance program. Owen's thesis is that Hyperproof is essentially a content management system with a compliance label — they're only doing SOC 2, not leveraging automation, and all their controls are defined through text, PDF policies, and uploaded images. The built-in GRC tooling provides limited value given how customized everything is to USEFULL's specific circumstances.

**Key arguments in favor of building custom:**
- Hyperproof is a glorified document management system for their use case
- $5–10k/year is meaningful savings at USEFULL's stage
- Migration between GRC platforms (e.g., Hyperproof → Vanta) is overwhelmingly manual anyway — there's no standard interchange format, so you'd face the same pain migrating from a custom tool as from another vendor
- A custom system where you own the database directly might make future migration *easier* since you'd have full programmatic access to export scripts
- The tool is internal with ~3–5 users, so "vibe coding" is acceptable for the UI layer

**Key risks identified and mitigated:**
- **Auditor perception:** Auditors need to trust the system. Evidence integrity/timestamps and a clean read-only auditor experience are essential. Owen should ask his auditor directly if they'd be comfortable with a custom system.
- **Evidence integrity:** Need audit trails, version history on evidence, immutable timestamps. Solved via append-only `audit_log` table and immutable evidence records.
- **Bus factor:** If Owen leaves, someone inherits a custom system. Mitigated by clean architecture, good documentation, and standard tech stack.
- **Scope creep:** GRC platform value grows nonlinearly with integrations and multi-framework support. Custom system is positioned as a 1–2 year bridge.

## Strategy: Proof of Concept First

Rather than building the full production system immediately, Owen decided to build a **local proof of concept** that demonstrates the system works with USEFULL's real data. The POC:
- Runs on localhost with SQLite
- Has no auth, no cloud storage, no deployment
- Is seeded with real control data from a Hyperproof export
- Lives in a GitHub repo so the team can clone and see it
- Proves the concept before committing GCP infrastructure

The pitch to the team becomes: "Here's our entire SOC 2 program running in a local app I built in a few days. Here's the plan to make it production-ready on GCP. Here's the $5–10k/year we save."

## Production Path (Future, Not POC)

When the POC is validated, the production system will run on GCP in a **completely isolated project** (`usefull-compliance`) separate from USEFULL's production app. USEFULL already uses GCP and Firebase for their main product, so using the same billing account with a separate project saves on vendor accounts and leverages existing credits.

**Production stack:**
- Firebase Auth (instead of a third-party like Clerk — team already knows Firebase)
- Cloud Storage (GCS) with private buckets and presigned URLs
- Cloud SQL (Postgres) or Firestore for database
- Cloud Run + Firebase Hosting for the app

**Critical security principle:** The compliance project must have zero IAM crossover with the production project. No shared service accounts, no shared networking. Even if the compliance app is fully compromised, there's zero access to production infrastructure.

## Data Model Decisions

### Audit-Scoped Snapshots (Not Version History)

**Problem Owen raised:** "We might change a control between now (just wrapped up 2025 audit) and August (starting 2026 audit). I want to look back at what my control was last year. But I don't want a version history with 20 timestamps from minor tweaks."

**Solution:** Audit-scoped snapshots. When you "close" an audit, all control snapshots for that audit become read-only. When you "start" a new audit, the system copies every control's current state into new editable snapshots. You end up with exactly two clean versions — not twenty.

- `controls` table: thin master record, just the stable ID
- `control_snapshots` table: per-audit state (name, description, statuses, owner, etc.)
- `audits` table: one active at a time, with "active" / "closed" status
- Evidence linkages (`control_evidence`) are audit-scoped via a three-column join table (control_id, evidence_id, audit_id)
- Requests are naturally audit-scoped (they come from a specific auditor engagement)

### Policies as a First-Class Entity

**Problem Owen raised:** Policies sometimes directly fulfill controls ("Asset Management Policy exists"), sometimes govern controls that need separate evidence ("we follow Asset Management Policy"), and sometimes require acknowledgement evidence ("employees have read Asset Management Policy"). Policies are distinct from evidence.

**Solution:** A `policies` table and a `policy_controls` join table with a `relationship_type` column:
- `"fulfills"` — The policy document IS the evidence. The policy's existence satisfies the control.
- `"governs"` — The control references the policy but requires separate operational evidence.
- `"requires_acknowledgement"` — The control requires evidence that personnel read/signed the policy.

**Key decisions on policies:**
- **Policies are NOT audit-scoped.** They're living documents that persist across audits. The relationship type ("fulfills", "governs", "requires_acknowledgement") is structural, not temporal. If a policy is replaced, retire the old one and create a new one.
- **The `policy_controls` join table has NO `audit_id`.** This was flagged as an inconsistency in an earlier draft — the prose said audit-scoped but the table had no audit_id. Resolution: the table is correct, the prose was wrong. Policy-control relationships don't change between audits. What IS audit-scoped is the evidence proving compliance, which is already handled by `control_evidence.audit_id`.
- **Policy files live in the `policies` table only** (via `file_path`), NOT dual-recorded in the evidence table. A policy isn't "evidence" until it fulfills a control, and for those cases the UI surfaces the policy document on the control's evidence tab without duplicating the record.
- **Acknowledgement evidence detection uses simple evidence count** — if `control_evidence` has any rows for a control with a "requires_acknowledgement" policy in the current audit, it's satisfied. No explicit tags or manual booleans needed. If the count is zero, the UI flags it.
- **Policies get their own tab on Control Detail** — separate from Evidence, because policies and evidence are conceptually different (policy = the rule, evidence = proof you follow the rule). Mixing them would muddy the distinction.

### Evidence Model

**Key improvement over Hyperproof:** In Hyperproof, evidence uploaded to work items (requests) wasn't linked back to the control, creating situations where evidence existed but auditors couldn't find it. In the custom system, when evidence is uploaded to a request, it is ALSO linked to the request's associated control(s) within the current audit. One canonical evidence store, multiple navigation paths.

**Top-level `/evidence` page:** Added as a global index — a sortable, searchable table of all evidence scoped to the selected audit. Shows filename, type, upload date, uploader, and a "Linked to" column with chips for every control and request the evidence is connected to. Key use case: "I thought I uploaded that, where is it?" → go to evidence page, find it, see if it's linked correctly, fix linkages if needed. This page supports re-linking evidence to controls but NOT uploading — uploads happen from controls or requests where the linkage context is clear.

### Requests / Work Items

Requests model the auditor back-and-forth. They have:
- A reference ID and summary
- Status workflow: Open → In Progress → Submitted to Auditor → Needs Revision → Closed
- Links to one or more controls (many-to-many)
- Their own evidence uploads (which auto-link to associated controls)
- A comment thread with "visible to auditor" toggle
- Priority, assignee, source, due date
- They're naturally audit-scoped

These map to what Hyperproof calls "Work Items" — the requests tab with 54 items visible in Owen's screenshots.

## UI Decisions

### Audit Switcher & Read-Only Mode
- Dropdown in sidebar to switch between audits
- Defaults to active audit
- When viewing a closed audit: amber read-only banner at top, all edit/upload/comment controls hidden or disabled
- Active audit shows green dot, closed audits show lock icon

### Close/Start Audit Actions
- **Dedicated `/audits` page**, not buried in the switcher dropdown or a header button
- Closing an audit and starting a new one are significant, infrequent actions with real consequences (freezing 88 control snapshots, cloning them). They deserve their own page with an audit history table.

### Navigation Structure (Sidebar)
- Dashboard
- Controls
- Policies
- Evidence
- Requests
- Criteria Matrix
- Audits (bottom of nav or settings area)

### Control Detail Tabs
- Details (metadata)
- Criteria (linked SOC 2 trust service criteria)
- Policies (linked policies with relationship type labels)
- Evidence (all evidence for this control in the current audit)
- Requests (linked auditor requests)

### Design Direction
- "Linear meets Notion admin panel" — information-dense, professional, neutral
- Dark sidebar, white content area
- Status badges with semantic colors (green/yellow/red/gray/blue)
- Compact tables with hover states
- Lucide React icons
- Tailwind CSS
- System font stack

## Source Data from Hyperproof

Owen provided a Hyperproof XLSX export containing:
- **88 controls** with IDs CTL-001 through CTL-090 (CTL-051 and CTL-065 don't exist — gaps in numbering)
- **38 SOC 2 criteria** referenced across controls (CC1.1–CC9.2, A1.1–A1.3, C1.1–C1.2)
- **~220 control-criteria mappings** (avg 2.5 criteria per control, max 9, min 1)
- **3 implementation statuses:** Not started, In progress, Completed
- **3 testing statuses:** Not tested, In progress, Effective
- **All automation statuses:** "Not started" (no automations yet)
- **4 unique owners:** Owen Barron, Igor Belagorudsky, MJ Eldridge, Dan Chemnitz
- **64 controls with evidence** (proof count > 0), **24 without**
- **3 controls with notes**

Owen also provided screenshots showing:
- The Hyperproof control list view (88 controls table)
- CTL-001 detail view (Employee Onboarding) with metadata, health panel
- CTL-001 Links tab showing 5 linked SOC 2 requirements (CC1.1, CC1.4, CC1.5, CC6.1, CC6.2)
- CTL-001 Proof tab showing 1 uploaded PDF ("USEFULL Onboarding Template.pdf")
- The Requests/Work Items view showing 54 requests with references like "Follow Up - 01", "REQ001", etc.
- Request detail for REQ001 showing description, linked proof (3 items), linked control (CTL-001), assignee (Dan Chemnitz), source (BARR Advisory 2025 SOC2 Type 2)
- Comment thread showing back-and-forth between Sydney Buchel (auditor) and Dan Chemnitz, with status changes and "visible to external auditors" flags

## What's Out of Scope for POC

Explicitly deferred:
- Authentication / authorization
- Deployment / hosting
- Cloud file storage infrastructure
- Automated evidence collection / integrations (e.g., checking MFA status)
- Email notifications
- Multi-framework support (ISO 27001, etc.)
- Penetration testing or security hardening
- Audit log middleware (table exists for schema, not actively written to in POC)
- Version history / diffing on control edits (audit snapshots handle the core need)
- Dark mode, mobile responsive layout, print styles
