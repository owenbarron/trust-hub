# UI Mockup Prompt: Control Detail (`/controls/[id]`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Control Detail page. This view combines audit-scoped snapshot data with global relationships so users can inspect one control across criteria, policies, evidence, and linked requests.

**Reference existing mockups** for visual consistency:
- `mockups/Policy Detail/policy-detail.html` — for two-column detail layout and card composition
- `mockups/Requests List/requests-list.html` — for chip and badge treatment
- `mockups/Evidence Library/evidence-library.html` — for table styling and density

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Control Detail</title>
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
- Sidebar is standard Trust Hub shell with **Controls** active.
- Main content uses two-column detail layout (`lg:grid-cols-12`, main left + metadata sidebar right).

### Header Section
`bg-white px-6 pt-6 pb-3 border-b border-gray-200 flex-shrink-0`

- Breadcrumb row: `Controls > CTL-XXX` using `chevron_right`
- Control title: `text-2xl font-bold text-gray-900 tracking-tight`
- Subtitle: short control description (audit-scoped snapshot text)
- Audit badge on right with selected audit context.

### Tabs (Exact Order Required)
Directly under header content, show tab strip with this exact order:
1. `Details`
2. `Criteria`
3. `Policies`
4. `Evidence`
5. `Requests`

Tab bar styling:
- Container: `flex gap-6 border-b border-gray-200 mt-5`
- Active tab: `pb-3 text-sm font-semibold text-primary border-b-[3px] border-primary`
- Inactive tab: `pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-[3px] border-transparent`

Show **Details** as active in the static mockup.

### Details Tab Content
Main area:
`flex-1 overflow-y-auto px-6 py-6`

Grid:
- Left (`lg:col-span-8`): detail cards
- Right (`lg:col-span-4`): metadata/status cards

Required cards/content:
1. Snapshot Details card (audit-scoped)
   - Control ID, owner, implementation status, testing status, automation status, freshness date, notes.
2. Description card
   - Full control narrative text for operating intent and expected evidence.
3. Linked relationships preview card
   - Counts/chips for linked criteria, policies, evidence, and requests.

Right sidebar cards:
1. Audit Snapshot Context
   - Selected audit name, audit status, last updated timestamp.
2. Status Summary
   - Implementation/testing/freshness statuses as badges.

### Non-active Tab Preview Note
Add a subtle inline note near the relationships card:
`text-xs text-gray-500`
- Criteria tab: uses global `control_criteria` mappings
- Policies tab: uses global `policy_controls` mappings
- Evidence and Requests tabs: show selected-audit links

---

## Key UX Rules to Reflect in the Mockup
- Detail values in the active tab are audit-scoped snapshot values.
- Relationship sources differ by tab and must be signaled clearly in UI copy.
- Evidence tab semantics (even though inactive in this static frame): include all control evidence in selected audit, including request-originated auto-links.
- Preserve link affordance on control/request/policy references (`text-primary hover:underline`).
