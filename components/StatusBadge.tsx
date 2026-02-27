import { statusClass } from "@/lib/status";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value && value.trim().length > 0 ? value : "Unknown";
  return <span className={statusClass(label)}>{label}</span>;
}
