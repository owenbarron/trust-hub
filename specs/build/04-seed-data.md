# 04 Seed Data

## Run Command
```bash
npx tsx scripts/seed.ts
```

## What It Produces
Running the seed script recreates `trust-hub.db` and seeds the canonical v4 schema.

### Seed Output Row Counts

| Table | Count |
|---|---:|
| `audits` | 2 |
| `controls` | 88 |
| `control_snapshots` | 176 |
| `criteria` | 38 |
| `control_criteria` | 222 |
| `policies` | 8 |
| `policy_controls` | 60 |
| `evidence` | 167 |
| `control_evidence` | 75 |
| `requests` | 54 |
| `request_controls` | 42 |
| `request_evidence` | 43 |
| `comments` | 9 |

Validation checks also confirm:
- Exactly 1 active audit
- No `control_evidence` links for `2026-soc2-type2`

## Source Files Read by the Seed Script
- `seed-data/controls.xlsx` (primary controls source)
- `seed-data/program/Controls.csv` (controls fallback source)
- `seed-data/program/Requirements.csv` (criteria source)
- `seed-data/requests.xlsx` (requests source)
- `seed-data/evidence/` (evidence file scan and metadata extraction)

## Evidence Strategy
- Database stores evidence metadata and linkages (`evidence`, `control_evidence`, `request_evidence`).
- File binaries live locally under `seed-data/evidence/` (and are referenced via `file_path`).
- Application behavior should attempt to show/open the local file when present.
- If a referenced local file is missing, UI should degrade gracefully with a "not available" message.

## Known Data Warning
- During request-control linking, one warning is expected:
  - `Request REQ032 → CTL-051 is invalid (control not found) — skipping`

## Key Data Characteristics
- All 54 requests are seeded into the 2025 closed audit (`2025-soc2-type2`); the 2026 active audit has no requests yet.
- Evidence-control links are seeded for the 2025 audit only; the 2026 audit has zero `control_evidence` links.
- Policy records are synthetic seed data (realistic examples, not sourced from Hyperproof export files).
- Comments are synthetic and concentrated across 3 requests (`REQ001`, `Follow Up - 01`, `Follow Up - 07`).
- Control owner source strings may include email in parentheses; UI should display owner name only.
