const STATUS_CLASS_MAP: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  effective: "bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  closed: "bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  "in progress": "bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  submitted: "bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  "submitted to auditor": "bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  "not started": "bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium",
  "not tested": "bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium",
  "needs revision": "bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  expired: "bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  high: "bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  open: "bg-cyan-50 text-cyan-700 border border-cyan-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
  informational: "bg-cyan-50 text-cyan-700 border border-cyan-200/60 px-2.5 py-1 rounded-full text-xs font-medium",
};

export function statusClass(value: string | null | undefined): string {
  const key = (value ?? "").toLowerCase().trim();
  return (
    STATUS_CLASS_MAP[key] ??
    "bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium"
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
