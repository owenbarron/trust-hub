# UI Mockup Prompt: Request Detail (`/requests/[id]`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Request Detail page. This page is where a single auditor request is reviewed and fulfilled with evidence, status updates, and threaded comments.

**Reference existing mockups** for visual consistency:
- `mockups/Requests List/requests-list.html` — for request metadata, status badges, and linked control chips
- `mockups/Evidence Library/evidence-library.html` — for evidence table patterns and action layout
- `mockups/Policy Detail/policy-detail.html` — for right-sidebar metadata card styling

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Request Detail</title>
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
- Standard Trust Hub shell (`body` + sidebar + top header)
- Requests nav item active (`fact_check`)
- Main content in two-column layout (`lg:grid-cols-12`: content + sidebar)

### Closed Audit Banner (Required Example State)
At top of main content, show amber read-only banner for a closed audit selection.

Banner classes:
`mx-6 mt-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center gap-2`

Banner text:
"Viewing closed audit 2025 SOC 2 Type II (closed Jan 15, 2026). Status changes, uploads, relinking, and comment posting are disabled."

### Header Section
`bg-white px-6 pt-6 pb-3 border-b border-gray-200 flex-shrink-0`

- Breadcrumb: `Requests > [request id]`
- Request title and status badge
- Metadata chips: priority, assignee, due date, audit badge

### Main Content Cards (Left Column)
1. **Request metadata + description card**
   - Request reference, source, and summary text
   - Full request description body
2. **Linked controls card**
   - Control chips styled per `03-styles.md`
3. **Evidence table card**
   - Columns: `File Name`, `Type`, `Uploaded`, `Uploaded By`, `Linked Controls`, `Actions`
   - Show evidence rows linked to this request
   - Add note under table (`text-xs text-gray-500 mt-3`):
     "Evidence uploaded from this request is auto-linked to the request's linked controls in the same selected audit."
4. **Comments thread card**
   - Chronological comment list with author, timestamp, body, and visibility badge (auditor-visible/private)
   - Include disabled comment composer in this closed-audit example state

### Sidebar Cards (Right Column)
1. Request status summary card (status, priority, due date, assignee)
2. Audit context card (selected audit name, state, created/updated markers)

---

## Interactive Behavior to Reflect in Static UI Copy
- Status update control is shown but disabled in closed-audit context.
- Evidence upload action is shown but disabled in closed-audit context.
- Comment posting is shown but disabled in closed-audit context.
- In active audits, these controls are enabled (call out with helper text only; do not create separate active variant on this page).

---

## Key UX Rules to Reflect in the Mockup
- Request detail is audit-scoped to the request's audit.
- Linked controls remain visible at all times.
- Evidence and comments are first-class sections, not secondary drawers.
- Read-only state must be explicit and unmistakable when a closed audit is selected.
