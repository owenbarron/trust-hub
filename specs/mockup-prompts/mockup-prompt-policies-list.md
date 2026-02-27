# UI Mockup Prompt: Policy Register (`/policies`)

## Context
This is one of 10 pages in "Trust Hub," an internal SOC 2 compliance management tool for USEFULL. Create a **complete, static HTML mockup** of the Policy Register page. Policies are **global** (not scoped to any audit) — they are living documents that persist across audits. Each policy links to controls via three relationship types: `fulfills`, `governs`, or `requires_acknowledgement`.

**Reference the existing mockups** for visual consistency:
- `mockups/Controls Library.md/controls-library.html` — for table layout, filter bar structure, column density
- `mockups/Dashboard/dashboard.html` — for card patterns and stat summaries
- `mockups/Control Details/control-detail.html` — for sidebar and card styling

---

## Technical Setup
Use the identical `<head>` section from the Evidence Library prompt (same Tailwind CDN, Public Sans font, Material Symbols, identical `tailwind.config`).

---

## Page Layout

### Sidebar
Identical to other pages. **Policies** nav item is ACTIVE: `bg-[#008C95] text-white shadow-sm` with `policy` icon.

All other nav items inactive: Dashboard (`dashboard`), Controls (`verified_user`), Requests (`fact_check`), Criteria (`grid_view`), Evidence (`folder_open`), Audits (`history`).

---

## Header Section
`bg-white px-6 pt-6 pb-3 border-b border-gray-200 flex-shrink-0`

**Row 1 (title + actions):**
- Left: "Policy Register" — `text-2xl font-bold text-gray-900 tracking-tight`
- Left subtitle: `text-sm text-gray-500 mt-1` → "Organization-wide policies linked to compliance controls. Policies persist across all audits."
- Right: Global scope indicator — `bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5`
  - Icon: `public` (14px)
  - Text: "Global Scope"
- Right: Count pill — `px-2.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-semibold border border-gray-200 ml-3` → "8 Policies"

---

## Filter/Search Bar
`bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 shadow-sm z-10`

**Filters:**
1. Review status dropdown: `min-w-[160px]` — label "Review status"
   - Style: same as controls-library.html filter dropdowns
2. Relationship type dropdown: `min-w-[180px]` — label "Relationship type"

**Search:** flex-1, with search icon
- Placeholder: "Search policies by name or description..."

---

## Summary Cards Row (Optional but recommended)
Below the filter bar, above the table. `px-6 pt-6 pb-0`.

Three small stat cards in a `grid grid-cols-3 gap-4 mb-6`:

**Card 1:** "Up to Date"
- `bg-white border border-gray-200 rounded-lg p-4 shadow-sm`
- Top: `text-xs font-medium text-gray-500 uppercase` → "Up to Date"
- Number: `text-2xl font-bold text-green-700` → "5"
- Accent: small green left border `border-l-4 border-green-500`

**Card 2:** "Review Due"
- Same structure
- Number: `text-2xl font-bold text-amber-700` → "2"
- Accent: `border-l-4 border-amber-500`

**Card 3:** "Overdue"
- Same structure
- Number: `text-2xl font-bold text-red-700` → "1"
- Accent: `border-l-4 border-red-500`

---

## Main Policy Table
Container: `px-6 pb-6 flex-1 overflow-auto`
Table wrapper: `bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm`

### Table Headers
`bg-gray-50 border-b border-gray-200`

| Column | Width | Header | Sortable |
|---|---|---|---|
| Policy Name | 30% | `POLICY NAME` | Yes |
| Description | 30% | `DESCRIPTION` | No |
| Review Date | 130px | `NEXT REVIEW` | Yes (with `unfold_more` hover) |
| Linked Controls | 100px | `CONTROLS` | Yes |
| Relationships | 180px | `RELATIONSHIP TYPES` | No |
| Document | 100px | `DOCUMENT` (right-aligned) | No |

Header styling: `py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500`

### Table Rows

Row styling: `group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100`
Cell padding: `px-4 py-4 align-top`

**Row 1: Information Security Policy**
- Name: `text-sm font-semibold text-primary hover:text-primary-dark hover:underline cursor-pointer` → "Information Security Policy" (links to detail)
- Description: `text-xs text-gray-500 leading-relaxed line-clamp-2` → "Establishes the framework for information security management across the organization, including classification, handling, and protection requirements."
- Review Date: `text-sm text-green-700 flex items-center gap-1` → checkmark icon + "Mar 15, 2026" (future = green)
- Controls: `text-sm font-medium text-gray-900 text-center` → "12"
- Relationships: Three small chips:
  - `bg-[#E8F4F4] text-[#006C75] px-1.5 py-0.5 rounded text-[10px] font-medium` → "fulfills: 8"
  - `bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium` → "governs: 4"
- Document: `text-primary hover:text-primary-dark` download icon button

**Row 2: Acceptable Use Policy**
- Name: "Acceptable Use Policy"
- Description: "Defines acceptable use of company IT resources, including internet, email, and social media usage guidelines for all employees."
- Review Date: `text-red-700 flex items-center gap-1` → warning icon + "Nov 1, 2025" (past = red, overdue)
- Controls: "6"
- Relationships: "governs: 6"
- Document: download icon

**Row 3: Data Retention & Disposal Policy**
- Name: "Data Retention & Disposal Policy"
- Description: "Specifies retention periods for different data categories and secure disposal procedures for physical and digital records."
- Review Date: `text-amber-700` → "Apr 1, 2026" (upcoming = amber, within 60 days — but use green since it's not within 60 days; actually let's make it `text-green-700`)
- Controls: "5"
- Relationships: "fulfills: 3" + "governs: 2"
- Document: download icon

**Row 4: Incident Response Plan**
- Name: "Incident Response Plan"
- Description: "Documents procedures for identifying, containing, eradicating, and recovering from security incidents, including escalation procedures."
- Review Date: green → "Jun 30, 2026"
- Controls: "8"
- Relationships: "fulfills: 6" + "requires_acknowledgement: 2"
- Document: download icon

**Row 5: Access Control Policy**
- Name: "Access Control Policy"
- Description: "Governs user access provisioning, deprovisioning, and periodic access reviews across production systems and sensitive data stores."
- Review Date: green → "May 15, 2026"
- Controls: "15"
- Relationships: "fulfills: 9" + "governs: 4" + "requires_acknowledgement: 2"
- Document: download icon

**Row 6: Change Management Policy**
- Name: "Change Management Policy"
- Description: "Establishes the process for requesting, reviewing, approving, and implementing changes to production systems and infrastructure."
- Review Date: amber → "Mar 1, 2026" (within 30 days from now — use amber)
- Controls: "7"
- Relationships: "fulfills: 5" + "governs: 2"
- Document: download icon

**Row 7: Business Continuity Plan**
- Name: "Business Continuity Plan"
- Description: "Outlines strategies and procedures for maintaining critical operations during and after a disaster or significant disruption."
- Review Date: green → "Aug 1, 2026"
- Controls: "4"
- Relationships: "fulfills: 4"
- Document: download icon

**Row 8: Vendor Management Policy**
- Name: "Vendor Management Policy"
- Description: "Defines requirements for vendor due diligence, risk assessment, contractual obligations, and ongoing monitoring of third-party providers."
- Review Date: amber → "Feb 28, 2026" (imminent)
- Controls: "3"
- Relationships: "governs: 3"
- Document: download icon

### Review Date Color Logic
- Past date: `text-red-700` with `error` icon (14px) — overdue
- Within 30 days: `text-amber-700` with `schedule` icon (14px) — due soon
- 30+ days out: `text-green-700` with `check_circle` icon (14px) — current

### Relationship Chips
Use a consistent small chip for each type:
- `fulfills`: `bg-[#E8F4F4] text-[#006C75]`
- `governs`: `bg-gray-100 text-gray-600`
- `requires_acknowledgement`: `bg-amber-50 text-amber-700`

Format: `{type}: {count}`

---

## Footer
`border-t border-gray-200 bg-gray-50 px-4 py-2`
- Left: `text-xs text-gray-500` → "8 policies"
- No pagination needed (small dataset)

---

## Key Visual Notes
- Policy names are **links** to `/policies/[id]` detail pages — use primary teal link style
- The "Global Scope" badge reinforces that policies are NOT audit-scoped
- Review date is the key health indicator — use color to draw attention to overdue/upcoming reviews
- Relationship type chips provide at-a-glance visibility into how each policy connects to controls
- No upload or create actions in v1 — policies are managed externally (file_path reference)
- Table density matches Controls Library — compact rows, clear hierarchy
- Document column shows a download/view icon that would open the policy file
