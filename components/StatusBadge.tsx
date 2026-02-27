import { statusClass } from "@/lib/status";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value && value.trim().length > 0 ? value : "Unknown";
  return (
    <span className={statusClass(label)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label}
    </span>
  );
}
