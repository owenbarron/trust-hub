import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api";
import { db } from "@/lib/db";
import { getPoliciesList } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const policies = getPoliciesList({
    q: params.get("q") ?? undefined,
    relationshipType: params.get("relationshipType") ?? undefined,
    reviewState: params.get("reviewState") ?? undefined,
    sort: params.get("sort") ?? undefined,
  });

  return NextResponse.json({ policies });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = (body?.name as string | undefined)?.trim();

  if (!name) {
    return badRequest("`name` is required.");
  }

  const trx = db().transaction(() => {
    const policyResult = db()
      .prepare(
        `INSERT INTO policies (name, description, version, owner, file_path, review_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        (body?.description as string | undefined) ?? null,
        (body?.version as string | undefined) ?? null,
        (body?.owner as string | undefined) ?? null,
        (body?.filePath as string | undefined) ?? null,
        (body?.reviewDate as string | undefined) ?? null,
      );

    const policyId = Number(policyResult.lastInsertRowid);

    const links = Array.isArray(body?.controls)
      ? (body.controls as Array<{ controlId: string; relationshipType: string }>)
      : [];

    const linkStmt = db().prepare(
      `INSERT OR IGNORE INTO policy_controls (policy_id, control_id, relationship_type) VALUES (?, ?, ?)`
    );

    for (const link of links) {
      if (!link.controlId || !link.relationshipType) continue;
      linkStmt.run(policyId, link.controlId, link.relationshipType);
    }

    return policyId;
  });

  try {
    const policyId = trx();
    return NextResponse.json({ ok: true, policyId }, { status: 201 });
  } catch (error) {
    return badRequest("Failed to create policy.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
