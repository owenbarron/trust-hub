import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureActiveAudit, notFound } from "@/lib/api";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const requestId = (body?.requestId as string | undefined)?.trim();
  const author = (body?.author as string | undefined)?.trim();
  const message = (body?.body as string | undefined)?.trim();

  if (!requestId || !author || !message) {
    return badRequest("`requestId`, `author`, and `body` are required.");
  }

  const requestRow = db()
    .prepare(`SELECT id, audit_id FROM requests WHERE id = ?`)
    .get(requestId) as { id: string; audit_id: string } | undefined;

  if (!requestRow) {
    return notFound(`Request ${requestId} not found.`);
  }

  const auditCheck = ensureActiveAudit(requestRow.audit_id);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const result = db()
    .prepare(
      `INSERT INTO comments (request_id, author, body, visible_to_auditor, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
    .run(
      requestId,
      author,
      message,
      body?.visibleToAuditor ? 1 : 0
    );

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}
