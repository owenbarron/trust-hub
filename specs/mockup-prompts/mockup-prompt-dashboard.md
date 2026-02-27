# UI Mockup Prompt: Dashboard (`/`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Dashboard page. This page is audit-scoped and should present high-signal readiness status for the selected audit, with gap-focused items surfaced first.

**Reference existing mockups** for visual consistency:
- `mockups/Requests List/requests-list.html` — for table density and status badge patterns
- `mockups/Criteria Matrix/criteria-matrix.html` — for summary cards and panel spacing
- `mockups/Evidence Library/evidence-library.html` — for filter, card, and typography consistency

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Dashboard</title>
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
- Left sidebar: 240px, `bg-[#4C4C4E]`
- Main content: `flex-1 flex flex-col h-full overflow-hidden bg-background-light`

### Sidebar
Match existing pages exactly.
- Active nav item: **Dashboard** (`dashboard`) with `bg-[#008C95] text-white shadow-sm`
- Inactive nav items: Controls (`verified_user`), Requests (`fact_check`), Criteria (`grid_view`), Policies (`policy`), Evidence (`folder_open`), Audits (`history`)

### Header Section
Container:
`bg-white px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0`

- Title: `text-2xl font-bold text-gray-900 tracking-tight` → "Dashboard"
- Subtitle: `text-sm text-gray-500 mt-1` → "Audit-scoped SOC 2 readiness overview with focus on immediate evidence and freshness gaps."

Right-side controls:
- Audit selector button (static):
  - `inline-flex items-center gap-2 border border-gray-300 bg-white rounded-md px-3 py-1.5 text-sm text-gray-700`
  - Icon: `unfold_more`
  - Label: "2025 SOC 2 Type II"
- Status pill: `px-2.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-semibold border border-gray-200`
  - Text: "Closed"

### Summary Cards Row
Immediately below header:
`bg-white px-6 py-4 border-b border-gray-200`

Grid: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4`

Cards (all `bg-white border border-gray-200 rounded-lg p-4 shadow-sm`):
1. Controls total
   - Label: `text-xs font-medium text-gray-500 uppercase` → "Controls"
   - Value: `text-2xl font-bold text-gray-900` → "88"
   - Subtext: `text-xs text-gray-500 mt-1` → "Selected audit snapshots"
2. Status buckets
   - Value row with three chips: Effective / In progress / Not tested
   - Use status badge classes from `03-styles.md`
3. Evidence coverage
   - Value: coverage percentage and ratio
   - Include a thin progress bar (`h-2 bg-gray-100 rounded-full` + inner `bg-primary`)
4. Open requests
   - Value: numeric open/follow-up count
   - Use amber emphasis (`text-amber-700`)
5. Freshness issues
   - Value: numeric at-risk + expired count
   - Use red emphasis (`text-red-700`)

### Attention Table (Primary Content)
Main area wrapper:
`flex-1 p-6 overflow-hidden bg-gray-50/50`

Table card:
`h-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm`

Section header:
`px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between`
- Title: `text-sm font-semibold text-gray-900 uppercase tracking-wide` → "Attention Required"
- Helper text: `text-xs text-gray-500` → "Freshness + evidence gaps for selected audit"

Table headers (`bg-gray-50 border-b border-gray-200 sticky top-0 z-10`):
- `CONTROL ID`
- `CONTROL NAME`
- `FRESHNESS`
- `EVIDENCE`
- `OPEN REQUESTS`
- `PRIORITY`

Header cell class:
`py-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500`

Row class:
`group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100`

Cell class:
`px-3 py-4 align-top`

Use 6 sample rows with mixed conditions:
- Expired freshness + no evidence (highest priority)
- Freshness due within 30 days
- Has evidence but missing linked request follow-up
- No evidence and open requests > 0

Priority chip mapping:
- High: red badge family
- Medium: amber badge family
- Low: gray badge family

### Key UX Rules to Reflect in the Mockup
- Every value shown is scoped to the selected audit.
- Gap-focused rows must be visually prominent (red/amber badges and left-to-right scan clarity).
- Table rows should appear linkable to control/request detail pages (`text-primary hover:underline` on IDs where appropriate).
- Keep this page read-only in presentation (no mutation actions required).

---

## Key Visual Notes
- This page is a signal board, not a CRUD list.
- Keep density moderate: summary at top, one strong attention table below.
- Use the existing Trust Hub side nav, spacing rhythm, and typography scale exactly.
