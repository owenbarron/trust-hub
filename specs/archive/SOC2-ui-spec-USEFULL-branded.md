# USEFULL SOC 2 Compliance System — UI Design Specification

## Overview

This document provides detailed UI design direction for a SOC 2 compliance management tool. The target audience is an AI design tool (Google Stitch) or a coding agent building the frontend. The app is built with Next.js and Tailwind CSS.

---

## Design Philosophy

This is an **internal compliance tool** used by 3–5 people (compliance team + auditor). It should feel like a high-quality internal product — think Linear, Notion admin panel, or the Vercel dashboard. NOT a consumer-facing marketing site.

**Core principles:**

* **Information density over whitespace.** Users need to scan 88 controls and 50+ requests. Don’t waste space.
* **Clear visual hierarchy.** Status at a glance. Color-coded badges. Bold labels, regular-weight values.
* **Fast navigation.** Everything is 1–2 clicks from everything else. Controls link to requests. Requests link back to controls. Evidence is reachable from both.
* **Professional neutrality.** No playful illustrations, no gradients, no rounded-everything. Crisp, serious, trustworthy — you’d be comfortable showing this to an auditor.
* **Restrained brand expression.** USEFULL colors should appear in navigation, actions, and key signals — not as large decorative fills. The UI should feel operational and audit-ready, not promotional.

---

## Color System

### Base Palette

Use a neutral-first UI with restrained USEFULL accents.

| Token            | Hex       | Usage                                                       |
| ---------------- | --------- | ----------------------------------------------------------- |
| `bg-primary`     | `#FFFFFF` | Page background                                             |
| `bg-secondary`   | `#F7F8F8` | Card groups, table header bands, subtle section backgrounds |
| `bg-sidebar`     | `#4C4C4E` | Sidebar background (USEFULL Slate)                          |
| `border-default` | `#E5E7EB` | Borders, dividers                                           |
| `text-primary`   | `#1F2937` | Primary body text                                           |
| `text-secondary` | `#6B7280` | Secondary/muted text                                        |
| `text-sidebar`   | `#E5E7EB` | Sidebar text                                                |
| `accent`         | `#008C95` | Links, primary buttons, active states (USEFULL Deep Teal)   |
| `accent-hover`   | `#007A84` | Hover state for Deep Teal                                   |
| `accent-soft`    | `#E8F4F4` | Very light teal-tinted hover/selection backgrounds          |
| `info`           | `#23B1C1` | Informational badges/chips (USEFULL Sky)                    |
| `warn-brand`     | `#D69A2D` | Non-critical warnings / chart accents (USEFULL Golden)      |
| `warm-accent`    | `#E07E3C` | Secondary chart accent only (USEFULL Sunny)                 |

### Usage Rules

* **Large surfaces stay neutral** (white, light gray, subtle borders).
* **Deep Teal = action + navigation** (links, primary buttons, active tabs, selected nav indicators).
* **Sky = informational/external-facing markers** (e.g., “Visible to Auditor”).
* **Golden/Sunny are supporting colors only** (charts, subtle callouts) — never primary buttons or global navigation.
* **Slate is the text anchor** conceptually; keep UI typography neutral and readable, with Deep Teal reserved for selective emphasis.

### Status Colors

These are the most important colors in the app. They must be instantly readable at small sizes in badge form.

| Status                                   | Background | Text      | Tailwind Classes              |
| ---------------------------------------- | ---------- | --------- | ----------------------------- |
| Completed / Effective / Closed           | `#DCFCE7`  | `#166534` | `bg-green-100 text-green-800` |
| In Progress / Submitted                  | `#FEF3C7`  | `#92400E` | `bg-amber-100 text-amber-800` |
| Not Started / Not Tested                 | `#F3F4F6`  | `#4B5563` | `bg-gray-100 text-gray-600`   |
| Expired / Needs Revision / High Priority | `#FEE2E2`  | `#991B1B` | `bg-red-100 text-red-800`     |
| Open (request) / Informational           | `#E6F8FB`  | `#0E7490` | `bg-cyan-50 text-cyan-700`    |

### Badge Component

Status badges should be compact pills: `px-2 py-0.5 rounded-full text-xs font-medium`.

Never use outlines/borders on semantic status badges — background color alone is sufficient.

For non-status chips (e.g., linked controls, visibility labels):

* Teal chip (general link chip): `bg-[#E8F4F4] text-[#006C75]`
* Sky chip (auditor-visible/info chip): `bg-[#E6F8FB] text-[#0E7490]`

---

## Typography

Use the system font stack (`font-sans` in Tailwind, which resolves to Inter on most systems).

| Element         | Size | Weight                   | Tailwind                                                    |
| --------------- | ---- | ------------------------ | ----------------------------------------------------------- |
| Page title      | 24px | Semibold                 | `text-2xl font-semibold`                                    |
| Section heading | 18px | Semibold                 | `text-lg font-semibold`                                     |
| Table header    | 13px | Medium, uppercase, muted | `text-xs font-medium uppercase text-gray-500 tracking-wide` |
| Table cell      | 14px | Regular                  | `text-sm`                                                   |
| Badge text      | 12px | Medium                   | `text-xs font-medium`                                       |
| Sidebar nav     | 14px | Medium                   | `text-sm font-medium`                                       |
| Body text       | 14px | Regular                  | `text-sm`                                                   |
| Metadata label  | 13px | Medium, muted            | `text-xs font-medium text-gray-500`                         |
| Metadata value  | 14px | Regular                  | `text-sm text-gray-900`                                     |

**Header color guidance:** page-level headers may use `text-[#008C95]` sparingly (especially on top-level pages). Body text should remain neutral/dark for readability.

---

## Layout

### Overall Structure

```
┌──────────┬───────────────────────────────────────┐
│          │  Header: Page title + breadcrumbs      │
│ Sidebar  │───────────────────────────────────────│
│  (240px) │                                        │
│          │  Main content area                     │
│          │  (max-width: 1280px, centered)         │
│          │                                        │
│          │                                        │
└──────────┴───────────────────────────────────────┘
```

### Sidebar

* Fixed left, full height
* Dark background (`#4C4C4E`, USEFULL Slate)
* Width: 240px (can be collapsed to 64px icon-only mode, but collapsing is optional for POC)
* Top: USEFULL logo or “USEFULL Compliance” wordmark in white
* Nav items with icons (use Lucide React icons):

  * `LayoutDashboard` → Dashboard
  * `Shield` → Controls
  * `ClipboardList` → Requests
  * `Grid3x3` → Criteria Matrix
* Active nav item: `bg-[#3F3F41] text-white` with a **2px left Deep Teal accent bar** (`#008C95`)
* Inactive: `text-gray-300 hover:text-white hover:bg-[#3F3F41]`
* Bottom of sidebar: “USEFULL SOC 2 • POC” in `text-xs text-gray-400`

### Page Header

* Sticky top bar within the main content area (not global)
* Contains: Breadcrumbs (`Controls > CTL-001`) and page title
* Breadcrumbs in `text-sm text-gray-500` with `>` separator, current page in `text-gray-900`
* Optional: action buttons aligned right (e.g., “Add Evidence” on control detail page)

---

## Pages

### 1. Dashboard (`/`)

**Layout:** 2-column grid of stat cards at top, then full-width sections below.

**Top Stats Row (4 cards):**
Each card is a white rectangle with subtle border, containing:

* A label in muted text (“Total Controls”, “Evidence Coverage”, “Open Requests”, “Expired Controls”)
* A large number below the label (`text-3xl font-bold`)
* Optional: a small colored indicator (green up arrow, red down arrow) or secondary stat

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total        │  │ With         │  │ Open         │  │ Expired      │
│ Controls     │  │ Evidence     │  │ Requests     │  │ Freshness    │
│    88        │  │   64 / 88    │  │    12        │  │    3         │
│              │  │   73%        │  │              │  │  ⚠ Attention │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Implementation Status Breakdown:**
A horizontal stacked bar chart or simple grouped bar chart showing:

* Completed: X controls (green)
* In Progress: X controls (amber)
* Not Started: X controls (gray)

For non-semantic comparison series/charts, use:

* Primary series: Deep Teal
* Secondary series: Sky
* Optional tertiary: Golden

**Controls Needing Attention:**
A compact table showing controls with expired freshness dates or missing evidence. Columns: ID, Name, Issue (e.g. “Freshness expired 86 days ago”, “No evidence uploaded”). Red or amber left border on each row to draw attention (use red for expired, amber for missing evidence).

---

### 2. Controls List (`/controls`)

**This is the most important page.** It should closely mirror the Hyperproof table view the team is already familiar with.

**Filter Bar:**
Row of filter dropdowns/pills above the table:

* Implementation status: multi-select dropdown
* Testing status: multi-select dropdown
* Has evidence: Yes / No / All
* Search input: searches ID and Name

Filters should be horizontally inline, compact. Use small dropdowns or popover-based multi-selects, not full-page filter panels.

**Table:**

| Column         | Width     | Content                                                                                                                  |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| ID             | 80px      | `CTL-001` — link styled in `text-[#008C95] hover:text-[#007A84] hover:underline`, clicks through to detail               |
| Name           | flex/grow | Plain text                                                                                                               |
| Implementation | 120px     | Status badge                                                                                                             |
| Testing        | 100px     | Status badge                                                                                                             |
| Freshness      | 140px     | Green text with ✓ if fresh (“Fresh until 09/11/2026”), red text with ⚠ if expired (“Expired 86 days”), gray “—” if unset |
| Evidence       | 80px      | Count with subtle icon. “0” in muted gray, “1+” in normal text                                                           |
| Criteria       | 80px      | Count. On hover, show tooltip listing the criteria IDs (e.g., “CC1.1, CC1.4, CC1.5”)                                     |

**Table styling:**

* Header row: `bg-[#F7F8F8]` with uppercase muted text
* Body rows: white background, `border-b border-gray-100`
* Hover: `bg-[#F7F8F8]` on entire row
* Row height: compact, ~44px
* No outer border on the table, just horizontal rules between rows
* The overall count (“88 controls”) shown above the table, right-aligned, in `text-sm text-gray-500`

---

### 3. Control Detail (`/controls/[id]`)

**Header:**

```
Breadcrumb: Controls > CTL-001
Title: CTL-001 Employee Onboarding
Freshness badge: [Fresh until 09/11/2026] (green pill) or [Expired 86 days] (red pill)
```

**Tab Bar:**
Horizontal tabs below the header: Details | Criteria | Evidence | Requests

* Active tab: `border-b-2 border-[#008C95] text-[#008C95] font-medium`
* Inactive tab: `text-gray-500 hover:text-gray-700`

**Details Tab:**
Two-column metadata grid (label on left, value on right):

```
Control ID          CTL-001
Name                Employee Onboarding
Description         New employee hiring procedures are in place to guide the hiring process.
Implementation      [In progress]  ← badge
Testing Status      [Effective]  ← badge
Automation          [Not started]  ← badge
Owner               MJ Eldridge (mj@usefull.us)
Freshness           Fresh until 09/11/2026
Notes               —
Created             09/05/2025
Updated             11/24/2025
```

Labels: `text-sm font-medium text-gray-500`, right-aligned or left-aligned depending on space
Values: `text-sm text-gray-900`
Container: white card with border, with comfortable padding (`p-6`)

**Right sidebar (optional, if space allows):**
A “Health” summary card mirroring Hyperproof’s right-side health panel. Shows implementation, testing, freshness, automation as a compact stacked list with status indicators.

**Criteria Tab:**
Simple table showing linked criteria:

| Criteria ID | Name | Category |
| ----------- | ---- | -------- |

Example row: `CC1.1 | COSO Principle 1: The entity demonstrates a commitment... | Common Criteria`

Each criteria ID is a link that navigates to the criteria matrix page filtered to that criteria.

**Evidence Tab:**
Table of linked evidence:

| Filename                          | Type | Uploaded     | By           | Version |
| --------------------------------- | ---- | ------------ | ------------ | ------- |
| `USEFULL Onboarding Template.pdf` | PDF  | Sep 11, 2025 | Dan Chemnitz | v1      |

* PDF icon for PDFs, image icon for screenshots, file icon for others
* “View” and “Download” action links on each row (for local POC, just open/download from `./evidence/`)
* “Upload Evidence” button (primary / Deep Teal, top-right) that opens a file picker
* Empty state: “No evidence linked to this control. Upload evidence or link from a request.”

**Requests Tab:**
Table of linked requests:

| Reference | Summary | Status | Assignee |
| --------- | ------- | ------ | -------- |

Click-through to request detail.
Empty state: “No audit requests linked to this control.”

---

### 4. Requests List (`/requests`)

**Filter Bar:**

* Status filter: multi-select
* Search by reference or summary text

**Table:**

| Column    | Content                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Reference | “REQ001” or “Follow Up - 01” — link to detail                                                          |
| Summary   | Truncated to ~80 chars                                                                                 |
| Status    | Badge                                                                                                  |
| Controls  | Chips/pills showing linked control IDs (e.g., `CTL-001`, `CTL-003`). Max 3 visible, “+2 more” overflow |
| Assignee  | Name                                                                                                   |
| Priority  | Badge (Medium = gray, High = red)                                                                      |

Same table styling as controls list.

---

### 5. Request Detail (`/requests/[id]`)

**Header:**

```
Breadcrumb: Requests > REQ001
Title: REQ001 — Please provide the following system-generated lists from your HRIS...
Status: [Submitted to Auditor] (badge, clickable dropdown to change status)
```

**Main Content (left 60–65%):**

**Description Section:**
Full request text in a white card. Can be lengthy — the body should render markdown or at least preserve line breaks and numbered lists.

**Linked Controls Section:**
Chips showing each linked control: `CTL-001 Employee Onboarding` — clicking navigates to control detail.

**Evidence Section:**
Table of evidence uploaded to this request. Same format as evidence tab on control detail. “Upload Evidence” button.

**Metadata:**
Priority, Assignee, Source, Due Date in a compact metadata block.

**Comments Thread (right 35–40% or below on narrow screens):**

Chronological comment list, newest at bottom:

```
┌──────────────────────────────────────┐
│ Sydney Buchel — Jan 19, 2026 9:07 PM │
│ @Dan Chemnitz Now that the audit     │
│ period is over, can you upload a     │
│ new screenshot...                    │
│                            [Internal] │
├──────────────────────────────────────┤
│ Dan Chemnitz — Jan 20, 2026 10:08 AM │
│ Updated status to Submitted          │
│                   [Visible to Auditor]│
├──────────────────────────────────────┤
│ Dan Chemnitz — Feb 10, 2026 3:06 PM  │
│ Can you provide screenshots of any   │
│ internal guides in Wikis...          │
│                   [Visible to Auditor]│
└──────────────────────────────────────┘
```

Comment styling:

* Author name: `font-medium text-sm`
* Timestamp: `text-xs text-gray-400`
* Body: `text-sm text-gray-700`
* Visibility indicator: small pill in corner

  * “Visible to Auditor”: `bg-[#E6F8FB] text-[#0E7490]`
  * “Internal”: `bg-gray-100 text-gray-600`
* Each comment separated by a subtle border

**Comment Input:**
Text area at the bottom of the thread with:

* Placeholder: “Add a comment...”
* Checkbox: “☐ Make visible to external auditors”
* “Post” button (primary / Deep Teal, right-aligned)

---

### 6. Criteria Coverage Matrix (`/criteria`)

**Purpose:** Show at a glance which SOC 2 criteria are covered by which controls, and identify gaps.

**Layout:** Grouped list, not a literal grid (a grid with 38 rows × 88 columns would be unusable).

Group criteria by category:

* **Common Criteria** (CC1.x through CC9.x)
* **Availability** (A1.x)
* **Confidentiality** (C1.x)

For each criteria:

```
┌──────────────────────────────────────────────────────────────┐
│ CC1.1 — COSO Principle 1: The entity demonstrates a         │
│ commitment to integrity and ethical values                   │
│                                                              │
│ Coverage: 7 controls    Status: ██████░░░░ 5/7 effective     │
│                                                              │
│ CTL-001 Employee Onboarding          [In progress] [Effective]│
│ CTL-002 Policy Publication           [In progress] [Effective]│
│ CTL-003 Employee Confidentiality...  [Completed]   [Effective]│
│ CTL-004 Code of Conduct              [In progress] [Effective]│
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

Each criteria is a collapsible section (collapsed by default, showing just the criteria ID, name, control count, and a small coverage bar). Expand to see the full list of linked controls.

Coverage health indicator:

* All controls effective → green bar
* Some controls not effective → amber bar
* No controls or all not started → red bar

---

## Shared Component Patterns

### Empty States

When a list has no items, show a centered message with a muted icon:

* Icon: relevant Lucide icon in `text-gray-300`, size 48px
* Text: `text-gray-500 text-sm`
* Example: “No evidence linked to this control.” with a `FileX` icon
* Optional: a primary action button below (“Upload Evidence”)

### Loading States

Use skeleton loading (pulsing gray rectangles) for tables and cards while data loads. Tailwind’s `animate-pulse bg-gray-200 rounded` pattern.

### Table Pattern

All tables should share these properties:

* Outer container: `border border-gray-200 rounded-lg overflow-hidden`
* Header: `bg-[#F7F8F8]`
* No outer padding on the table — it fills its container
* Row hover: `hover:bg-[#F7F8F8]`
* Compact row height: `py-3 px-4` on cells

### Card Pattern

White container: `bg-white border border-gray-200 rounded-lg p-6`
With title: title uses `text-lg font-semibold mb-4`

### Action Buttons

* **Primary:** `bg-[#008C95] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#007A84]`
* **Secondary:** `bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50`
* **Destructive:** `bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700`

### Links

* Default inline link style: `text-[#008C95] hover:text-[#007A84] hover:underline`
* Use Deep Teal links consistently across controls, requests, and evidence actions

### Focus States

Accessibility and keyboard navigation matter for admin tools:

* Interactive elements should use a subtle focus ring: `focus:outline-none focus:ring-2 focus:ring-[#008C95]/30 focus:ring-offset-1`

### Tooltips

Use a lightweight tooltip (CSS-only or minimal JS) for:

* Criteria IDs in the controls table (show full criteria name on hover)
* Truncated text (show full text on hover)

---

## Responsive Behavior

This is a desktop-first internal tool. Minimum supported width: 1024px. The sidebar should be collapsible on smaller screens but responsive design below 1024px is not a priority for POC.

---

## Icon Library

Use **Lucide React** (`lucide-react`). Key icons:

* `Shield` — Controls
* `ClipboardList` — Requests
* `Grid3x3` — Criteria Matrix
* `LayoutDashboard` — Dashboard
* `FileText` — PDF evidence
* `Image` — Image evidence
* `File` — Generic file
* `Upload` — Upload action
* `MessageSquare` — Comments
* `AlertTriangle` — Warning/expired
* `CheckCircle` — Completed/effective
* `Clock` — In progress
* `Circle` — Not started (empty circle)
* `ChevronRight` — Breadcrumb separator
* `ChevronDown` — Collapsible section
* `ExternalLink` — Open link
* `Search` — Search input

---

## Interactions to Implement in POC

### Must Have

* Table sorting (click column header to sort)
* Table filtering (dropdowns filter visible rows)
* Table search (client-side text match)
* Tab switching on control detail
* Navigate between controls, requests, and criteria via links
* Evidence file upload (basic file input → copies to local dir → creates DB record)
* Comment submission on requests
* Request status change (dropdown on request detail)
* Collapsible criteria sections on matrix page

### Nice to Have (if time permits)

* Inline editing of control metadata (click to edit, save on blur)
* Drag-and-drop file upload
* Keyboard shortcuts (e.g., `/` to focus search)
* Sidebar collapse/expand
* Table pagination (if 88 rows feels long)
* Toast notifications on save

### Not Needed for POC

* Real-time updates
* Undo/redo
* Dark mode
* Mobile responsive layout
* Print styles
