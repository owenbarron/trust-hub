import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureActiveAudit } from "@/lib/api";
import { db } from "@/lib/db";
import { getRequestsList } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auditId = params.get("auditId");

  if (!auditId) {
    return badRequest("`auditId` query parameter is required.");
  }

  const requests = getRequestsList({
    auditId,
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    priority: params.get("priority") ?? undefined,
    assignee: params.get("assignee") ?? undefined,
    sort: params.get("sort") ?? undefined,
  });

  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const id = (body?.id as string | undefined)?.trim();
  const auditId = (body?.auditId as string | undefined)?.trim();
  const summary = (body?.summary as string | undefined)?.trim();

  if (!id || !auditId || !summary) {
    return badRequest("`id`, `auditId`, and `summary` are required.");
  }

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const trx = db().transaction(() => {
    db()
      .prepare(
        `INSERT INTO requests
          (id, audit_id, hyperproof_id, summary, description, status, priority, assignee, source, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        auditId,
        (body?.hyperproofId as string | undefined) ?? null,
        summary,
        (body?.description as string | undefined) ?? null,
        (body?.status as string | undefined) ?? "Open",
        (body?.priority as string | undefined) ?? "Medium",
        (body?.assignee as string | undefined) ?? null,
        (body?.source as string | undefined) ?? null,
        (body?.dueDate as string | undefined) ?? null
      );

    const controls = Array.isArray(body?.controlIds)
      ? (body.controlIds as string[]).filter(Boolean)
      : [];

    const linkStmt = db().prepare(
      `INSERT OR IGNORE INTO request_controls (request_id, control_id) VALUES (?, ?)`
    );

    for (const controlId of controls) {
      linkStmt.run(id, controlId);
    }
  });

  try {
    trx();
  } catch (error) {
    return badRequest("Failed to create request.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
