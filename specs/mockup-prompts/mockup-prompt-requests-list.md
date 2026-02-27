# UI Mockup Prompt: Requests List (`/requests`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Requests List page. This is the primary audit request index — it shows all requests scoped to the selected audit, with filtering, sorting, and search. Requests are created by auditors and assigned to internal team members to collect evidence.

**Reference the existing mockups** for visual consistency:
- `mockups/Controls Library.md/controls-library.html` — for table layout, filter bar, sidebar, and overall page structure (this is the primary reference for table density and styling)
- `mockups/Request Details/Request Details.html` — for request data patterns, status badges, and linked control chips
- `mockups/Dashboard/dashboard.html` — for stat card patterns

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Requests</title>
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
- **Requests** — `fact_check` icon — **ACTIVE** (`bg-[#008C95] text-white shadow-sm`)
- Criteria — `grid_view` icon — inactive
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
- Left: "Requests" — `text-2xl font-bold text-gray-900 tracking-tight`
- Right: Audit context badge: `bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide` showing "2025 SOC 2 TYPE II — CLOSED"
- Next to badge: lock icon `lock` in `text-gray-400 text-sm` (indicating closed audit)
- Next: count pill — `px-2.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-semibold border border-gray-200` showing "54 requests"

---

## Summary Cards Row
Below the header, above the filter bar. `bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0`

Four small stat cards in a `grid grid-cols-4 gap-4`:

**Card 1:** "Total Requests"
- `bg-white border border-gray-200 rounded-lg p-4 shadow-sm`
- Top: `text-xs font-medium text-gray-500 uppercase` → "Total"
- Number: `text-2xl font-bold text-gray-900` → "54"
- Accent: `border-l-4 border-primary`

**Card 2:** "Submitted"
- Number: `text-2xl font-bold text-green-700` → "45"
- Accent: `border-l-4 border-green-500`

**Card 3:** "Needs Revision"
- Number: `text-2xl font-bold text-red-700` → "1"
- Accent: `border-l-4 border-red-500`

**Card 4:** "Follow-ups"
- Number: `text-2xl font-bold text-amber-700` → "8"
- Accent: `border-l-4 border-amber-500`

---

## Filter/Search Bar
Directly below summary cards, `bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 shadow-sm z-10`

**Filters (left side):**
1. Status dropdown: `min-w-[160px]` — label "Status" with `expand_more` icon
   - Style: `border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]`
2. Priority dropdown: `min-w-[140px]` — label "Priority"
3. Assignee dropdown: `min-w-[160px]` — label "Assignee"

**Search (right side, flex-1):**
- Search icon (`search`) absolutely positioned left
- Input: `w-full border border-gray-300 rounded-md pl-10 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]`
- Placeholder: "Search requests by reference or summary..."

---

## Main Requests Table
Container: `flex-1 p-6 overflow-hidden bg-gray-50/50`
Table wrapper: `h-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm`
Scrollable area: `overflow-auto flex-1`

### Table Headers
`bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]`

| Column | Width | Header Text | Sortable |
|---|---|---|---|
| Reference | 120px | `REFERENCE` | Yes (with `unfold_more` on hover) |
| Summary | 40% | `SUMMARY` | No |
| Status | 160px | `STATUS` | Yes |
| Controls | 15% | `LINKED CONTROLS` | No |
| Assignee | 140px | `ASSIGNEE` | Yes |
| Priority | 100px | `PRIORITY` | Yes |
| Evidence | 80px | `EVIDENCE` (center-aligned) | Yes |

Header cell styling: `py-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500`

### Table Rows
Row styling: `group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100`
Cell padding: `px-3 py-4 align-top`

**Sample data (10 rows):**

1. **REQ001** — HRIS Listing
   - Reference: `text-primary hover:text-primary-dark hover:underline font-semibold text-sm` → "REQ001" (links to detail)
   - Summary: `text-sm text-gray-900 font-medium` → "HRIS Listing" (first line), `text-xs text-gray-500 leading-relaxed line-clamp-1 mt-0.5` → "Please provide the following system-generated lists from your HRIS..."
   - Status: `bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium` → "Submitted"
   - Controls: `CTL-001` chip
   - Assignee: `text-sm text-gray-700` → "Dan Chemnitz"
   - Priority: `bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium` → "Medium"
   - Evidence: `text-sm font-medium text-gray-500 text-center` → "3"

2. **REQ002** — Vendor Inventory
   - Summary: "Vendor Inventory" / "Please provide the list or inventory of vendors..."
   - Status: Submitted (green)
   - Controls: `CTL-005` chip
   - Assignee: Dan Chemnitz
   - Priority: Medium
   - Evidence: 1

3. **REQ003** — Vulnerability Population
   - Summary: "Vulnerability Population" / "Please provide a population of vulnerabilities identified..."
   - Status: Submitted (green)
   - Controls: `CTL-020` chip
   - Assignee: Dan Chemnitz
   - Priority: Medium
   - Evidence: 2

4. **REQ009** — Weekly Security Meeting Evidence
   - Summary: "Weekly Security Meeting Evidence" / "Please provide evidence of the weekly meeting held by the security..."
   - Status: Submitted (green)
   - Controls: `CTL-008` chip + `CTL-080` chip (two controls — show both)
   - Assignee: Dan Chemnitz
   - Priority: Medium
   - Evidence: 1

5. **REQ035** — System User Lists
   - Summary: "System User Lists" / "Please provide system-generated user lists that include all accounts..."
   - Status: Submitted (green)
   - Controls: `CTL-060` chip
   - Assignee: Dan Chemnitz
   - Priority: Medium
   - Evidence: 4

6. **Follow Up - 01** — GitHub Users/Admins
   - Reference styled slightly different: `text-primary hover:text-primary-dark hover:underline font-semibold text-sm` → "Follow Up - 01"
   - Summary: "GitHub Users/Admins" / "We did not receive the list of GitHub Users/Admins..."
   - Status: Submitted (green)
   - Controls: (no controls linked — show `text-gray-400` text "—")
   - Assignee: Owen Barron
   - Priority: Medium
   - Evidence: 1

7. **Follow Up - 07** — Asset Management Compliance
   - Summary: "Asset Management Compliance" / "We would like to expand testing for CTL-071..."
   - Status: `bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-xs font-medium` → "Needs revision" (**this is the only non-submitted request — make it visually prominent**)
   - Controls: (no controls linked — "—")
   - Assignee: Owen Barron
   - Priority: Medium
   - Evidence: 0 (show `text-gray-400` → "0")

8. **REQ036** — Branch Protection Configs
   - Summary: "Branch Protection Configs" / "Please provide screenshots of branch protection configurations..."
   - Status: Submitted (green)
   - Controls: `CTL-064` chip
   - Assignee: Dan Chemnitz
   - Priority: Medium
   - Evidence: 2

9. **REQ045** — Q4 Access Reviews
   - Summary: "Q4 Access Reviews" / "Please provide evidence of the Q4 access reviews..."
   - Status: Submitted (green)
   - Controls: (no controls — "—")
   - Assignee: Dan Chemnitz
   - Priority: Medium
   - Evidence: 3

10. **Follow-up - 08** — Computer Assets & Antivirus
    - Summary: "Computer Assets & Antivirus" / "Please provide a manual list of computer assets..."
    - Status: Submitted (green)
    - Controls: (no controls — "—")
    - Assignee: (no assignee — show `text-gray-400 italic` → "Unassigned")
    - Priority: Medium
    - Evidence: 1

### Linked Control Chips
Control chips: `bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 inline-block`

When a request has multiple controls (e.g., REQ009 has CTL-008 + CTL-080), show chips inline. If more than 3, show first 2 + a `+N more` overflow pill in `bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium`.

### Status Badge Colors
- Submitted to auditor: `bg-green-50 text-green-700 border border-green-200/60` → display as "Submitted"
- Needs revision: `bg-red-50 text-red-700 border border-red-200/60` → display as "Needs revision"
- In review: `bg-amber-50 text-amber-700 border border-amber-200/60` → display as "In review"
- Draft: `bg-gray-100 text-gray-600 border border-gray-200` → display as "Draft"
- Completed: `bg-green-100 text-green-800 border border-green-200/60` → display as "Completed"

### Priority Badge Colors
- Medium: `bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium`
- High: `bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium`
- Low: `bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium`

---

## Footer
Below the table: `border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between`
- Left: `text-xs text-gray-500` → "Showing 1-10 of 54 requests"
- Right: Sort indicator → `text-xs text-gray-500` → "Sorted by: Reference (A-Z)"

---

## Closed Audit Banner
Since the mockup shows the 2025 audit (closed), include a **read-only banner** at the very top of the main content area, above the header:

```
bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 flex-shrink-0
```
- Icon: `lock` in `text-amber-600` (18px)
- Text: `text-sm text-amber-800 font-medium` → "You are viewing a closed audit (2025 SOC 2 Type II). All data is read-only."
- Right: `text-xs text-amber-600` → "Closed Jan 15, 2026"

---

## Key Visual Notes
- This page follows the **controls-library.html high-density table** pattern — same filter bar, table density, and sidebar
- Requests are **audit-scoped** — the audit context badge in the header makes this clear
- The "Needs revision" status row should be visually distinct (red badge draws attention)
- Reference column links to `/requests/[id]` detail pages — use primary teal link style
- Summary column shows a bold title line + truncated description preview below (two-line cell)
- Most requests in the real data are "Submitted to auditor" — the table should show this realistically
- Follow-up requests (Follow Up - 01, etc.) are auditor follow-ups mixed into the same list
- Unassigned requests show italic placeholder text
- No "Create Request" button in v1 — requests are managed externally and seeded
- Overall density matches Controls Library — this is a workhorse data table
- The closed audit banner demonstrates the read-only UX pattern used across all pages
