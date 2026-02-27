import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureActiveAudit, notFound } from "@/lib/api";
import { db } from "@/lib/db";
import { getControlDetail } from "@/lib/queries";

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const auditId = request.nextUrl.searchParams.get("auditId");
  if (!auditId) {
    return badRequest("`auditId` query parameter is required.");
  }

  const control = getControlDetail(params.id, auditId);
  if (!control) {
    return notFound(`Control ${params.id} not found for audit ${auditId}.`);
  }

  return NextResponse.json({ control });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const auditId = (body?.auditId as string | undefined)?.trim();
  if (!auditId) {
    return badRequest("`auditId` is required.");
  }

  const auditCheck = ensureActiveAudit(auditId);
  if (!auditCheck.ok) {
    return auditCheck.response;
  }

  const patch: Record<string, unknown> = {};

  const allowed = [
    "implementation_status",
    "testing_status",
    "automation_status",
    "owner",
    "freshness_date",
    "notes",
  ] as const;

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
      `UPDATE control_snapshots
       SET ${setSql}, updated_at = datetime('now')
       WHERE control_id = ? AND audit_id = ?`
    )
    .run(...values);

  if (result.changes === 0) {
    return notFound(`Control ${params.id} snapshot not found in audit ${auditId}.`);
  }

  return NextResponse.json({ ok: true });
}
