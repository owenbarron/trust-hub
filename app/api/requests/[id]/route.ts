import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureActiveAudit, notFound } from "@/lib/api";
import { db } from "@/lib/db";
import { getRequestDetail } from "@/lib/queries";

interface Params {
  params: { id: string };
}

function requestAudit(requestId: string): string | null {
  const row = db()
    .prepare(`SELECT audit_id FROM requests WHERE id = ?`)
    .get(requestId) as { audit_id: string } | undefined;
  return row?.audit_id ?? null;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auditId = request.nextUrl.searchParams.get("auditId");
  if (!auditId) {
    return badRequest("`auditId` query parameter is required.");
  }

  const detail = getRequestDetail(params.id, auditId);
  if (!detail) {
    return notFound(`Request ${params.id} not found in audit ${auditId}.`);
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const auditId = (body?.auditId as string | undefined) ?? requestAudit(params.id);

  if (!auditId) {
    return notFound(`Request ${params.id} not found.`);
  }

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const patch: Record<string, unknown> = {};
  const allowed = ["summary", "description", "status", "priority", "assignee", "source", "due_date"] as const;
  for (const key of allowed) {
    if (key in body) {
      patch[key] = body[key as keyof typeof body];
    }
  }

  if (Object.keys(patch).length === 0) {
    return badRequest("At least one patch field is required.");
  }

  const setSql = Object.keys(patch)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(patch), params.id, auditId];

  const result = db()
    .prepare(
      `UPDATE requests
       SET ${setSql}, updated_at = datetime('now')
       WHERE id = ? AND audit_id = ?`
    )
    .run(...values);

  if (result.changes === 0) {
    return notFound(`Request ${params.id} not found in audit ${auditId}.`);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auditId = request.nextUrl.searchParams.get("auditId") ?? requestAudit(params.id);
  if (!auditId) {
    return notFound(`Request ${params.id} not found.`);
  }

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const trx = db().transaction(() => {
    db().prepare(`DELETE FROM request_evidence WHERE request_id = ?`).run(params.id);
    db().prepare(`DELETE FROM request_controls WHERE request_id = ?`).run(params.id);
    db().prepare(`DELETE FROM comments WHERE request_id = ?`).run(params.id);
    db().prepare(`DELETE FROM requests WHERE id = ? AND audit_id = ?`).run(params.id, auditId);
  });

  trx();

  return NextResponse.json({ ok: true });
}
