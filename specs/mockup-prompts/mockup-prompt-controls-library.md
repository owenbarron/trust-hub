# UI Mockup Prompt: Controls List (`/controls`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Controls List page. This is the primary controls operating view for scanning control health and triaging implementation/testing gaps within the selected audit.

**Reference existing mockups** for visual consistency:
- `mockups/Requests List/requests-list.html` — for data table density and filter/search bar treatment
- `mockups/Criteria Matrix/criteria-matrix.html` — for status chips and table rhythm
- `mockups/Evidence Library/evidence-library.html` — for sidebar and shell consistency

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Controls</title>
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
- Active nav item: **Controls** (`verified_user`) with `bg-[#008C95] text-white shadow-sm`
- Others inactive.

### Header Section
`bg-white px-6 pt-6 pb-3 border-b border-gray-200 flex-shrink-0`

- Title: `text-2xl font-bold text-gray-900 tracking-tight` → "Controls"
- Subtitle: `text-sm text-gray-500 mt-1` → "Audit-scoped control operating view for implementation, testing, freshness, and coverage."
- Right side:
  - Audit context badge: `bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide`
  - Count pill showing total controls

### Filter/Search Bar
`bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 shadow-sm z-10`

Left filters (as static dropdown controls):
1. Implementation status
2. Testing status
3. Has evidence (yes/no)

Dropdown class:
`border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]`

Search input:
- Placeholder: "Search by control ID or name..."
- Class: `w-full border border-gray-300 rounded-md pl-10 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]`

### Main Controls Table
Main wrapper:
`flex-1 p-6 overflow-hidden bg-gray-50/50`

Table container:
`h-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm`

Scrollable body:
`overflow-auto flex-1`

Headers (`bg-gray-50 sticky top-0 z-10 border-b border-gray-200`):
| Column | Header |
|---|---|
| `ID` | `ID` |
| `Name` | `NAME` |
| `Implementation` | `IMPLEMENTATION` |
| `Testing` | `TESTING` |
| `Freshness` | `FRESHNESS` |
| `Evidence count` | `EVIDENCE` |
| `Criteria count` | `CRITERIA` |

Header class:
`py-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500`

Row class:
`group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100`

Cell class:
`px-3 py-4 align-top`

Sample rows: include at least 8 controls with mixed implementation/testing statuses and varied evidence/criteria counts.

Required presentation details:
- Control `ID` values in `text-primary font-semibold text-sm` and styled as linkable.
- `Name` as primary text with optional short secondary description line (`text-xs text-gray-500 mt-0.5`).
- `Implementation` and `Testing` use status badge mappings from `03-styles.md`.
- `Freshness` should show clear state text (fresh / due soon / expired) using green/amber/red text.
- Evidence and criteria counts must be visible numeric values (no hidden hover-only details).

### Pagination
Do **not** add pagination controls. The table is a single scrolling list in v1.

---

## Key UX Rules to Reflect in the Mockup
- This page is audit-scoped; audit badge and counts should reflect one selected audit.
- Criteria count visibility is mandatory and always visible in table rows.
- Filter + search controls should feel first-class (not secondary).
- This is a dense workhorse table; preserve compact vertical rhythm.
