import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, notFound } from "@/lib/api";
import { closeAudit, db, getActiveAudit, getAudit, getAudits, startNewAudit } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ audits: getAudits() });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const auditId = (body?.auditId as string | undefined) ?? getActiveAudit()?.id;

  if (!auditId) {
    return badRequest("No active audit found to close.");
  }

  const audit = getAudit(auditId);
  if (!audit) {
    return notFound(`Audit ${auditId} not found.`);
  }

  if (audit.status !== "active") {
    return conflict(`Audit ${auditId} is already closed.`);
  }

  closeAudit(auditId);
  return NextResponse.json({ ok: true, auditId });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const id = (body?.id as string | undefined)?.trim();
  const name = (body?.name as string | undefined)?.trim();

  if (!id || !name) {
    return badRequest("Both `id` and `name` are required.");
  }

  if (getAudit(id)) {
    return conflict(`Audit ${id} already exists.`);
  }

  if (getActiveAudit()) {
    return conflict("Close the current active audit before starting a new one.");
  }

  try {
    startNewAudit({
      id,
      name,
      periodStart: (body?.periodStart as string | undefined) ?? null,
      periodEnd: (body?.periodEnd as string | undefined) ?? null,
      auditorFirm: (body?.auditorFirm as string | undefined) ?? null,
    });
  } catch (error) {
    return badRequest("Failed to start audit.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const created = db().prepare(`SELECT * FROM audits WHERE id = ?`).get(id);
  return NextResponse.json({ ok: true, audit: created }, { status: 201 });
}
