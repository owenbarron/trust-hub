#!/usr/bin/env npx tsx
/**
 * Trust Hub — Seed Script
 *
 * Single-file seed pipeline that ingests raw Hyperproof exports and evidence
 * files from seed-data/, transforms them to the v4 canonical schema, and
 * populates a local SQLite database.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Dependencies (install in the app project):
 *   npm install better-sqlite3 xlsx
 *   npm install -D @types/better-sqlite3 tsx
 *
 * Outputs:
 *   ./trust-hub.db  (SQLite database, gitignored)
 */

import Database from "better-sqlite3";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// ─── Configuration ──────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");
const SEED_DIR = path.join(ROOT, "seed-data");
const DB_PATH = path.join(ROOT, "trust-hub.db");

const CONTROLS_CSV = path.join(SEED_DIR, "program", "Controls.csv");
const CONTROLS_XLSX = path.join(SEED_DIR, "controls.xlsx");
const REQUIREMENTS_CSV = path.join(SEED_DIR, "program", "Requirements.csv");
const REQUESTS_XLSX = path.join(SEED_DIR, "requests.xlsx");
const EVIDENCE_DIR = path.join(SEED_DIR, "evidence");

const HYPERPROOF_EXPORT_DIR = path.join(SEED_DIR, "hyperproof-export");
const HYPERPROOF_PROOF_DIR = path.join(HYPERPROOF_EXPORT_DIR, "proof");

// Known Hyperproof user UUIDs → display names (supplemented at runtime from assignee objects)
const KNOWN_HP_USERS: Record<string, string> = {
  "bbb1abe4-8a99-11f0-aa45-63ec16ecbf94": "Owen Barron",
  "86f8ba74-4742-11ee-97d5-0fdfa36492bf": "Dan Chemnitz",
  "026c91a8-9fcf-11f0-9f8c-4bdb1f700ecc": "Sydney Buchel",
  "73ea9ec4-6d3e-11f0-a1ef-bb162a8b3ffe": "MJ Eldridge",
};

const AUDIT_2025 = {
  id: "2025-soc2-type2",
  name: "2025 SOC 2 Type II",
  status: "closed",
  period_start: "2025-10-01",
  period_end: "2025-12-31",
  auditor_firm: "BARR Advisory",
  closed_at: "2026-01-15",
};

const AUDIT_2026 = {
  id: "2026-soc2-type2",
  name: "2026 SOC 2 Type II",
  status: "active",
  period_start: "2026-01-01",
  period_end: "2026-12-31",
  auditor_firm: "BARR Advisory",
  closed_at: null,
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawControl {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: "control" | "policy";
  owner: string;
  implementation: string;
  testing: string;
  freshness: string | null; // ISO date or null
  automation: string;
  proofCount: number;
  criteriaIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface RawCriterion {
  id: string;
  name: string;
  category: string; // "Security / Common", "Availability", "Confidentiality"
  subcategory: string; // "Control Environment", etc.
}

interface RawRequest {
  hyperproofId: string; // R-18, R-47, etc.
  reference: string; // REQ001, Follow Up - 01, etc.
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  source: string;
  dueDate: string | null;
  linkedControls: string[];
}

interface EvidenceFile {
  filename: string;
  filePath: string; // relative to project root
  fileType: string;
  fileSize: number;
  controlId: string | null; // null for unlinked
}

interface PolicySeed {
  name: string;
  description: string;
  version: string;
  owner: string;
  filePath: string;
  reviewDate: string;
  controls: Array<{ controlId: string; relationship: string }>;
}

// ─── Schema DDL ─────────────────────────────────────────────────────────────

const SCHEMA = `
-- Audits
CREATE TABLE audits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'closed')),
  period_start TEXT,
  period_end TEXT,
  auditor_firm TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Controls (stable master records)
CREATE TABLE controls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  type TEXT NOT NULL DEFAULT 'control' CHECK(type IN ('control', 'policy')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Control Snapshots (per-audit mutable state)
CREATE TABLE control_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id TEXT NOT NULL REFERENCES controls(id),
  audit_id TEXT NOT NULL REFERENCES audits(id),
  name TEXT NOT NULL,
  description TEXT,
  implementation_status TEXT DEFAULT 'Not started',
  testing_status TEXT DEFAULT 'Not tested',
  automation_status TEXT DEFAULT 'Not started',
  owner TEXT,
  freshness_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(control_id, audit_id)
);

-- SOC 2 Criteria
CREATE TABLE criteria (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT
);

-- Control ↔ Criteria mapping (global)
CREATE TABLE control_criteria (
  control_id TEXT NOT NULL REFERENCES controls(id),
  criteria_id TEXT NOT NULL REFERENCES criteria(id),
  PRIMARY KEY (control_id, criteria_id)
);

-- Policies (global, not audit-scoped)
CREATE TABLE policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  owner TEXT,
  file_path TEXT,
  review_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Policy ↔ Control mapping (global)
CREATE TABLE policy_controls (
  policy_id INTEGER NOT NULL REFERENCES policies(id),
  control_id TEXT NOT NULL REFERENCES controls(id),
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('fulfills', 'governs', 'requires_acknowledgement')),
  PRIMARY KEY (policy_id, control_id)
);

-- Evidence files
CREATE TABLE evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Control ↔ Evidence (audit-scoped)
CREATE TABLE control_evidence (
  control_id TEXT NOT NULL REFERENCES controls(id),
  evidence_id INTEGER NOT NULL REFERENCES evidence(id),
  audit_id TEXT NOT NULL REFERENCES audits(id),
  PRIMARY KEY (control_id, evidence_id, audit_id)
);

-- Requests (audit-scoped)
CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  hyperproof_id TEXT,
  summary TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Open',
  priority TEXT DEFAULT 'Medium',
  assignee TEXT,
  source TEXT,
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Request ↔ Control
CREATE TABLE request_controls (
  request_id TEXT NOT NULL REFERENCES requests(id),
  control_id TEXT NOT NULL REFERENCES controls(id),
  PRIMARY KEY (request_id, control_id)
);

-- Request ↔ Evidence
CREATE TABLE request_evidence (
  request_id TEXT NOT NULL REFERENCES requests(id),
  evidence_id INTEGER NOT NULL REFERENCES evidence(id),
  PRIMARY KEY (request_id, evidence_id)
);

-- Comments (on requests)
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL REFERENCES requests(id),
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  visible_to_auditor INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit log (schema only for POC, not actively written to)
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  user TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata TEXT
);
`;

// ─── Utility Functions ──────────────────────────────────────────────────────

const warnings: string[] = [];

function warn(msg: string) {
  warnings.push(msg);
  console.log(`  ⚠ ${msg}`);
}

/** Parse "Fresh until M/D/YYYY" → ISO date, or null */
function parseFreshness(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null;
  const match = raw.match(/Fresh until (\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try "Expired on M/D/YYYY" pattern
  const expMatch = raw.match(/Expired.*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (expMatch) {
    const [, m, d, y] = expMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

/** Parse "M/D/YYYY" → ISO date */
function parseDate(raw: string | undefined | null): string {
  if (!raw || !raw.trim()) return "2025-09-01";
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "2025-09-01";
}

/** Normalize status casing */
function normalizeStatus(raw: string): string {
  const map: Record<string, string> = {
    "submitted to auditor": "Submitted to Auditor",
    "needs revision": "Needs Revision",
    "in progress": "In Progress",
    "not started": "Not Started",
    "not tested": "Not Tested",
    completed: "Completed",
    effective: "Effective",
    open: "Open",
    closed: "Closed",
    draft: "Draft",
  };
  return map[raw.toLowerCase().trim()] || raw.trim();
}

/** Normalize priority casing */
function normalizePriority(raw: string): string {
  const map: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return map[raw.toLowerCase().trim()] || "Medium";
}

/** Extract name from "Name (email)" format */
function parseAssignee(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const match = raw.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : raw.trim();
}

/** Get file extension as lowercase type */
function fileType(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  return ext || "unknown";
}

/** Parse criteria IDs from "CC8.1,CC7.1" format */
function parseCriteriaIds(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^(CC|A|C)\d/.test(s));
}

/** Parse criteria IDs from full requirement links string */
function parseCriteriaFromLinks(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  // Format: "AICPA SOC 2 - 2017 ...: CC1.1, CC1.5, CC6.2"
  const colonIdx = raw.lastIndexOf(":");
  if (colonIdx === -1) return parseCriteriaIds(raw);
  return parseCriteriaIds(raw.substring(colonIdx + 1));
}

function inferControlType(name: string): "control" | "policy" {
  if (!name) return "control";
  const policyRegex = /\b(policy|plan)\b/i;
  return policyRegex.test(name) ? "policy" : "control";
}

// ─── Parsers ────────────────────────────────────────────────────────────────

function parseControls(): RawControl[] {
  console.log("Parsing controls...");

  // Use controls.xlsx as primary (has proof counts + dates)
  // Fall back to Controls.csv if xlsx unavailable
  const controls: RawControl[] = [];

  if (fs.existsSync(CONTROLS_XLSX)) {
    const wb = XLSX.readFile(CONTROLS_XLSX);
    const ws = wb.Sheets["Controls"];
    if (!ws) throw new Error("No 'Controls' sheet in controls.xlsx");

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
    for (const row of rows) {
      const id = row["ID"];
      if (!id || !id.match(/^CTL-\d{3}$/)) continue;

      controls.push({
        id,
        name: row["Name"] || "",
        description: row["Description"] || "",
        domain: row["Domain"] || "",
        type: inferControlType(row["Name"] || ""),
        owner: row["Owner"] || "",
        implementation: normalizeStatus(row["Implementation"] || "Not started"),
        testing: normalizeStatus(row["Testing status"] || "Not tested"),
        freshness: parseFreshness(row["Freshness"]),
        automation: normalizeStatus(row["Automation"] || "Not started"),
        proofCount: parseInt(row["Proof count"] || "0", 10) || 0,
        criteriaIds: parseCriteriaFromLinks(row["Requirement links"]),
        notes: row["Notes"] || "",
        createdAt: parseDate(row["Created"]),
        updatedAt: parseDate(row["Updated"]),
      });
    }
  } else {
    // Fallback: parse CSV
    const wb = XLSX.readFile(CONTROLS_CSV);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

    for (const row of rows) {
      const id = row["ID"] || row["\ufeffID"];
      if (!id || !id.match(/^CTL-\d{3}$/)) continue;

      controls.push({
        id,
        name: row["Name"] || "",
        description: row["Description"] || "",
        domain: row["Domain"] || "",
        type: inferControlType(row["Name"] || ""),
        owner: row["Owner"] || "",
        implementation: normalizeStatus(row["Implementation"] || "Not started"),
        testing: normalizeStatus(
          row["Testing status"] || row["Testing Status"] || "Not tested"
        ),
        freshness: parseFreshness(row["Freshness"]),
        automation: "Not started",
        proofCount: 0,
        criteriaIds: parseCriteriaIds(row["Maps to requirement"]),
        notes: row["Notes"] || "",
        createdAt: "2025-09-01",
        updatedAt: "2025-11-24",
      });
    }
  }

  console.log(`  Found ${controls.length} controls`);
  return controls;
}

function parseCriteria(): RawCriterion[] {
  console.log("Parsing criteria...");

  const wb = XLSX.readFile(REQUIREMENTS_CSV);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

  const criteria: RawCriterion[] = [];
  for (const row of rows) {
    const section1 = row["Section1"] || row["\ufeffSection1"] || "";
    const section2 = row["Section2"] || "";
    const id = row["ID"] || "";
    const requirement = row["Requirement"] || "";

    if (!id || !id.match(/^(CC|A|C)\d/)) continue;

    // Extract just the principle statement (first sentence or two)
    const name = requirement.split("\n")[0].trim();

    criteria.push({
      id,
      name,
      category: section1.trim(),
      subcategory: section2.trim(),
    });
  }

  console.log(`  Found ${criteria.length} criteria`);
  return criteria;
}

function parseRequests(): RawRequest[] {
  console.log("Parsing requests...");

  const wb = XLSX.readFile(REQUESTS_XLSX);
  const ws = wb.Sheets["Requests"];
  if (!ws) throw new Error("No 'Requests' sheet in requests.xlsx");

  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
  const requests: RawRequest[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const hyperproofId = row["ID"] || "";
    const reference = row["Reference"] || "";
    if (!reference || seen.has(reference)) continue;
    seen.add(reference);

    const linkedRaw = (row["Linked controls"] || "").toString().trim();
    const linkedControls = linkedRaw
      ? linkedRaw
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.match(/^CTL-\d{3}$/))
      : [];

    requests.push({
      hyperproofId,
      reference,
      summary: (row["Summary"] || "").toString().trim(),
      description: (row["Description"] || "").toString().trim(),
      status: normalizeStatus(row["Status"] || "Open"),
      priority: normalizePriority(row["Priority"] || "medium"),
      assignee: parseAssignee(row["Assignee"]),
      source: row["Source"] || "",
      dueDate: null,
      linkedControls,
    });
  }

  console.log(`  Found ${requests.length} requests`);
  return requests;
}

function scanEvidence(): EvidenceFile[] {
  console.log("Scanning evidence files...");

  const files: EvidenceFile[] = [];
  if (!fs.existsSync(EVIDENCE_DIR)) {
    warn("Evidence directory not found — skipping evidence scan");
    return files;
  }

  const entries = fs.readdirSync(EVIDENCE_DIR);
  for (const entry of entries) {
    const entryPath = path.join(EVIDENCE_DIR, entry);
    const stat = fs.statSync(entryPath);

    if (stat.isDirectory()) {
      const controlMatch = entry.match(/^CTL-\d{3}$/);
      const controlId = controlMatch ? entry : null;

      const subFiles = fs.readdirSync(entryPath);
      for (const f of subFiles) {
        if (f.startsWith(".")) continue;
        const filePath = path.join(entryPath, f);
        const fileStat = fs.statSync(filePath);
        if (!fileStat.isFile()) continue;

        files.push({
          filename: f,
          filePath: path.relative(ROOT, filePath),
          fileType: fileType(f),
          fileSize: fileStat.size,
          controlId,
        });
      }
    }
  }

  const linked = files.filter((f) => f.controlId).length;
  const unlinked = files.filter((f) => !f.controlId).length;
  console.log(
    `  Found ${files.length} files (${linked} linked, ${unlinked} unlinked)`
  );

  return files;
}

// ─── Hyperproof Export Loader ────────────────────────────────────────────────

interface HyperproofExportEntry {
  requestRef: string;
  requestUuid: string;
  comments: Array<{
    createdBy: string;
    createdOn: string;
    body: string; // commentTextFormatted, {{user:UUID}} not yet resolved
  }>;
  proof: Array<{
    filename: string;
    size: number;
    ownedBy: string;
    uploadedOn: string;
    contentType: string;
    controlIdentifiers?: string[];
  }>;
}

function loadHyperproofExports(): {
  exports: Map<string, HyperproofExportEntry>;
  userMap: Map<string, string>;
} {
  const exports = new Map<string, HyperproofExportEntry>();
  const userMap = new Map<string, string>(Object.entries(KNOWN_HP_USERS));

  if (!fs.existsSync(HYPERPROOF_EXPORT_DIR)) {
    return { exports, userMap };
  }

  const files = fs
    .readdirSync(HYPERPROOF_EXPORT_DIR)
    .filter((f) => f.endsWith(".json") && f !== "_summary.json");

  for (const file of files) {
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(HYPERPROOF_EXPORT_DIR, file), "utf8")
      ) as {
        request: Record<string, unknown>;
        comments: Record<string, unknown>[];
        proof: Record<string, unknown>[];
      };

      const { request, comments, proof } = raw;

      // Supplement user map from assignee objects
      const assignee = request.assignee as
        | Record<string, string>
        | undefined;
      if (assignee?.userId && assignee?.givenName) {
        userMap.set(
          assignee.userId,
          `${assignee.givenName} ${assignee.surname || ""}`.trim()
        );
      }

      const reference = request.reference as string;
      const requestUuid = request.id as string;

      // Only include real comments (all events happen to be "Comment" but be explicit)
      const realComments = comments
        .filter((c) => (c.event as string) === "Comment")
        .map((c) => ({
          createdBy: c.createdBy as string,
          createdOn: c.createdOn as string,
          body: c.commentTextFormatted as string,
        }));

      const proofItems = proof.map((p) => ({
        filename: p.filename as string,
        size: (p.size as number) || 0,
        ownedBy: ((p.ownedBy || p.createdBy) as string) || "",
        uploadedOn: ((p.uploadedOn || p.createdOn) as string) || "",
        contentType: (p.contentType as string) || "",
        controlIdentifiers: p.controlIdentifiers as string[] | undefined,
      }));

      exports.set(reference, {
        requestRef: reference,
        requestUuid,
        comments: realComments,
        proof: proofItems,
      });
    } catch (e) {
      warn(`Failed to parse export file ${file}: ${e}`);
    }
  }

  console.log(
    `  Loaded ${exports.size} requests from Hyperproof export, ${userMap.size} known users`
  );
  return { exports, userMap };
}

/** Replace {{user:UUID}} mentions with @Name */
function resolveUserMentions(
  text: string,
  userMap: Map<string, string>
): string {
  return text.replace(/\{\{user:([^}]+)\}\}/g, (_: string, uuid: string) => {
    const name = userMap.get(uuid);
    return name ? `@${name}` : "@someone";
  });
}

// ─── Policy Seed Data ───────────────────────────────────────────────────────

function getPolicies(): PolicySeed[] {
  return [
    {
      name: "Information Security Policy",
      description:
        "Establishes the framework for information security management across the organization, including classification, handling, and protection requirements.",
      version: "v3.0",
      owner: "Owen Barron",
      filePath: "policies/information-security-policy-v3.pdf",
      reviewDate: "2026-03-15",
      controls: [
        { controlId: "CTL-002", relationship: "fulfills" },
        { controlId: "CTL-022", relationship: "fulfills" },
        { controlId: "CTL-031", relationship: "fulfills" },
        { controlId: "CTL-037", relationship: "fulfills" },
        { controlId: "CTL-038", relationship: "fulfills" },
        { controlId: "CTL-052", relationship: "fulfills" },
        { controlId: "CTL-053", relationship: "fulfills" },
        { controlId: "CTL-055", relationship: "fulfills" },
        { controlId: "CTL-013", relationship: "governs" },
        { controlId: "CTL-023", relationship: "governs" },
        { controlId: "CTL-028", relationship: "governs" },
        { controlId: "CTL-070", relationship: "governs" },
      ],
    },
    {
      name: "Acceptable Use Policy",
      description:
        "Defines acceptable use of company IT resources, including internet, email, and social media usage guidelines for all employees.",
      version: "v2.0",
      owner: "MJ Eldridge",
      filePath: "policies/acceptable-use-policy-v2.pdf",
      reviewDate: "2025-11-01",
      controls: [
        { controlId: "CTL-007", relationship: "governs" },
        { controlId: "CTL-032", relationship: "governs" },
        { controlId: "CTL-060", relationship: "governs" },
        { controlId: "CTL-062", relationship: "governs" },
        { controlId: "CTL-063", relationship: "governs" },
        { controlId: "CTL-064", relationship: "governs" },
      ],
    },
    {
      name: "Data Retention & Disposal Policy",
      description:
        "Specifies retention periods for different data categories and secure disposal procedures for physical and digital records.",
      version: "v1.2",
      owner: "Owen Barron",
      filePath: "policies/data-retention-disposal-v1.2.pdf",
      reviewDate: "2026-04-01",
      controls: [
        { controlId: "CTL-066", relationship: "fulfills" },
        { controlId: "CTL-067", relationship: "fulfills" },
        { controlId: "CTL-068", relationship: "fulfills" },
        { controlId: "CTL-056", relationship: "governs" },
        { controlId: "CTL-057", relationship: "governs" },
      ],
    },
    {
      name: "Incident Response Plan",
      description:
        "Documents procedures for identifying, containing, eradicating, and recovering from security incidents, including escalation procedures.",
      version: "v2.1",
      owner: "Owen Barron",
      filePath: "policies/incident-response-plan-v2.1.pdf",
      reviewDate: "2026-06-30",
      controls: [
        { controlId: "CTL-025", relationship: "fulfills" },
        { controlId: "CTL-075", relationship: "fulfills" },
        { controlId: "CTL-076", relationship: "fulfills" },
        { controlId: "CTL-080", relationship: "fulfills" },
        { controlId: "CTL-019", relationship: "fulfills" },
        { controlId: "CTL-027", relationship: "fulfills" },
        { controlId: "CTL-008", relationship: "requires_acknowledgement" },
        { controlId: "CTL-014", relationship: "requires_acknowledgement" },
      ],
    },
    {
      name: "Access Control Policy",
      description:
        "Governs user access provisioning, deprovisioning, and periodic access reviews across production systems and sensitive data stores.",
      version: "v2.1",
      owner: "Owen Barron",
      filePath: "policies/access-control-policy-v2.1.pdf",
      reviewDate: "2026-05-15",
      controls: [
        { controlId: "CTL-015", relationship: "fulfills" },
        { controlId: "CTL-016", relationship: "fulfills" },
        { controlId: "CTL-024", relationship: "fulfills" },
        { controlId: "CTL-045", relationship: "fulfills" },
        { controlId: "CTL-058", relationship: "fulfills" },
        { controlId: "CTL-059", relationship: "fulfills" },
        { controlId: "CTL-061", relationship: "fulfills" },
        { controlId: "CTL-069", relationship: "fulfills" },
        { controlId: "CTL-074", relationship: "fulfills" },
        { controlId: "CTL-010", relationship: "governs" },
        { controlId: "CTL-011", relationship: "governs" },
        { controlId: "CTL-033", relationship: "governs" },
        { controlId: "CTL-073", relationship: "governs" },
        { controlId: "CTL-001", relationship: "requires_acknowledgement" },
        { controlId: "CTL-003", relationship: "requires_acknowledgement" },
      ],
    },
    {
      name: "Change Management Policy",
      description:
        "Establishes the process for requesting, reviewing, approving, and implementing changes to production systems and infrastructure.",
      version: "v1.4",
      owner: "Igor Belagorudsky",
      filePath: "policies/change-management-policy-v1.4.pdf",
      reviewDate: "2026-03-01",
      controls: [
        { controlId: "CTL-046", relationship: "fulfills" },
        { controlId: "CTL-047", relationship: "fulfills" },
        { controlId: "CTL-048", relationship: "fulfills" },
        { controlId: "CTL-072", relationship: "fulfills" },
        { controlId: "CTL-078", relationship: "fulfills" },
        { controlId: "CTL-054", relationship: "governs" },
        { controlId: "CTL-077", relationship: "governs" },
      ],
    },
    {
      name: "Business Continuity Plan",
      description:
        "Outlines strategies and procedures for maintaining critical operations during and after a disaster or significant disruption.",
      version: "v1.1",
      owner: "Owen Barron",
      filePath: "policies/business-continuity-plan-v1.1.pdf",
      reviewDate: "2026-08-01",
      controls: [
        { controlId: "CTL-017", relationship: "fulfills" },
        { controlId: "CTL-082", relationship: "fulfills" },
        { controlId: "CTL-089", relationship: "fulfills" },
        { controlId: "CTL-090", relationship: "fulfills" },
      ],
    },
    {
      name: "Vendor Management Policy",
      description:
        "Defines requirements for vendor due diligence, risk assessment, contractual obligations, and ongoing monitoring of third-party providers.",
      version: "v1.0",
      owner: "MJ Eldridge",
      filePath: "policies/vendor-management-policy-v1.pdf",
      reviewDate: "2026-02-28",
      controls: [
        { controlId: "CTL-005", relationship: "governs" },
        { controlId: "CTL-041", relationship: "governs" },
        { controlId: "CTL-042", relationship: "governs" },
      ],
    },
  ];
}

// ─── Comment Seed Data ──────────────────────────────────────────────────────

function getComments(): Array<{
  requestId: string;
  author: string;
  body: string;
  visibleToAuditor: boolean;
  createdAt: string;
}> {
  return [
    // REQ001 — HRIS Listing (Dan uploads, Sydney asks, Dan responds)
    {
      requestId: "REQ001",
      author: "Dan Chemnitz",
      body: "Uploaded the active employee list, termination list, and HRIS configuration screenshot from Gusto. The termination list includes contractor conversions during the audit period.",
      visibleToAuditor: true,
      createdAt: "2025-10-26T14:30:00Z",
    },
    {
      requestId: "REQ001",
      author: "Sydney Buchel",
      body: "Thanks Dan. Now that the audit period is over, can you upload a new screenshot of the active employee list as of 12/31/2025? The current one appears to be from October.",
      visibleToAuditor: true,
      createdAt: "2026-01-19T21:07:00Z",
    },
    {
      requestId: "REQ001",
      author: "Dan Chemnitz",
      body: "Good catch — uploading the updated list now. The October screenshot was from our initial evidence collection.",
      visibleToAuditor: true,
      createdAt: "2026-01-20T10:08:00Z",
    },

    // Follow Up - 01 — GitHub Users (Owen responds)
    {
      requestId: "Follow Up - 01",
      author: "Owen Barron",
      body: "Here's the GitHub user list with permissions. We have 4 users with write access across our repositories. Igor and I have admin access. The two contractors have write access to their specific project repos only.",
      visibleToAuditor: true,
      createdAt: "2026-02-12T09:15:00Z",
    },
    {
      requestId: "Follow Up - 01",
      author: "Sydney Buchel",
      body: "Thank you, this looks complete. We can see the permission levels clearly.",
      visibleToAuditor: true,
      createdAt: "2026-02-12T16:42:00Z",
    },

    // Follow Up - 07 — Asset Management (needs revision back-and-forth)
    {
      requestId: "Follow Up - 07",
      author: "Owen Barron",
      body: "Uploaded screenshots showing FileVault encryption status and OS update status for both machines. Bella's laptop shows all patches current as of 12/28/2025.",
      visibleToAuditor: true,
      createdAt: "2026-02-15T11:30:00Z",
    },
    {
      requestId: "Follow Up - 07",
      author: "Sydney Buchel",
      body: "Thanks Owen. The encryption evidence looks good, but we also need evidence of the password/lock settings on both machines. Could you provide screenshots of the lock screen timeout and password requirements configuration?",
      visibleToAuditor: true,
      createdAt: "2026-02-16T14:20:00Z",
    },
    {
      requestId: "Follow Up - 07",
      author: "Owen Barron",
      body: "Working on getting those screenshots. MJ — can you grab the lock screen settings from your machine too?",
      visibleToAuditor: false,
      createdAt: "2026-02-16T15:45:00Z",
    },
    {
      requestId: "Follow Up - 07",
      author: "MJ Eldridge",
      body: "On it. I'll have them by EOD tomorrow.",
      visibleToAuditor: false,
      createdAt: "2026-02-16T16:10:00Z",
    },
  ];
}

// ─── Seed Functions ─────────────────────────────────────────────────────────

function seedAudits(db: Database.Database) {
  console.log("Seeding audits...");
  const stmt = db.prepare(`
    INSERT INTO audits (id, name, status, period_start, period_end, auditor_firm, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    AUDIT_2025.id,
    AUDIT_2025.name,
    AUDIT_2025.status,
    AUDIT_2025.period_start,
    AUDIT_2025.period_end,
    AUDIT_2025.auditor_firm,
    AUDIT_2025.closed_at
  );
  stmt.run(
    AUDIT_2026.id,
    AUDIT_2026.name,
    AUDIT_2026.status,
    AUDIT_2026.period_start,
    AUDIT_2026.period_end,
    AUDIT_2026.auditor_firm,
    AUDIT_2026.closed_at
  );
  console.log("  2 audits inserted");
}

function seedControls(db: Database.Database, controls: RawControl[]) {
  console.log("Seeding controls + snapshots...");

  const insertControl = db.prepare(`
    INSERT INTO controls (id, name, description, domain, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSnapshot = db.prepare(`
    INSERT INTO control_snapshots
      (control_id, audit_id, name, description, implementation_status,
       testing_status, automation_status, owner, freshness_date, notes,
       created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: RawControl[]) => {
    for (const c of rows) {
      insertControl.run(
        c.id,
        c.name,
        c.description,
        c.domain,
        c.type,
        c.createdAt,
        c.updatedAt
      );

      // 2025 snapshot (closed audit — represents end-of-audit state)
      insertSnapshot.run(
        c.id,
        AUDIT_2025.id,
        c.name,
        c.description,
        c.implementation,
        c.testing,
        c.automation,
        c.owner,
        c.freshness,
        c.notes,
        c.createdAt,
        c.updatedAt
      );

      // 2026 snapshot (active audit — cloned from 2025, same initial state)
      insertSnapshot.run(
        c.id,
        AUDIT_2026.id,
        c.name,
        c.description,
        c.implementation,
        c.testing,
        c.automation,
        c.owner,
        c.freshness,
        c.notes,
        c.updatedAt,
        c.updatedAt
      );
    }
  });

  insertMany(controls);
  console.log(
    `  ${controls.length} controls, ${controls.length * 2} snapshots`
  );
}

function seedCriteria(db: Database.Database, criteria: RawCriterion[]) {
  console.log("Seeding criteria...");
  const stmt = db.prepare(`
    INSERT INTO criteria (id, name, category, subcategory) VALUES (?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: RawCriterion[]) => {
    for (const c of rows) {
      stmt.run(c.id, c.name, c.category, c.subcategory);
    }
  });
  insertMany(criteria);
  console.log(`  ${criteria.length} criteria`);
}

function seedControlCriteria(
  db: Database.Database,
  controls: RawControl[],
  criteriaIds: Set<string>
) {
  console.log("Seeding control ↔ criteria mappings...");
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO control_criteria (control_id, criteria_id) VALUES (?, ?)
  `);

  let count = 0;
  const insertMany = db.transaction(() => {
    for (const c of controls) {
      for (const cid of c.criteriaIds) {
        if (!criteriaIds.has(cid)) {
          warn(
            `Control ${c.id} references unknown criteria "${cid}" — skipping`
          );
          continue;
        }
        stmt.run(c.id, cid);
        count++;
      }
    }
  });

  insertMany();
  console.log(`  ${count} mappings`);
}

function seedRequests(
  db: Database.Database,
  requests: RawRequest[],
  controlIds: Set<string>
) {
  console.log("Seeding requests + request_controls...");

  const insertRequest = db.prepare(`
    INSERT INTO requests
      (id, audit_id, hyperproof_id, summary, description, status,
       priority, assignee, source, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO request_controls (request_id, control_id)
    VALUES (?, ?)
  `);

  let linkCount = 0;
  const insertMany = db.transaction(() => {
    for (const r of requests) {
      // All seed requests belong to the 2025 audit
      insertRequest.run(
        r.reference,
        AUDIT_2025.id,
        r.hyperproofId,
        r.summary,
        r.description || null,
        r.status,
        r.priority,
        r.assignee || null,
        r.source || null,
        r.dueDate
      );

      for (const ctlId of r.linkedControls) {
        if (!controlIds.has(ctlId)) {
          warn(
            `Request ${r.reference} → ${ctlId} is invalid (control not found) — skipping`
          );
          continue;
        }
        insertLink.run(r.reference, ctlId);
        linkCount++;
      }
    }
  });

  insertMany();
  console.log(
    `  ${requests.length} requests, ${linkCount} request_controls links`
  );
}

function seedEvidence(
  db: Database.Database,
  files: EvidenceFile[],
  controlIds: Set<string>
) {
  console.log("Seeding evidence + control_evidence...");

  const inserters = [
    "Dan Chemnitz",
    "Owen Barron",
    "Owen Barron",
    "Dan Chemnitz",
    "MJ Eldridge",
    "Igor Belagorudsky",
    "Dan Chemnitz",
    "Owen Barron",
  ];

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (filename, file_path, file_type, file_size, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertControlEvidence = db.prepare(`
    INSERT OR IGNORE INTO control_evidence (control_id, evidence_id, audit_id)
    VALUES (?, ?, ?)
  `);

  let evidenceCount = 0;
  let linkCount = 0;

  // Map control_id → evidence IDs for later request_evidence linking
  const controlEvidenceMap = new Map<string, number[]>();

  const insertMany = db.transaction(() => {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];

      // Generate a plausible upload date within the 2025 audit period
      const dayOffset = (i * 7) % 90; // spread across ~3 months
      const uploadDate = new Date(2025, 9, 1 + dayOffset); // Oct 2025 base
      const uploadStr = uploadDate.toISOString().split("T")[0];

      const uploader = inserters[i % inserters.length];

      const result = insertEvidence.run(
        f.filename,
        f.filePath,
        f.fileType,
        f.fileSize,
        uploader,
        uploadStr
      );
      const evidenceId = Number(result.lastInsertRowid);
      evidenceCount++;

      // Link to control for both audits so evidence appears in active view
      if (f.controlId && controlIds.has(f.controlId)) {
        insertControlEvidence.run(f.controlId, evidenceId, AUDIT_2025.id);
        insertControlEvidence.run(f.controlId, evidenceId, AUDIT_2026.id);
        linkCount += 2;

        // Track for request_evidence linking
        const existing = controlEvidenceMap.get(f.controlId) || [];
        existing.push(evidenceId);
        controlEvidenceMap.set(f.controlId, existing);
      }
    }
  });

  insertMany();
  console.log(
    `  ${evidenceCount} evidence records, ${linkCount} control_evidence links (both audits)`
  );

  return controlEvidenceMap;
}

function seedRequestEvidence(
  db: Database.Database,
  requests: RawRequest[],
  controlEvidenceMap: Map<string, number[]>
) {
  console.log("Seeding request_evidence...");

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO request_evidence (request_id, evidence_id) VALUES (?, ?)
  `);

  let count = 0;
  const insertMany = db.transaction(() => {
    for (const r of requests) {
      // For each request, link evidence from its associated controls
      for (const ctlId of r.linkedControls) {
        const evidenceIds = controlEvidenceMap.get(ctlId) || [];
        for (const eid of evidenceIds) {
          stmt.run(r.reference, eid);
          count++;
        }
      }
    }
  });

  insertMany();
  console.log(`  ${count} request_evidence links`);
}

function seedPolicies(db: Database.Database, controlIds: Set<string>) {
  console.log("Seeding policies + policy_controls...");

  const insertPolicy = db.prepare(`
    INSERT INTO policies (name, description, version, owner, file_path, review_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO policy_controls (policy_id, control_id, relationship_type)
    VALUES (?, ?, ?)
  `);

  const policies = getPolicies();
  let linkCount = 0;

  const insertMany = db.transaction(() => {
    for (const p of policies) {
      const result = insertPolicy.run(
        p.name,
        p.description,
        p.version,
        p.owner,
        p.filePath,
        p.reviewDate
      );
      const policyId = Number(result.lastInsertRowid);

      for (const link of p.controls) {
        if (!controlIds.has(link.controlId)) {
          warn(
            `Policy "${p.name}" → ${link.controlId} is invalid — skipping`
          );
          continue;
        }
        insertLink.run(policyId, link.controlId, link.relationship);
        linkCount++;
      }
    }
  });

  insertMany();
  console.log(`  ${policies.length} policies, ${linkCount} policy_controls`);
}

function seedComments(db: Database.Database) {
  console.log("Seeding comments...");

  const stmt = db.prepare(`
    INSERT INTO comments (request_id, author, body, visible_to_auditor, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const comments = getComments();
  const insertMany = db.transaction(() => {
    for (const c of comments) {
      stmt.run(
        c.requestId,
        c.author,
        c.body,
        c.visibleToAuditor ? 1 : 0,
        c.createdAt
      );
    }
  });

  insertMany();
  console.log(`  ${comments.length} comments`);
}

function seedHyperproofComments(
  db: Database.Database,
  exports: Map<string, HyperproofExportEntry>,
  userMap: Map<string, string>
) {
  console.log("Seeding comments from Hyperproof export...");

  const stmt = db.prepare(`
    INSERT INTO comments (request_id, author, body, visible_to_auditor, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  let total = 0;
  const insertMany = db.transaction(() => {
    for (const [ref, entry] of exports) {
      for (const c of entry.comments) {
        const author = userMap.get(c.createdBy) || "Unknown";
        const body = resolveUserMentions(c.body, userMap);
        stmt.run(ref, author, body, 1, c.createdOn);
        total++;
      }
    }
  });

  insertMany();
  console.log(`  ${total} comments`);
}

function seedHyperproofEvidence(
  db: Database.Database,
  exports: Map<string, HyperproofExportEntry>,
  requests: RawRequest[],
  userMap: Map<string, string>,
  controlIds: Set<string>
) {
  console.log("Seeding Hyperproof proof files as evidence...");

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (filename, file_path, file_type, file_size, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertRequestEvidence = db.prepare(`
    INSERT OR IGNORE INTO request_evidence (request_id, evidence_id) VALUES (?, ?)
  `);
  const insertControlEvidence = db.prepare(`
    INSERT OR IGNORE INTO control_evidence (control_id, evidence_id, audit_id)
    VALUES (?, ?, ?)
  `);

  // Build request → linked controls map (CTL-XXX IDs from xlsx)
  const requestLinkedControls = new Map<string, string[]>();
  for (const r of requests) {
    requestLinkedControls.set(r.reference, r.linkedControls);
  }

  let evidenceCount = 0;
  let requestLinks = 0;
  let controlLinks = 0;
  let skipped = 0;

  const insertMany = db.transaction(() => {
    for (const [ref, entry] of exports) {
      const linkedControls = requestLinkedControls.get(ref) || [];

      for (const p of entry.proof) {
        const proofFilePath = path.join(
          HYPERPROOF_PROOF_DIR,
          entry.requestUuid,
          p.filename
        );

        // Use real file size from disk if available; fall back to metadata size
        const fileOnDisk = fs.existsSync(proofFilePath);
        if (!fileOnDisk) skipped++;
        const actualSize = fileOnDisk
          ? fs.statSync(proofFilePath).size
          : p.size;

        // Store relative path regardless — file may not be present on Vercel
        const relPath = path.relative(ROOT, proofFilePath);
        const uploader = userMap.get(p.ownedBy) || "Unknown";

        const result = insertEvidence.run(
          p.filename,
          relPath,
          fileType(p.filename),
          actualSize,
          uploader,
          p.uploadedOn
        );
        const evidenceId = Number(result.lastInsertRowid);
        evidenceCount++;

        // Always link to the request
        insertRequestEvidence.run(ref, evidenceId);
        requestLinks++;

        // Determine which controls to link (2025 audit only)
        const controlsToLink: string[] = [];
        if (p.controlIdentifiers && p.controlIdentifiers.length > 0) {
          // Explicit CTL-XXX identifiers on the proof item
          for (const ctlId of p.controlIdentifiers) {
            if (controlIds.has(ctlId)) controlsToLink.push(ctlId);
          }
        } else if (linkedControls.length === 1 && controlIds.has(linkedControls[0])) {
          // Request tied to exactly 1 valid control → auto-link
          controlsToLink.push(linkedControls[0]);
        }

        for (const ctlId of controlsToLink) {
          insertControlEvidence.run(ctlId, evidenceId, AUDIT_2025.id);
          controlLinks++;
        }
      }
    }
  });

  insertMany();
  console.log(
    `  ${evidenceCount} evidence records, ${requestLinks} request links, ` +
      `${controlLinks} control→evidence links, ${skipped} files not on disk`
  );
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validate(db: Database.Database) {
  console.log("\nValidating...");

  const counts: Record<string, number> = {};
  const tables = [
    "audits",
    "controls",
    "control_snapshots",
    "criteria",
    "control_criteria",
    "policies",
    "policy_controls",
    "evidence",
    "control_evidence",
    "requests",
    "request_controls",
    "request_evidence",
    "comments",
  ];

  for (const t of tables) {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as {
      c: number;
    };
    counts[t] = row.c;
  }

  // Expected counts
  const checks: Array<[string, number, string]> = [
    ["audits", 2, "exactly 2 (1 active, 1 closed)"],
    ["controls", 88, "88 master records"],
    ["control_snapshots", 176, "176 (88 × 2 audits)"],
    ["criteria", 38, "38 SOC 2 criteria"],
  ];

  let passed = 0;
  let failed = 0;

  for (const [table, expected, desc] of checks) {
    const actual = counts[table];
    if (actual === expected) {
      console.log(`  ✓ ${table}: ${actual} — ${desc}`);
      passed++;
    } else {
      console.log(
        `  ✗ ${table}: expected ${expected}, got ${actual} — ${desc}`
      );
      failed++;
    }
  }

  // Soft checks (no fixed expected value)
  for (const t of tables) {
    if (!checks.some(([name]) => name === t)) {
      console.log(`  · ${t}: ${counts[t]}`);
    }
  }

  // Verify one active audit
  const activeCount = (
    db
      .prepare(`SELECT COUNT(*) as c FROM audits WHERE status = 'active'`)
      .get() as { c: number }
  ).c;
  if (activeCount === 1) {
    console.log("  ✓ exactly 1 active audit");
    passed++;
  } else {
    console.log(`  ✗ expected 1 active audit, got ${activeCount}`);
    failed++;
  }

  // Verify control_evidence exists for 2026
  const ce2026 = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM control_evidence WHERE audit_id = '2026-soc2-type2'`
      )
      .get() as { c: number }
  ).c;
  if (ce2026 > 0) {
    console.log(`  ✓ ${ce2026} control_evidence links for 2026 audit`);
    passed++;
  } else {
    console.log(`  ✗ expected control_evidence for 2026, got ${ce2026}`);
    failed++;
  }

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (warnings.length > 0) {
    console.log(`  ${warnings.length} warnings during seeding`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("Trust Hub — Seed Script\n");
  console.log(`Database: ${DB_PATH}`);
  console.log(`Seed data: ${SEED_DIR}\n`);

  // Remove existing DB
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log("Removed existing database\n");
  }

  // Create database and schema
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  console.log("Schema created\n");

  // Parse source data
  const controls = parseControls();
  const criteria = parseCriteria();
  const requests = parseRequests();
  const evidenceFiles = scanEvidence();

  console.log("Loading Hyperproof export...");
  const { exports: hpExports, userMap } = loadHyperproofExports();

  const controlIds = new Set(controls.map((c) => c.id));
  const criteriaIds = new Set(criteria.map((c) => c.id));

  console.log("");

  // Insert in FK-respecting order
  seedAudits(db);
  seedControls(db, controls);
  seedCriteria(db, criteria);
  seedControlCriteria(db, controls, criteriaIds);
  seedRequests(db, requests, controlIds);
  const controlEvidenceMap = seedEvidence(db, evidenceFiles, controlIds);
  seedRequestEvidence(db, requests, controlEvidenceMap);
  seedPolicies(db, controlIds);

  // Comments and proof: use real Hyperproof export when available, fall back to hardcoded
  if (hpExports.size > 0) {
    seedHyperproofComments(db, hpExports, userMap);
    seedHyperproofEvidence(db, hpExports, requests, userMap, controlIds);
  } else {
    warn("Hyperproof export not found — using hardcoded placeholder comments");
    seedComments(db);
  }

  // Validate
  validate(db);

  db.close();
  console.log(`\nDone. Database written to ${DB_PATH}`);
}

main();
