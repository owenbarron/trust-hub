# 03 Styles

## Tailwind Config (Copy Exactly)
```html
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
```

## Color System

### Base Palette

| Token | Hex | Typical usage |
|---|---|---|
| `primary` | `#008a94` | Primary actions, links, active states |
| `primary-dark` | `#006c74` | Primary hover state |
| `primary-light` | `#e0f2f3` | Soft primary tint |
| `background-light` | `#f5f8f8` | App page background |
| `surface-light` | `#ffffff` | Cards, tables, panels |
| `border-light` | `#dae6e7` | Borders/dividers |
| `text-main` | `#101818` | Main text |
| `text-muted` | `#5e8a8d` | Secondary text |
| `slate-custom` | `#4C4C4E` | Sidebar background |

### Status Colors

| Semantic value | Class pattern |
|---|---|
| Completed / Effective / Closed | `bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium` |
| In progress / Submitted | `bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-medium` |
| Not started / Not tested | `bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium` |
| Needs revision / Expired / High | `bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-xs font-medium` |
| Open / Informational | `bg-cyan-50 text-cyan-700 border border-cyan-200/60 px-2.5 py-1 rounded-full text-xs font-medium` |

### Chip Colors

| Chip type | Class pattern |
|---|---|
| Control link chip | `bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded text-xs font-medium` |
| Request link chip | `bg-[#E6F8FB] text-[#0E7490] px-2 py-0.5 rounded text-xs font-medium` |
| Auditor-visible info chip | `bg-[#E6F8FB] text-[#0E7490] px-2 py-0.5 rounded text-xs font-medium` |

## Typography

| Element | Tailwind classes |
|---|---|
| Page title | `text-2xl font-bold text-gray-900 tracking-tight` |
| Section title | `text-lg font-semibold text-gray-900` |
| Table header | `text-xs font-semibold uppercase tracking-wider text-gray-500` |
| Table cell/body | `text-sm text-gray-700` |
| Metadata label | `text-xs font-medium text-gray-500 uppercase` |
| Metadata value | `text-sm text-gray-900` |
| Sidebar nav item | `text-sm font-medium` |

## Component Patterns

### Status Badges
- Base badge shape: `rounded-full text-xs font-medium`
- Use class mappings in the `Status Colors` table by status value.

### Linked-Entity Chips
- Control chip: `bg-[#E8F4F4] text-[#006C75] px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 inline-block`
- Request chip: `bg-[#E6F8FB] text-[#0E7490] px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 inline-block`
- Overflow chip (`+N more`): `bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium`

### Policy Relationship Chips
- `fulfills`: `bg-[#E8F4F4] text-[#006C75] px-1.5 py-0.5 rounded text-[10px] font-medium`
- `governs`: `bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium`
- `requires_acknowledgement`: `bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium`

### Table Pattern
- Wrapper: `bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm`
- Header row: `bg-gray-50 border-b border-gray-200`
- Header cell: `py-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500`
- Body row: `group transition-colors hover:bg-[#F1F5F9] border-b border-gray-100`
- Body cell: `px-3 py-4 align-top`
- Sticky header variant: `sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]`
- Zebra striping variant: apply `even:bg-gray-50/40` on body rows when needed.

### Card Pattern
- Standard: `bg-white border border-gray-200 rounded-lg p-4 shadow-sm`
- Detail/hero: `bg-white border border-gray-200 rounded-xl p-6 shadow-sm`
- Card header band: `px-6 py-4 border-b border-gray-200 bg-gray-50`

### Action Buttons
- Primary: `bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm`
- Secondary: `bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50`
- Destructive: `bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700`

### Filter Bar Pattern
- Container: `bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 shadow-sm z-10`
- Dropdown: `border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm text-gray-700 cursor-pointer hover:border-[#008C95]`
- Search input: `w-full border border-gray-300 rounded-md pl-10 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#008C95] focus:border-[#008C95]`

### Sidebar Pattern
- Sidebar container: `bg-[#4C4C4E]`
- Nav item base: `flex items-center px-3 py-1.5 text-sm font-medium rounded`
- Nav item inactive: `text-gray-300 hover:bg-white/10 hover:text-white`
- Nav item active: `bg-[#008C95] text-white shadow-sm`
- Top icon: Material Symbols `shield`
- Nav icon names:
  - Dashboard: `dashboard`
  - Controls: `verified_user`
  - Requests: `fact_check`
  - Criteria: `grid_view`
  - Policies: `policy`
  - Evidence: `folder_open`
  - Audits: `history`

### Breadcrumb Pattern
- Container: `flex items-center gap-2 mb-4 text-sm text-gray-500`
- Current node: `font-medium text-gray-900`
- Separator icon: Material Symbols `chevron_right`

### Empty States
- Container: centered within panel (`text-center` + generous vertical padding)
- Icon: muted icon (`text-gray-300`, ~48px)
- Message: `text-gray-500 text-sm`
- Optional CTA button uses primary button pattern.

## Review Date Color Logic (Policies)
- Past date: `text-red-700` + Material icon `error`.
- Within 30 days: `text-amber-700` + Material icon `schedule`.
- More than 30 days out: `text-green-700` + Material icon `check_circle`.

## File Type Icon Mapping (Evidence)
- `pdf` / document formats: icon `description`, icon class family `text-red-500`, badge family `bg-red-50 text-red-700`.
- `image` formats (`png`, `jpg`, etc.): icon `image`, icon class family `text-purple-500`, badge family `bg-purple-50 text-purple-700`.
- `xlsx` / `csv`: icon `table_view`, icon class family `text-green-600`, badge family `bg-green-50 text-green-700`.

## User Avatar Block Pattern
- Wrapper: `p-4 border-t border-white/10 bg-black/20 mt-auto`
- Avatar: `w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500`
- Initials: `OB`
- Name label: `text-white`
- Role label: `text-gray-400` with `Admin`
