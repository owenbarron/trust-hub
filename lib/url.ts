export type SearchParamValue = string | string[] | undefined;

export function pickParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function withAudit(path: string, auditId: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}audit=${encodeURIComponent(auditId)}`;
}
