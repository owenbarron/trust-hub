# UI Mockup Prompt: Audits Page (`/audits`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Audits lifecycle management page. This is a critical page — it's where audits are closed (freezing all snapshots) and new audits are started (cloning snapshots from the prior audit). These are irreversible actions that need strong confirmation UX.

**Reference the existing mockups** for visual consistency:
- `mockups/Dashboard/dashboard.html` — for card layout, stat cards, and overall page feel
- `mockups/Controls Library.md/controls-library.html` — for sidebar and table patterns
- `mockups/Control Details/control-detail.html` — for detail card and sidebar structure

---

## Technical Setup
Use the identical `<head>` section from the Evidence Library prompt (same Tailwind CDN, Public Sans font, Material Symbols, identical `tailwind.config`).

---

## Page Layout

### Sidebar
Identical to other pages. **Audits** nav item is ACTIVE: `bg-[#008C95] text-white shadow-sm` with `history` icon.

All other nav items inactive: Dashboard (`dashboard`), Controls (`verified_user`), Requests (`fact_check`), Criteria (`grid_view`), Policies (`policy`), Evidence (`folder_open`).

---

## Header Section
`bg-white px-6 pt-6 pb-6 border-b border-gray-200 flex-shrink-0`

**Title row:**
- Left: "Audit Management" — `text-2xl font-bold text-gray-900 tracking-tight`
- Below title: `text-sm text-gray-500` — "Manage audit lifecycle. Close completed audits and start new audit periods."

---

## Active Audit Card (Hero Section)
Positioned directly below the header in the main content area.

`p-6` padding on the content area.

**Active audit card:**
```
bg-white border-2 border-primary/30 rounded-xl p-6 shadow-sm relative overflow-hidden
```
Add a subtle left accent: `absolute left-0 top-0 bottom-0 w-1 bg-primary`

**Card layout — 2 columns:**

**Left side (audit details):**
- Status badge at top: `bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5`
  - Green dot: `w-2 h-2 rounded-full bg-green-500 animate-pulse`
  - Text: "ACTIVE"
- Audit name: `text-xl font-bold text-gray-900 mt-3 mb-1` → "2026 SOC 2 Type II"
- Audit ID: `text-sm text-gray-500 font-mono` → "2026-soc2-type2"
- Metadata grid (2x2) below, with `mt-4 grid grid-cols-2 gap-4`:
  - Period Start: `text-xs font-medium text-gray-500 uppercase` label / `text-sm font-medium text-gray-900` value → "January 1, 2026"
  - Period End: → "December 31, 2026"
  - Auditor Firm: → "BARR Advisory"
  - Controls: → "88 controls (176 snapshots)"

**Right side (actions):**
Right-aligned vertically centered section with the lifecycle action:

**Close Audit button:**
```
bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-semibold
hover:bg-red-700 transition-colors
flex items-center gap-2 shadow-sm
```
- Icon: `lock` material icon
- Text: "Close This Audit"
- Below button: `text-xs text-gray-500 text-center mt-2` → "This action is irreversible"

---

## Confirmation Modal (Shown as overlay on the page)
Show the close-audit confirmation modal as a semi-transparent overlay on the page, positioned center. This demonstrates the confirmation UX.

**Overlay:** `fixed inset-0 bg-black/50 z-50 flex items-center justify-center`

**Modal card:** `bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden`

**Modal header:** `px-6 pt-6 pb-4`
- Warning icon: `w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4`
  - Icon: `warning` in `text-red-600 text-2xl`
- Title: `text-lg font-bold text-gray-900` → "Close Audit: 2026 SOC 2 Type II"
- Subtitle: `text-sm text-gray-500 mt-1` → "This action cannot be undone."

**Modal body:** `px-6 pb-4`
Consequence list in a `bg-red-50 border border-red-200 rounded-lg p-4`:
- `text-sm text-red-800 space-y-2`
- Each item with a `check_circle` icon in `text-red-600`:
  - "All 88 control snapshots will be frozen as read-only"
  - "No further evidence can be uploaded or relinked"
  - "Request statuses and comments will be locked"
  - "This audit will appear as 'Closed' in the audit history"

**Confirmation input:** `mt-4`
- Label: `text-sm font-medium text-gray-700 mb-1` → "Type the audit name to confirm:"
- Input: `w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500`
- Placeholder: "2026-soc2-type2"

**Modal footer:** `px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3`
- Cancel button: `px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50`
- Confirm button: `px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md opacity-50 cursor-not-allowed` (disabled until name typed)
  - Text: "Close Audit Permanently"

---

## Audit History Table
Below the active audit card. Separated by `mt-8`.

**Section header:**
- "Audit History" — `text-lg font-bold text-gray-900 mb-4`

**Table container:** `bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm`

### Table Headers
`bg-gray-50 border-b border-gray-200`

| Column | Width | Header |
|---|---|---|
| Status | 100px | `STATUS` |
| Audit Name | 30% | `AUDIT NAME` |
| Audit ID | 20% | `AUDIT ID` |
| Period | 25% | `PERIOD` |
| Closed Date | 15% | `CLOSED` |

Header styling: `py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500`

### Rows

**Row 1 (Active — current):**
- Status: Green badge `bg-green-50 text-green-700 border border-green-200` → "Active" with pulse dot
- Name: `text-sm font-semibold text-gray-900` → "2026 SOC 2 Type II"
- ID: `text-sm font-mono text-gray-600` → "2026-soc2-type2"
- Period: `text-sm text-gray-700` → "Jan 1, 2026 — Dec 31, 2026"
- Closed: `text-sm text-gray-400` → "—"
- Row highlight: `bg-primary/5 border-l-2 border-primary`

**Row 2 (Closed):**
- Status: Gray badge `bg-gray-100 text-gray-600 border border-gray-200` → "Closed" with `lock` icon (14px)
- Name: `text-sm font-medium text-gray-700` → "2025 SOC 2 Type II"
- ID: `text-sm font-mono text-gray-500` → "2025-soc2-type2"
- Period: `text-sm text-gray-600` → "Oct 1, 2025 — Dec 31, 2025"
- Closed: `text-sm text-gray-600` → "Jan 15, 2026"

Row styling: `hover:bg-gray-50 transition-colors border-b border-gray-100`
Cell padding: `py-4 px-4`

---

## "Start New Audit" Section
Below the audit history table. `mt-8`.

**Card:** `bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center`

- Icon: `add_circle` material icon in `text-gray-300 text-5xl mb-3`
- Title: `text-lg font-semibold text-gray-700 mb-1` → "Start a New Audit"
- Description: `text-sm text-gray-500 mb-4 max-w-md mx-auto` → "Starting a new audit will clone all 88 control snapshots from the most recently closed audit and reset evidence links. The new audit becomes the active audit."
- Button: `bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors`
  - Icon: `add` material icon
  - Text: "Start New Audit Period"

**Note:** The "Start New Audit" button should only be visible when no active audit exists. Since we currently have an active audit (2026), show this section with reduced opacity (`opacity-50`) and a note: `text-xs text-gray-400 mt-2` → "Close the current audit before starting a new one."

---

## Key Visual Notes
- This page is visually distinct from the dense table pages — it's more card-based and action-oriented
- The confirmation modal is the most critical UX element; show it overlaid on the page
- Red color palette for close/destructive actions, green for active status
- The page should feel serious and considered — these are irreversible compliance actions
- Overall density is lower than Controls/Evidence — appropriate for a page with 2 major actions
- The accent bar on the active audit card uses primary teal (#008C95)
