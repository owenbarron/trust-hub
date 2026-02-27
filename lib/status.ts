const STATUS_CLASS_MAP: Record<string, string> = {
  completed:
    "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  effective:
    "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  closed:
    "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  "in progress":
    "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20",
  submitted:
    "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20",
  "submitted to auditor":
    "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20",
  "not started":
    "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/20",
  "not tested":
    "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/20",
  "needs revision":
    "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20",
  expired:
    "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20",
  high:
    "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20",
  open:
    "inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20",
  informational:
    "inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20",
};

export function statusClass(value: string | null | undefined): string {
  const key = (value ?? "").toLowerCase().trim();
  return (
    STATUS_CLASS_MAP[key] ??
    "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/20"
  );
}

export function fileTypeIcon(fileType: string | null | undefined): {
  icon: string;
  iconClass: string;
  badgeClass: string;
} {
  const t = (fileType ?? "").toLowerCase();
  if (["pdf", "doc", "docx", "txt"].includes(t)) {
    return {
      icon: "description",
      iconClass: "text-red-500",
      badgeClass: "bg-red-50 text-red-700",
    };
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(t)) {
    return {
      icon: "image",
      iconClass: "text-purple-500",
      badgeClass: "bg-purple-50 text-purple-700",
    };
  }
  if (["xlsx", "xls", "csv"].includes(t)) {
    return {
      icon: "table_view",
      iconClass: "text-green-600",
      badgeClass: "bg-green-50 text-green-700",
    };
  }
  return {
    icon: "insert_drive_file",
    iconClass: "text-gray-500",
    badgeClass: "bg-gray-100 text-gray-700",
  };
}

export function reviewDateState(reviewDate: string | null): {
  className: string;
  icon: string;
  label: string;
} {
  if (!reviewDate) {
    return { className: "text-gray-500", icon: "help", label: "No date" };
  }

  const review = new Date(reviewDate);
  const now = new Date();
  const days = Math.ceil(
    (review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return { className: "text-red-700", icon: "error", label: "Past due" };
  }
  if (days <= 30) {
    return {
      className: "text-amber-700",
      icon: "schedule",
      label: `${days} days`,
    };
  }
  return {
    className: "text-green-700",
    icon: "check_circle",
    label: `${days} days`,
  };
}
