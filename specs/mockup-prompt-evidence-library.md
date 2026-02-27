# UI Mockup Prompt: Evidence Library (`/evidence`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Evidence Library page. This page is the canonical evidence index — it shows all evidence files linked to the selected audit, with search, sort, and a "Link to control" action.

**Reference the existing mockups** for visual consistency:
- `mockups/Controls Library.md/controls-library.html` — for table layout, filter bar, sidebar, and overall page structure
- `mockups/Request Details/Request Details.html` — for evidence table pattern (file icons, file names, action buttons)
- `mockups/Control Details/control-detail.html` — for card patterns and sidebar style

---

## Technical Setup (Copy Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Trust Hub - Evidence Library</title>
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
- Criteria — `grid_view` icon — inactive
- Policies — `policy` icon — inactive
- **Evidence** — `folder_open` icon — **ACTIVE** (`bg-[#008C95] text-white shadow-sm`)
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
- Left: "Evidence Library" — `text-2xl font-bold text-gray-900 tracking-tight`
- Right: Audit context badge: `bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide` showing "2026 SOC 2 TYPE II — ACTIVE"
- Next to badge: count pill — `px-2.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-semibold border border-gray-200` showing "47 files"

**Important:** NO "Upload" button on this page. Evidence is uploaded from request/control contexts only. This page is for finding and relinking.

---

## Filter/Search Bar
Directly below header, `bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 shadow-sm z-10`

**Filters (left side):**
1. File type dropdown: `min-w-[140px]` — label "File type" with `expand_more` icon
   - Style: `border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]`
2. Linked to dropdown: `min-w-[160px]` — label "Linked to"
3. Uploaded by dropdown: `min-w-[140px]` — label "Uploaded by"

**Search (right side, flex-1):**
- Search icon (`search`) absolutely positioned left
- Input: `w-full border border-gray-300 rounded-md pl-10 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]`
- Placeholder: "Search evidence by filename..."

---

## Main Evidence Table
Container: `flex-1 p-6 overflow-hidden bg-gray-50/50`
Table wrapper: `h-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm`
Scrollable area: `overflow-auto flex-1`

### Table Headers
`bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]`

| Column | Width | Header Text | Sortable |
|---|---|---|---|
| Filename | 35% | `FILE NAME` | Yes (with `unfold_more` on hover) |
| Type | 80px | `TYPE` | No |
| Uploaded | 140px | `UPLOADED` | Yes (default sort: DESC) |
| Uploaded By | 140px | `UPLOADED BY` | Yes |
| Linked To | 25% | `LINKED TO` | No |
| Actions | 120px | `ACTIONS` (right-aligned) | No |

Header cell styling: `py-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500`

### Table Rows
Row styling: `group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100`
Cell padding: `px-3 py-4 align-top`

**Sample data (10 rows):**

1. **HRIS_Config_Screenshot.png**
   - Type icon: `image` icon in `text-purple-500`
   - Type badge: `bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold` → "PNG"
   - Uploaded: Oct 25, 2025
   - By: Dan Chemnitz
   - Linked to: `CTL-001` chip + `REQ001` chip
   - Actions: Download icon + "Link" text button

2. **Active_Employees_Oct25.xlsx**
   - Type icon: `table_view` in `text-green-600`
   - Type: "XLSX" green badge
   - Uploaded: Oct 26, 2025
   - By: Dan Chemnitz
   - Linked to: `CTL-001` chip + `CTL-002` chip + `REQ001` chip
   - Actions: Download + Link

3. **Termination_List_YTD.csv**
   - Type icon: `table_view` in `text-green-600`
   - Type: "CSV" green badge
   - Uploaded: Oct 26, 2025
   - By: Dan Chemnitz
   - Linked to: `CTL-001` chip
   - Actions: Download + Link

4. **Background_Check_Policy_v2.pdf**
   - Type icon: `description` in `text-red-500`
   - Type: "PDF" red badge
   - Uploaded: Sep 15, 2025
   - By: Owen Barron
   - Linked to: `CTL-001` chip + `CTL-003` chip
   - Actions: Download + Link

5. **NDA_Template_2024.docx**
   - Type icon: `description` in `text-blue-500`
   - Type: "DOC" blue badge
   - Uploaded: Sep 10, 2025
   - By: MJ Eldridge
   - Linked to: `CTL-003` chip
   - Actions: Download + Link

6. **AWS_Config_Evidence.pdf**
   - Type icon: `description` in `text-red-500`
   - Type: "PDF" red badge
   - Uploaded: Aug 22, 2025
   - By: Igor Belagorudsky
   - Linked to: `CTL-012` chip + `REQ004` chip
   - Actions: Download + Link

7. **Access_Review_Q3.xlsx**
   - Type icon: `table_view` in `text-green-600`
   - Type: "XLSX" green badge
   - Uploaded: Aug 15, 2025
   - By: Owen Barron
   - Linked to: `CTL-007` chip + `CTL-015` chip
   - Actions: Download + Link

8. **Firewall_Rules_Export.png**
   - Type icon: `image` in `text-purple-500`
   - Type: "PNG" purple badge
   - Uploaded: Jul 30, 2025
   - By: Igor Belagorudsky
   - Linked to: `CTL-022` chip
   - Actions: Download + Link

9. **Data_Retention_Policy.pdf**
   - Type icon: `description` in `text-red-500`
   - Type: "PDF" red badge
   - Uploaded: Jul 12, 2025
   - By: Owen Barron
   - Linked to: (no controls linked — show `text-gray-400` text "No controls linked")
   - Actions: Download + **"Link" button highlighted** in `text-primary font-medium` since this has no control link

10. **Vendor_Security_Assessment.pdf**
    - Type icon: `description` in `text-red-500`
    - Type: "PDF" red badge
    - Uploaded: Jun 28, 2025
    - By: MJ Eldridge
    - Linked to: `CTL-005` chip + `CTL-041` chip + `REQ008` chip
    - Actions: Download + Link

### "Linked To" Chips
Control chips: `bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 inline-block`
Request chips: `bg-[#E6F8FB] text-[#0E7490] px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 inline-block`

### Action Buttons (per row)
- Download: `text-gray-400 hover:text-primary p-1` with `download` material icon
- "Link" text: `text-primary hover:text-primary-dark text-xs font-medium` — this is the relink-to-control action

---

## Footer
Below the table: `border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between`
- Left: `text-xs text-gray-500` → "Showing 1-10 of 47 files"
- Right: Sort indicator → `text-xs text-gray-500` → "Sorted by: Uploaded (newest first)"

---

## Key Visual Notes
- **No upload button anywhere** — this page is read-only + relink
- Evidence with no control links should have a subtle visual indicator (the "No controls linked" text in muted gray draws attention)
- The "Link" action button is the primary interactive element on each row
- File type icons use Material Symbols: `description` for documents, `image` for images, `table_view` for spreadsheets
- File type badges use small colored pills matching the icon color family
- Overall density matches Controls Library — this is a workhorse data table
