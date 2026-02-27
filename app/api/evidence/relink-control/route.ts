import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureActiveAudit, notFound } from "@/lib/api";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const auditId = (body?.auditId as string | undefined)?.trim();
  const controlId = (body?.controlId as string | undefined)?.trim();
  const evidenceId = Number(body?.evidenceId);

  if (!auditId || !controlId || !Number.isFinite(evidenceId)) {
    return badRequest("`auditId`, `controlId`, and numeric `evidenceId` are required.");
  }

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const evidence = db()
    .prepare(`SELECT id FROM evidence WHERE id = ?`)
    .get(evidenceId) as { id: number } | undefined;
  if (!evidence) {
    return notFound(`Evidence ${evidenceId} not found.`);
  }

  db()
    .prepare(
      `INSERT OR IGNORE INTO control_evidence (control_id, evidence_id, audit_id) VALUES (?, ?, ?)`
    )
    .run(controlId, evidenceId, auditId);

  return NextResponse.json({ ok: true });
}
