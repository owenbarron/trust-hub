import { NextResponse } from "next/server";
import { getAudit, isAuditActive } from "@/lib/db";

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function ensureActiveAudit(auditId: string) {
  const audit = getAudit(auditId);
  if (!audit) {
    return { ok: false as const, response: notFound(`Audit ${auditId} not found.`) };
  }
  if (!isAuditActive(auditId)) {
    return {
      ok: false as const,
      response: conflict(`Audit ${auditId} is closed. Mutation is disabled.`),
    };
  }

  return { ok: true as const };
}
