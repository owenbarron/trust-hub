import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureActiveAudit, notFound } from "@/lib/api";
import { db } from "@/lib/db";
import { getEvidenceList } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auditId = params.get("auditId");

  if (!auditId) {
    return badRequest("`auditId` query parameter is required.");
  }

  const evidence = getEvidenceList({
    auditId,
    q: params.get("q") ?? undefined,
    type: params.get("type") ?? undefined,
  });

  return NextResponse.json({ evidence });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const auditId = (body?.auditId as string | undefined)?.trim();
  const filename = (body?.filename as string | undefined)?.trim();
  const filePath = (body?.filePath as string | undefined)?.trim();

  if (!auditId || !filename || !filePath) {
    return badRequest("`auditId`, `filename`, and `filePath` are required.");
  }

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const fileType =
    (body?.fileType as string | undefined)?.trim() ||
    filename.split(".").pop()?.toLowerCase() ||
    "unknown";

  const controlIds = Array.isArray(body?.controlIds)
    ? (body.controlIds as string[]).filter(Boolean)
    : [];

  const requestIds = Array.isArray(body?.requestIds)
    ? (body.requestIds as string[]).filter(Boolean)
    : [];

  const trx = db().transaction(() => {
    const insertEvidence = db().prepare(
      `INSERT INTO evidence (filename, file_path, file_type, file_size, description, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    );

    const evidenceResult = insertEvidence.run(
      filename,
      filePath,
      fileType,
      typeof body?.fileSize === "number" ? body.fileSize : null,
      (body?.description as string | undefined) ?? null,
      (body?.uploadedBy as string | undefined) ?? "System",
    );

    const evidenceId = Number(evidenceResult.lastInsertRowid);

    const linkControl = db().prepare(
      `INSERT OR IGNORE INTO control_evidence (control_id, evidence_id, audit_id) VALUES (?, ?, ?)`
    );
    const linkRequest = db().prepare(
      `INSERT OR IGNORE INTO request_evidence (request_id, evidence_id) VALUES (?, ?)`
    );

    for (const controlId of controlIds) {
      linkControl.run(controlId, evidenceId, auditId);
    }

    for (const requestId of requestIds) {
      const request = db()
        .prepare(`SELECT id, audit_id FROM requests WHERE id = ?`)
        .get(requestId) as { id: string; audit_id: string } | undefined;

      if (!request || request.audit_id !== auditId) {
        throw new Error(`Request ${requestId} does not belong to audit ${auditId}.`);
      }

      linkRequest.run(requestId, evidenceId);

      const linkedControls = db()
        .prepare(`SELECT control_id FROM request_controls WHERE request_id = ?`)
        .all(requestId) as Array<{ control_id: string }>;

      for (const row of linkedControls) {
        linkControl.run(row.control_id, evidenceId, auditId);
      }
    }

    return { evidenceId };
  });

  try {
    const result = trx();
    return NextResponse.json({ ok: true, evidenceId: result.evidenceId }, { status: 201 });
  } catch (error) {
    return badRequest("Failed to upload/link evidence.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
