import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { Audit } from "./types";

// On Vercel, the project root is read-only at runtime. We seed the DB during
// the build step (vercel-build) so the file exists in the bundle, then copy
// it to /tmp (the only writable directory) on first use.
const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DB_PATH = path.join(process.cwd(), "trust-hub.db");
const RUNTIME_DB_PATH = IS_VERCEL ? "/tmp/trust-hub.db" : BUNDLED_DB_PATH;

declare global {
  // eslint-disable-next-line no-var
  var __trustHubDb: Database.Database | undefined;
}

function openDb(): Database.Database {
  if (!global.__trustHubDb) {
    if (IS_VERCEL && !fs.existsSync(RUNTIME_DB_PATH)) {
      fs.copyFileSync(BUNDLED_DB_PATH, RUNTIME_DB_PATH);
    }
    global.__trustHubDb = new Database(RUNTIME_DB_PATH, {
      fileMustExist: true,
    });
    global.__trustHubDb.pragma("foreign_keys = ON");
  }
  return global.__trustHubDb;
}

export function db(): Database.Database {
  return openDb();
}

export function getAudits(): Audit[] {
  return db()
    .prepare(
      `SELECT id, name, status, period_start, period_end, auditor_firm, closed_at, created_at, updated_at
       FROM audits
       ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, period_start DESC, created_at DESC`
    )
    .all() as Audit[];
}

export function getAudit(auditId: string): Audit | null {
  const row = db()
    .prepare(
      `SELECT id, name, status, period_start, period_end, auditor_firm, closed_at, created_at, updated_at
       FROM audits WHERE id = ?`
    )
    .get(auditId) as Audit | undefined;
  return row ?? null;
}

export function getActiveAudit(): Audit | null {
  const row = db()
    .prepare(
      `SELECT id, name, status, period_start, period_end, auditor_firm, closed_at, created_at, updated_at
       FROM audits
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get() as Audit | undefined;
  return row ?? null;
}

export function resolveAuditContext(auditId?: string): {
  audits: Audit[];
  selectedAudit: Audit;
  isReadOnly: boolean;
} {
  const audits = getAudits();
  if (audits.length === 0) {
    throw new Error("No audits found. Run `npx tsx scripts/seed.ts`.");
  }

  const active = audits.find((a) => a.status === "active") ?? audits[0];
  const selected = audits.find((a) => a.id === auditId) ?? active;

  return {
    audits,
    selectedAudit: selected,
    isReadOnly: selected.status === "closed",
  };
}

export function isAuditActive(auditId: string): boolean {
  const row = db()
    .prepare(`SELECT status FROM audits WHERE id = ?`)
    .get(auditId) as { status: string } | undefined;
  return row?.status === "active";
}

export function parseOwnerName(owner: string | null): string {
  if (!owner) return "Unassigned";
  const match = owner.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : owner.trim();
}

export function closeAudit(auditId: string): void {
  db()
    .prepare(
      `UPDATE audits
       SET status = 'closed',
           closed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ? AND status = 'active'`
    )
    .run(auditId);
}

export function startNewAudit(input: {
  id: string;
  name: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  auditorFirm?: string | null;
}): void {
  const active = getActiveAudit();
  if (active) {
    throw new Error("Cannot start a new audit while another audit is active.");
  }

  const sourceAudit = db()
    .prepare(
      `SELECT id FROM audits WHERE status = 'closed' ORDER BY closed_at DESC, created_at DESC LIMIT 1`
    )
    .get() as { id: string } | undefined;

  if (!sourceAudit) {
    throw new Error("Cannot start new audit: no closed audit found to clone.");
  }

  const trx = db().transaction(() => {
    db()
      .prepare(
        `INSERT INTO audits (id, name, status, period_start, period_end, auditor_firm, closed_at)
         VALUES (?, ?, 'active', ?, ?, ?, NULL)`
      )
      .run(
        input.id,
        input.name,
        input.periodStart ?? null,
        input.periodEnd ?? null,
        input.auditorFirm ?? null
      );

    db().prepare(
      `INSERT INTO control_snapshots
        (control_id, audit_id, name, description, implementation_status, testing_status,
         automation_status, owner, freshness_date, notes)
       SELECT control_id, ?, name, description, implementation_status, testing_status,
              automation_status, owner, freshness_date, notes
       FROM control_snapshots
       WHERE audit_id = ?`
    ).run(input.id, sourceAudit.id);
  });

  trx();
}
