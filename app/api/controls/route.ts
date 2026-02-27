import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api";
import { getControlsList } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auditId = params.get("auditId");

  if (!auditId) {
    return badRequest("`auditId` query parameter is required.");
  }

  const controls = getControlsList({
    auditId,
    q: params.get("q") ?? undefined,
    implementation: params.get("implementation") ?? undefined,
    testing: params.get("testing") ?? undefined,
    hasEvidence: params.get("hasEvidence") ?? undefined,
    sort: params.get("sort") ?? undefined,
  });

  return NextResponse.json({ controls });
}
