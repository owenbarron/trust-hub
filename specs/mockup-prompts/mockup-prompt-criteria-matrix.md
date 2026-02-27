# UI Mockup Prompt: Criteria Matrix (`/criteria`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Criteria Matrix page. This page shows all 38 SOC 2 trust services criteria organized by category and subcategory, with linked controls and coverage health indicators. It is the canonical view for answering "which criteria are covered and by how many controls?"

**No existing mockup exists** for this page — it is required per the v4 implementation plan but was never prototyped. Design it to match the established visual system.

**Reference the existing mockups** for visual consistency:
- `mockups/Controls Library.md/controls-library.html` — for sidebar, filter bar, and overall page structure
- `mockups/Control Details/control-detail.html` — for collapsible section patterns and card styling
- `mockups/Dashboard/dashboard.html` — for stat card patterns

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Criteria Matrix</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#008a94",
            "primary-dark": "#006c74",
            "primary-light": "#e0f2f3",
            "background-light": "#f5f8f8",
            "surface-light": "#ffffff",
            "border-light": "#dae6e7",
            "text-main": "#101818",
            "text-muted": "#5e8a8d",
            "slate-custom": "#4C4C4E",
          },
          fontFamily: {
            display: ["Public Sans", "sans-serif"],
            sans: ["Public Sans", "sans-serif"],
          },
          borderRadius: {
            DEFAULT: "0.25rem",
            lg: "0.5rem",
            xl: "0.75rem",
            full: "9999px",
          },
        },
      },
    }
  </script>
</head>
```

---

## Page Layout

### Overall Structure
- `body`: `flex h-screen overflow-hidden text-gray-800 font-display`
- Left sidebar: 240px, `bg-[#4C4C4E]` (USEFULL Slate)
- Main content: `flex-1 flex flex-col h-full overflow-hidden bg-background-light`

### Sidebar (Match controls-library.html exactly)
**Top:** Trust Hub logo area
- 8x8 `bg-white/10 rounded` icon container with Material Symbols `shield` icon in white
- "Trust Hub" in `text-white font-semibold text-base tracking-tight`

**Navigation items** (vertical, `space-y-0.5 px-3`):
Each item: `flex items-center px-3 py-1.5 text-sm font-medium rounded`
- Dashboard — `dashboard` icon — inactive (`text-gray-300 hover:bg-white/10 hover:text-white`)
- Controls — `verified_user` icon — inactive
- Requests — `fact_check` icon — inactive
- **Criteria** — `grid_view` icon — **ACTIVE** (`bg-[#008C95] text-white shadow-sm`)
- Policies — `policy` icon — inactive
- Evidence — `folder_open` icon — inactive
- Audits — `history` icon — inactive (bottom section)

**Bottom:** `p-4 border-t border-white/10 bg-black/20 mt-auto`
- Avatar circle: `w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500` with "OB" initials
- "Owen Barron" / "Admin" in white/gray-400

---

## Header Section
Located above the filter bar, inside main content area.

```
bg-white px-6 pt-6 pb-3 border-b border-gray-200 flex-shrink-0
```

**Row 1 (title + audit context):**
- Left: "Criteria Matrix" — `text-2xl font-bold text-gray-900 tracking-tight`
- Left subtitle: `text-sm text-gray-500 mt-1` → "SOC 2 Trust Services Criteria mapped to controls. Control statuses reflect the selected audit."
- Right: Audit context badge: `bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide` showing "2026 SOC 2 TYPE II — ACTIVE"
- Right: Count pill → `px-2.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-semibold border border-gray-200` showing "38 Criteria"

---

## Summary Cards Row
Below the header, `bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0`

Three stat cards in a `grid grid-cols-3 gap-4`:

**Card 1:** "Common Criteria"
- `bg-white border border-gray-200 rounded-lg p-4 shadow-sm`
- Top: `text-xs font-medium text-gray-500 uppercase` → "Common Criteria (CC)"
- Number: `text-2xl font-bold text-gray-900` → "33"
- Sub: `text-xs text-gray-500` → "9 subcategories"
- Accent: `border-l-4 border-primary`

**Card 2:** "Availability"
- Top: "Availability (A)"
- Number: `text-2xl font-bold text-gray-900` → "3"
- Sub: `text-xs text-gray-500` → "1 subcategory"
- Accent: `border-l-4 border-blue-500`

**Card 3:** "Confidentiality"
- Top: "Confidentiality (C)"
- Number: `text-2xl font-bold text-gray-900` → "2"
- Sub: `text-xs text-gray-500` → "1 subcategory"
- Accent: `border-l-4 border-purple-500`

---

## Filter/Search Bar
`bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 shadow-sm z-10`

**Filters (left side):**
1. Category dropdown: `min-w-[180px]` — label "Category" with `expand_more` icon
   - Style: `border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]`
2. Coverage dropdown: `min-w-[160px]` — label "Coverage status"

**Toggle (center):**
- Expand/collapse all toggle: `text-xs text-primary font-medium cursor-pointer hover:text-primary-dark` → "Expand all" / "Collapse all"

**Search (right side, flex-1):**
- Search icon (`search`) absolutely positioned left
- Input: `w-full border border-gray-300 rounded-md pl-10 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]`
- Placeholder: "Search criteria by ID or description..."

---

## Main Content Area
`flex-1 p-6 overflow-auto bg-gray-50/50`

The content is organized as **collapsible category groups**, each containing collapsible individual criteria sections. This is a two-level hierarchy:

**Level 1:** Category group (e.g., "Common Criteria — Control Environment")
**Level 2:** Individual criteria (e.g., "CC1.1 — COSO Principle 1...")

---

### Category Group: Security / Common — Control Environment
`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden`

**Category header:**
`px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer group`

- Left: `flex items-center gap-3`
  - Expand/collapse chevron: `expand_more` icon, `text-gray-400 group-hover:text-gray-600 transition-transform` (rotated -90 when collapsed)
  - Category label: `text-base font-semibold text-gray-900` → "Control Environment"
  - Parent label: `text-xs text-gray-500 font-medium` → "Security / Common"
  - Count badge: `bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium` → "5 criteria"
- Right: Coverage summary bar (small inline bar):
  - `w-32 h-2 rounded-full bg-gray-100 overflow-hidden`
  - Filled portion: `h-full bg-primary rounded-full` (width proportional to coverage)
  - Next to bar: `text-xs text-gray-500 font-medium` → "38 controls"

**Category body (expanded):** Contains individual criteria sections stacked vertically.

---

### Individual Criteria Section (Collapsed — Default State)
Most criteria should be shown **collapsed** by default (showing only the summary row). Show 2-3 criteria expanded to demonstrate the full pattern.

**Collapsed criteria row:**
`px-6 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer group last:border-0`

- Left: `flex items-center gap-3 flex-1 min-w-0`
  - Chevron: `chevron_right` icon, `text-gray-300 group-hover:text-gray-500 text-[16px]`
  - Criteria ID: `text-sm font-semibold text-primary whitespace-nowrap` → "CC1.1"
  - Criteria name (truncated): `text-sm text-gray-700 truncate` → "COSO Principle 1: The entity demonstrates a commitment to integrity and ethical values"
- Right: `flex items-center gap-4 shrink-0`
  - Controls count: `text-xs text-gray-500 font-medium whitespace-nowrap` → "7 controls"
  - Coverage bar: `w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden`
    - Fill: color based on health (see Coverage Health below)
  - Coverage fraction: `text-xs font-semibold whitespace-nowrap` → "5/7" (color matches health)

---

### Individual Criteria Section (Expanded — Show for CC1.1)
When expanded, the section reveals the criteria description and a table of linked controls.

**Expanded header:**
Same as collapsed, but chevron rotated down (`expand_more`), and a subtle left accent bar appears: `border-l-2 border-primary`

**Criteria description:**
`px-6 py-3 bg-gray-50/30 text-sm text-gray-600 leading-relaxed border-b border-gray-100`
→ Short excerpt (first 2-3 sentences) of the criteria requirement text. Not the full COSO points-of-focus — just the principle statement.

For CC1.1: "The entity demonstrates a commitment to integrity and ethical values. Management sets the tone at the top, establishes standards of conduct, evaluates adherence, and addresses deviations in a timely manner."

**Linked controls table:**
`mx-6 my-3 border border-gray-200 rounded-lg overflow-hidden`

Table headers: `bg-gray-50 border-b border-gray-200`

| Column | Width | Header |
|---|---|---|
| Control ID | 100px | `CONTROL` |
| Name | flex | `NAME` |
| Implementation | 130px | `IMPLEMENTATION` |
| Testing | 110px | `TESTING` |
| Evidence | 80px | `EVIDENCE` |

Header styling: `py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500`

**Sample rows for CC1.1 (7 controls):**

1. CTL-001 | Employee Onboarding | `In progress` (amber) | `Effective` (green) | 1
2. CTL-002 | Policy Publication | `In progress` (amber) | `Effective` (green) | 1
3. CTL-003 | Employee Confidentiality Agreement | `Completed` (green) | `Effective` (green) | 1
4. CTL-004 | Code of Conduct | `In progress` (amber) | `Effective` (green) | 1
5. CTL-006 | Employee Handbook | `In progress` (amber) | `Effective` (green) | 1
6. CTL-009 | Board Oversight | `In progress` (amber) | `Not tested` (gray) | 0
7. CTL-014 | Performance Reviews | `In progress` (amber) | `Effective` (green) | 1

Control IDs are links: `text-primary hover:text-primary-dark hover:underline font-semibold text-sm`
Row styling: `hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0`
Cell padding: `py-2.5 px-3`

Status badges (compact, matching controls-library):
- Completed/Effective: `bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded-full text-xs font-medium`
- In progress: `bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full text-xs font-medium`
- Not started/Not tested: `bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full text-xs font-medium`

---

### Complete Category / Criteria Structure

Render the following categories and criteria. Show **Category 1 expanded** with **CC1.1 expanded** and all other criteria collapsed. All other categories should be **expanded** (showing collapsed criteria rows) to demonstrate the full page scope.

#### Category 1: Control Environment (5 criteria) — EXPANDED, CC1.1 EXPANDED
- **CC1.1** — COSO Principle 1: Commitment to integrity and ethical values → 7 controls, 5/7 effective — **EXPANDED**
- CC1.2 — COSO Principle 2: Board independence and oversight → 3 controls, 2/3 effective — collapsed
- CC1.3 — COSO Principle 3: Management structures and reporting lines → 4 controls, 3/4 effective — collapsed
- CC1.4 — COSO Principle 4: Commitment to competent individuals → 5 controls, 4/5 effective — collapsed
- CC1.5 — COSO Principle 5: Accountability for internal control → 4 controls, 3/4 effective — collapsed

#### Category 2: Information and Communication (3 criteria) — EXPANDED
- CC2.1 — COSO Principle 13: Relevant quality information → 6 controls, 4/6 effective — collapsed
- CC2.2 — COSO Principle 14: Internal communication → 5 controls, 4/5 effective — collapsed
- CC2.3 — COSO Principle 15: External communication → 4 controls, 3/4 effective — collapsed

#### Category 3: Risk Assessment (4 criteria) — EXPANDED
- CC3.1 — COSO Principle 6: Specifies objectives with clarity → 4 controls, 3/4 effective — collapsed
- CC3.2 — COSO Principle 7: Identifies risks across entity → 5 controls, 3/5 effective — collapsed
- CC3.3 — COSO Principle 8: Considers potential for fraud → 3 controls, 2/3 effective — collapsed
- CC3.4 — COSO Principle 9: Identifies and assesses changes → 4 controls, 2/4 effective — collapsed

#### Category 4: Monitoring Activities (2 criteria) — EXPANDED
- CC4.1 — COSO Principle 16: Ongoing and separate evaluations → 5 controls, 4/5 effective — collapsed
- CC4.2 — COSO Principle 17: Evaluates and communicates deficiencies → 3 controls, 2/3 effective — collapsed

#### Category 5: Control Activities (3 criteria) — EXPANDED
- CC5.1 — COSO Principle 10: Selects and develops control activities → 6 controls, 4/6 effective — collapsed
- CC5.2 — COSO Principle 11: General controls over technology → 8 controls, 5/8 effective — collapsed
- CC5.3 — COSO Principle 12: Deploys through policies and procedures → 5 controls, 4/5 effective — collapsed

#### Category 6: Logical and Physical Access (8 criteria) — EXPANDED
- CC6.1 — Logical access security software and architectures → 6 controls, 4/6 effective — collapsed
- CC6.2 — Registration and authorization before granting access → 4 controls, 3/4 effective — collapsed
- CC6.3 — Authorizes, modifies, or removes access → 5 controls, 4/5 effective — collapsed
- CC6.4 — Restricts physical access to facilities → 2 controls, 2/2 effective — collapsed
- CC6.5 — Discontinues protections over decommissioned assets → 2 controls, 1/2 effective — collapsed
- CC6.6 — Logical access against external threats → 5 controls, 3/5 effective — collapsed
- CC6.7 — Restricts transmission and movement of information → 3 controls, 2/3 effective — collapsed
- CC6.8 — Controls against unauthorized or malicious software → 4 controls, 3/4 effective — collapsed

#### Category 7: System Operations (5 criteria) — EXPANDED
- CC7.1 — Detection and monitoring procedures → 5 controls, 3/5 effective — collapsed
- CC7.2 — Monitors for anomalies indicating compromise → 4 controls, 3/4 effective — collapsed
- CC7.3 — Evaluates security events → 3 controls, 2/3 effective — collapsed
- CC7.4 — Responds to identified security incidents → 4 controls, 3/4 effective — collapsed
- CC7.5 — Recovers from identified security incidents → 3 controls, 2/3 effective — collapsed

#### Category 8: Change Management (1 criterion) — EXPANDED
- CC8.1 — Authorizes, designs, develops, tests, approves changes → 7 controls, 5/7 effective — collapsed

#### Category 9: Risk Mitigation (2 criteria) — EXPANDED
- CC9.1 — Risk mitigation for business disruption → 4 controls, 3/4 effective — collapsed
- CC9.2 — Vendor and business partner risk management → 3 controls, 2/3 effective — collapsed

#### Category 10: Availability (3 criteria) — EXPANDED
**Different parent category** — `Availability` instead of `Security / Common`. Use a `border-l-4 border-blue-500` accent on the category header.

- A1.1 — Maintains and monitors processing capacity → 3 controls, 2/3 effective — collapsed
- A1.2 — Environmental protections and recovery infrastructure → 4 controls, 3/4 effective — collapsed
- A1.3 — Tests recovery plan procedures → 2 controls, 1/2 effective — collapsed

#### Category 11: Confidentiality (2 criteria) — EXPANDED
**Different parent category** — `Confidentiality`. Use a `border-l-4 border-purple-500` accent on the category header.

- C1.1 — Identifies and maintains confidential information → 3 controls, 2/3 effective — collapsed
- C1.2 — Disposes of confidential information → 2 controls, 1/2 effective — collapsed

---

## Coverage Health Indicators

The coverage bar and fraction text use color to signal health:

- **All controls effective** (e.g., 2/2): `bg-green-500` bar fill, `text-green-700` text
- **Most controls effective** (≥ 70%): `bg-primary` bar fill, `text-primary` text
- **Some controls effective** (30–69%): `bg-amber-500` bar fill, `text-amber-700` text
- **Few or no controls effective** (< 30%): `bg-red-500` bar fill, `text-red-700` text

The fraction shows effective testing count / total controls (e.g., "5/7"). "Effective" here means the testing status is "Effective" in the selected audit's control snapshots.

---

## Key Visual Notes
- This page has **no existing mockup** — design it fresh using established patterns
- The two-level collapsible hierarchy (category → criteria) is the defining UX feature
- Default state: all categories expanded, all individual criteria collapsed (showing summary rows)
- One criteria (CC1.1) should be shown expanded to demonstrate the full pattern
- Control IDs in expanded sections are **links** to `/controls/[id]` — use primary teal link style
- Coverage bars provide instant at-a-glance health assessment without expanding
- The page is **read-only** — no edit actions, just navigation and exploration
- Categories from `Security / Common` use the default primary teal accent; `Availability` uses blue; `Confidentiality` uses purple
- The page is scoped to the selected audit (control statuses come from that audit's snapshots)
- Density is moderate — between the high-density Controls table and the card-based Audits page
- Search filters criteria by ID or description text (client-side filtering)
- The "Expand all / Collapse all" toggle affects individual criteria sections, not category groups
