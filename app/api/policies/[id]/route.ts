import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound } from "@/lib/api";
import { db } from "@/lib/db";
import { getPolicyDetail } from "@/lib/queries";

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const policyId = Number(params.id);
  const auditId = request.nextUrl.searchParams.get("auditId");

  if (!Number.isFinite(policyId)) {
    return badRequest("Invalid policy id.");
  }
  if (!auditId) {
    return badRequest("`auditId` query parameter is required.");
  }

  const detail = getPolicyDetail(policyId, auditId);
  if (!detail) {
    return notFound(`Policy ${params.id} not found.`);
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const policyId = Number(params.id);
  if (!Number.isFinite(policyId)) {
    return badRequest("Invalid policy id.");
  }

  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  const fields = ["name", "description", "version", "owner", "file_path", "review_date"] as const;

  for (const field of fields) {
    if (field in body) {
      patch[field] = body[field as keyof typeof body];
    }
  }

  if (Object.keys(patch).length === 0 && !("controls" in body)) {
    return badRequest("Provide at least one field or controls payload.");
  }

  const trx = db().transaction(() => {
    if (Object.keys(patch).length > 0) {
      const setSql = Object.keys(patch)
        .map((key) => `${key} = ?`)
        .join(", ");
      db()
        .prepare(
          `UPDATE policies
           SET ${setSql}, updated_at = datetime('now')
           WHERE id = ?`
        )
        .run(...Object.values(patch), policyId);
    }

    if ("controls" in body && Array.isArray(body.controls)) {
      db().prepare(`DELETE FROM policy_controls WHERE policy_id = ?`).run(policyId);
      const insert = db().prepare(
        `INSERT OR IGNORE INTO policy_controls (policy_id, control_id, relationship_type)
         VALUES (?, ?, ?)`
      );
      for (const link of body.controls as Array<{ controlId: string; relationshipType: string }>) {
        if (!link.controlId || !link.relationshipType) continue;
        insert.run(policyId, link.controlId, link.relationshipType);
      }
    }
  });

  trx();

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const policyId = Number(params.id);
  if (!Number.isFinite(policyId)) {
    return badRequest("Invalid policy id.");
  }

  const exists = db().prepare(`SELECT id FROM policies WHERE id = ?`).get(policyId) as
    | { id: number }
    | undefined;
  if (!exists) {
    return notFound(`Policy ${policyId} not found.`);
  }

  const trx = db().transaction(() => {
    db().prepare(`DELETE FROM policy_controls WHERE policy_id = ?`).run(policyId);
    db().prepare(`DELETE FROM policies WHERE id = ?`).run(policyId);
  });
  trx();

  return NextResponse.json({ ok: true });
}
