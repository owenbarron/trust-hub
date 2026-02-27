# UI Mockup Prompt: Policy Detail (`/policies/[id]`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Policy Detail page. This page shows a single policy's metadata, its linked document, and all linked controls **grouped by relationship type** (fulfills, governs, requires_acknowledgement). Control status badges are drawn from the **selected audit's snapshots**.

**Reference the existing mockups** for visual consistency:
- `mockups/Control Details/control-detail.html` — primary reference for detail page layout (breadcrumbs, title, two-column layout, card patterns, tab bar style)
- `mockups/Request Details/Request Details.html` — for sidebar metadata card and linked-objects pattern
- `mockups/Controls Library.md/controls-library.html` — for table patterns within relationship groups

---

## Technical Setup
Use the identical `<head>` section from the Evidence Library prompt (same Tailwind CDN, Public Sans font, Material Symbols, identical `tailwind.config`).

---

## Page Layout

### Sidebar
Identical to other pages. **Policies** nav item is ACTIVE: `bg-[#008C95] text-white shadow-sm` with `policy` icon.

---

## Header Section (Matches control-detail.html pattern)
`bg-white border-b border-gray-200 px-8 pt-6 pb-0 shadow-sm z-10 flex-none`

**Breadcrumbs:**
`flex items-center gap-2 mb-4 text-sm text-gray-500`
- "Policies" (link, `hover:text-primary`)
- `chevron_right` icon (xs)
- "Access Control Policy" (current, `font-medium text-gray-900`)

**Title row:**
`flex flex-wrap items-start justify-between gap-4 mb-6`

**Left side:**
- Title: `text-2xl font-bold text-gray-900 tracking-tight` → "Access Control Policy"
- Below title, metadata row: `flex items-center gap-3 mt-2`
  - Global scope badge: `bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1` with `public` icon (14px)
  - Review status badge:
    - If current: `bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-medium` → "Review current — Next: May 15, 2026"
    - If overdue: `bg-red-50 text-red-700 border border-red-200` → "Review overdue — Due: Nov 1, 2025"

**Right side:**
- "View Document" button: `bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm`
  - Icon: `open_in_new` (18px)
  - Text: "View Document"

**No tab bar on this page** — content is organized by sections, not tabs.

---

## Main Content Area
`flex-1 overflow-y-auto p-8`
`max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6`

### Left Column (8/12 cols): Linked Controls by Relationship
`lg:col-span-8 flex flex-col gap-8`

This is the main content — three collapsible sections, one for each relationship type that has linked controls.

#### Section 1: "Fulfills" (expanded by default)
**Section header:**
`flex items-center justify-between cursor-pointer group`
- Left side: `flex items-center gap-3`
  - Expand/collapse chevron: `chevron_down` icon, `text-gray-400 group-hover:text-gray-600 transition-transform` (rotated -90 when collapsed)
  - Relationship label: `text-lg font-semibold text-gray-900` → "Fulfills"
  - Count badge: `bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded-full text-xs font-medium` → "9 controls"
- Right side: description tooltip area: `text-xs text-gray-500 italic` → "Controls directly satisfied by this policy"

**Controls table (inside the section):**
`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mt-3`

Table headers: `bg-gray-50 border-b border-gray-200`

| Column | Width | Header |
|---|---|---|
| ID | 90px | `CONTROL ID` |
| Name | flex | `CONTROL NAME` |
| Implementation | 130px | `IMPLEMENTATION` |
| Testing | 110px | `TESTING` |
| Evidence | 80px | `EVIDENCE` |

Header styling: `py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500`

**Sample rows for "fulfills" (9 rows):**

1. CTL-007 | Access Termination Review | `In progress` (amber badge) | `Effective` (green badge) | 1
2. CTL-008 | Access Provisioning | `Completed` (green badge) | `Effective` (green badge) | 3
3. CTL-015 | Quarterly Access Review | `In progress` (amber) | `Effective` (green) | 2
4. CTL-016 | Privileged Access Management | `In progress` (amber) | `Not tested` (gray) | 1
5. CTL-024 | Service Account Review | `Not started` (gray) | `Not tested` (gray) | 0
6. CTL-025 | MFA Enforcement | `Completed` (green) | `Effective` (green) | 2
7. CTL-026 | Password Complexity | `Completed` (green) | `Effective` (green) | 1
8. CTL-032 | VPN Access Controls | `In progress` (amber) | `Effective` (green) | 1
9. CTL-045 | Database Access Restrictions | `In progress` (amber) | `Not tested` (gray) | 0

Control IDs are links: `text-primary hover:text-primary-dark hover:underline font-semibold text-sm`
Row styling: `hover:bg-gray-50 transition-colors border-b border-gray-100`
Cell padding: `py-3 px-4`

Status badges use the standard pattern:
- Completed/Effective: `bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium`
- In progress: `bg-amber-50 text-amber-700 border border-amber-200/60`
- Not started/Not tested: `bg-gray-100 text-gray-600 border border-gray-200`

#### Section 2: "Governs" (expanded)
Same pattern as fulfills.

Section header label: "Governs" with count badge `4 controls`
Description: "Controls operationally governed by this policy"
Relationship chip color: `bg-gray-100 text-gray-600`

**Sample rows (4 rows):**
1. CTL-010 | Logical Access Policy | `Completed` (green) | `Effective` (green) | 2
2. CTL-011 | Role-Based Access | `In progress` (amber) | `Effective` (green) | 1
3. CTL-033 | Remote Access Standards | `In progress` (amber) | `Effective` (green) | 1
4. CTL-046 | Access Logging Requirements | `In progress` (amber) | `Not tested` (gray) | 0

#### Section 3: "Requires Acknowledgement" (expanded)
Same pattern.

Section header label: "Requires Acknowledgement" with count badge `2 controls`
Description: "Controls requiring evidence of policy acknowledgement"
Relationship chip color: `bg-amber-50 text-amber-700`

**Sample rows (2 rows):**
1. CTL-001 | Employee Onboarding | `In progress` (amber) | `Effective` (green) | 1
   - **Acknowledgement indicator:** Add a small icon after the evidence count:
     - If evidence exists (count > 0): `check_circle` in `text-green-600` (14px) with tooltip "Acknowledged"
     - If no evidence: `error` in `text-red-500` (14px) with tooltip "Not yet acknowledged"
2. CTL-003 | Employee Confidentiality Agreement | `Completed` (green) | `Effective` (green) | 1
   - Acknowledged (green check)

---

### Right Column (4/12 cols): Policy Metadata Sidebar
`lg:col-span-4 flex flex-col gap-6`

#### Card 1: Policy Details
`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-0`

**Card header:** `px-6 py-4 border-b border-gray-200 bg-gray-50`
- Title: `text-sm font-semibold text-gray-900 uppercase tracking-wide` → "Policy Details"

**Card body:** `p-6 space-y-4`

Metadata rows (label/value pairs, stacked):

| Label | Value |
|---|---|
| Policy Name | Access Control Policy |
| Version | v2.1 |
| Owner | Owen Barron |
| Created | Jan 10, 2024 |
| Last Updated | Nov 15, 2025 |
| Next Review | May 15, 2026 |
| File | `access-control-policy-v2.1.pdf` (link style) |

Label: `text-xs font-medium text-gray-500 uppercase`
Value: `text-sm text-gray-900 mt-0.5`
Each pair separated by: `border-b border-gray-100 pb-3`

#### Card 2: Relationship Summary
`bg-white rounded-xl border border-gray-200 shadow-sm p-6`

**Title:** `text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4` → "Relationship Summary"

Three rows showing relationship type distribution:
```
Fulfills           ████████████████░░░░ 9
Governs            ████████░░░░░░░░░░░░ 4
Requires Ack.      ████░░░░░░░░░░░░░░░░ 2
                                    Total: 15
```

For each row:
- Label: `text-sm text-gray-700 font-medium` (with relationship-colored dot before it)
- Progress bar: `h-2 rounded-full bg-gray-100` with filled portion
  - Fulfills fill: `bg-[#008C95]`
  - Governs fill: `bg-gray-400`
  - Requires Ack fill: `bg-amber-500`
- Count: `text-sm font-semibold text-gray-900`

Below: `border-t border-gray-200 pt-3 mt-3`
- Total: `text-sm font-semibold text-gray-900` → "15 linked controls"

#### Card 3: Audit Context Notice
`bg-blue-50 border border-blue-200 rounded-xl p-5`

- Icon: `info` in `text-blue-600` (20px)
- Text: `text-sm text-blue-800 mt-2` → "Control statuses shown are from the currently selected audit (2026 SOC 2 Type II). Switch audits to see historical status."

---

## Key Visual Notes
- This page follows the **control-detail.html two-column layout** pattern — main content left, metadata sidebar right
- The grouping by relationship type is the defining UX feature of this page
- Each relationship section is a collapsible group with its own mini-table
- Control IDs in the tables are links back to `/controls/[id]`
- The acknowledgement indicator on `requires_acknowledgement` rows is a key compliance signal
- The "Global Scope" badge in the header distinguishes this from audit-scoped pages
- The "Audit Context Notice" card in the sidebar explains why control statuses may change
- No edit actions in v1 — this is a read/navigate page
- Match the exact badge styles, card patterns, and typography from control-detail.html
