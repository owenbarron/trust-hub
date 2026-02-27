# Seed Pipeline Implementation Plan (V4 Complete Set)

## Summary
Implement a deterministic seed-data pipeline in this repo that ingests raw files under [`seed-data`](/Users/owenbarron/Projects/trust-hub/seed-data), normalizes and augments to the v4 canonical model, validates integrity/counts, and emits:
- canonical JSON manifests
- DB-ready SQL inserts

This plan assumes implementation will be done in this repo (data-only workspace) and not inside an existing app scaffold.

## Scope and Success Criteria
- Produce a complete v4-aligned seed package covering `audits`, `controls`, `control_snapshots`, `criteria`, `control_criteria`, `policies`, `policy_controls`, `evidence`, `control_evidence`, `requests`, `request_controls`, `request_evidence`, `comments`.
- Preserve source provenance where data is transformed/augmented.
- Enforce v4 constraints in generated outputs.
- Generate an auditable quality report for every run.

## Files to Add
- [`tools/seed_pipeline/README.md`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/README.md)
- [`tools/seed_pipeline/run.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/run.py)
- [`tools/seed_pipeline/parsers.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/parsers.py)
- [`tools/seed_pipeline/normalize.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/normalize.py)
- [`tools/seed_pipeline/augment.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/augment.py)
- [`tools/seed_pipeline/validate.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/validate.py)
- [`tools/seed_pipeline/emit_json.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/emit_json.py)
- [`tools/seed_pipeline/emit_sql.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/emit_sql.py)
- [`tools/seed_pipeline/types.py`](/Users/owenbarron/Projects/trust-hub/tools/seed_pipeline/types.py)
- [`seed-data/config/policies_seed_map.json`](/Users/owenbarron/Projects/trust-hub/seed-data/config/policies_seed_map.json)
- [`seed-data/config/request_sample_ids.json`](/Users/owenbarron/Projects/trust-hub/seed-data/config/request_sample_ids.json)
- [`seed-data/config/normalization_overrides.json`](/Users/owenbarron/Projects/trust-hub/seed-data/config/normalization_overrides.json)

Generated outputs:
- [`seed-data/generated/canonical/*.json`](/Users/owenbarron/Projects/trust-hub/seed-data/generated/canonical)
- [`seed-data/generated/sql/seed.sql`](/Users/owenbarron/Projects/trust-hub/seed-data/generated/sql/seed.sql)
- [`seed-data/generated/reports/quality-report.json`](/Users/owenbarron/Projects/trust-hub/seed-data/generated/reports/quality-report.json)
- [`seed-data/generated/reports/unlinked-evidence-manifest.json`](/Users/owenbarron/Projects/trust-hub/seed-data/generated/reports/unlinked-evidence-manifest.json)

## Data Mapping and Transformation
- `controls` source: `seed-data/program/Controls.csv`.
- `criteria` source: `seed-data/program/Requirements.csv`.
- `requests` source: `seed-data/requests.xlsx` (Requests sheet).
- supplemental metadata source: `seed-data/controls.xlsx` (proof counts, timestamps).
- `evidence` source: `seed-data/evidence/**`.

Normalization rules:
- request status map:
  - `Submitted to auditor` -> `Submitted to Auditor`
  - `Needs revision` -> `Needs Revision`
- priority map:
  - `medium` -> `Medium`
- freshness parse:
  - `Fresh until M/D/YYYY` -> ISO date
  - `Expired on M/D/YYYY` -> ISO date
  - blank -> `null`

Validation rules:
- drop invalid `request_controls` links (currently `R-23 -> CTL-051`) and report as warning.
- require control IDs to match `CTL-\d{3}` and criteria IDs to match SOC2 pattern.
- enforce one active audit.

## Augmentation Rules (to Reach “Complete” v4 Set)
- `audits`: synthesize exactly two rows:
  - `2025-soc2-type2` (closed)
  - `2026-soc2-type2` (active)
- `control_snapshots`:
  - create 2025 snapshot from source values
  - clone to 2026 snapshot (same initial values)
- `requests`:
  - seed 8-sample set from configured IDs in `request_sample_ids.json`
  - ensure cross-status coverage by deterministic status assignment profile (`Open`, `In Progress`, `Submitted to Auditor`, `Needs Revision`, `Closed`)
  - preserve source fields in provenance metadata
- `comments`:
  - seed 6–10 comments across 3 requests, mixed `visible_to_auditor` true/false
- `evidence`:
  - placeholder-metadata mode only
  - include files from `CTL-*` folders as canonical control-linked evidence
  - keep `(no links)` files out of canonical joins and emit manifest
- `control_evidence`:
  - create links only for 2025 audit
  - no 2026 links
- `request_evidence`:
  - assign at least one evidence row to each sampled request
  - prefer evidence from request’s linked controls
- `policies` and `policy_controls`:
  - seed 8–10 policies from configured mapping
  - assign relationship types only from `fulfills | governs | requires_acknowledgement`
  - keep links global (no audit scope)

## Public Interfaces / Types
CLI contract:
- `python3 tools/seed_pipeline/run.py --input-root seed-data --output-root seed-data/generated --format json,sql`

Internal typed interfaces:
- `RawControl`, `RawCriterion`, `RawRequest`, `RawEvidenceFile`
- `CanonicalAudit`, `CanonicalControl`, `CanonicalControlSnapshot`, `CanonicalCriterion`, `CanonicalControlCriterion`, `CanonicalRequest`, `CanonicalRequestControl`, `CanonicalEvidence`, `CanonicalControlEvidence`, `CanonicalRequestEvidence`, `CanonicalPolicy`, `CanonicalPolicyControl`, `CanonicalComment`
- `QualityIssue` with severity `error|warning|info`

Manifest contract:
- each canonical row includes `source_ref` and optional `transform_notes` for auditability.

## Execution Steps
1. Implement parsers for CSV/XLSX/folder inventory.
2. Implement normalization and ID/status/date coercion.
3. Build canonical graph in memory for all tables.
4. Apply augmentation profiles for missing domains (audits, policies, comments, request_evidence).
5. Run validators and emit quality report.
6. Emit canonical JSON files per table.
7. Emit ordered SQL insert script respecting FK dependencies.
8. Add README runbook with expected counts and troubleshooting.

## Test Cases and Scenarios
- parser tests:
  - Controls CSV row count = 88
  - Requirements row count = 38
  - Requests row count = 54 raw
- normalization tests:
  - status/priority casing conversion
  - freshness parser for fresh/expired/blank
- augmentation tests:
  - audits count = 2 with one active
  - snapshots count = 176
  - sampled requests count = 8 and include 5 statuses
  - no `control_evidence` rows for 2026
- integrity tests:
  - no FK breaks in emitted SQL
  - policy relationship types restricted to enum
  - criteria coverage preserved (`control_criteria` = 222)
- report tests:
  - invalid links surfaced in `quality-report.json`
  - unlinked evidence surfaced in `unlinked-evidence-manifest.json`

## Assumptions and Defaults
- Path is `seed-data` (hyphenated), now canonical.
- Output format is both canonical JSON and SQL.
- Request seeding uses v4 sample scope (8 requests), not all 54.
- Evidence is placeholder metadata only; binaries are not required at runtime.
- Unknown/invalid request-control links are excluded from canonical joins and reported, not fatal.
