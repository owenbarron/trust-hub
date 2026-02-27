import React from "react";

function classNames(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function Path({ name }: { name: string }) {
  switch (name) {
    case "shield":
      return (
        <path d="M12 3l7 3v6c0 4.5-3.1 8.4-7 9-3.9-.6-7-4.5-7-9V6l7-3z" />
      );
    case "dashboard":
      return (
        <>
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="5" rx="1" />
          <rect x="13" y="10" width="8" height="11" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
        </>
      );
    case "verified_user":
      return (
        <>
          <path d="M12 3l7 3v6c0 4.5-3.1 8.4-7 9-3.9-.6-7-4.5-7-9V6l7-3z" />
          <path d="M9.5 12.5l1.8 1.8 3.2-3.6" />
        </>
      );
    case "fact_check":
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h3M9 16h4" />
          <path d="M14.5 12.5l1.2 1.2 2.3-2.6" />
        </>
      );
    case "grid_view":
      return (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </>
      );
    case "policy":
      return (
        <>
          <path d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <path d="M15 3v4h4" />
          <path d="M10 13l2 2 3-3" />
        </>
      );
    case "folder_open":
      return (
        <>
          <path d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v1H3V7z" />
          <path d="M3 10h18l-2 9H5l-2-9z" />
        </>
      );
    case "history":
      return (
        <>
          <path d="M4 12a8 8 0 108-8" />
          <path d="M4 4v5h5" />
          <path d="M12 8v5l3 2" />
        </>
      );
    case "chevron_right":
      return <path d="M9 6l6 6-6 6" />;
    case "check_circle":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.2 2.2 4.8-5" />
        </>
      );
    case "error":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
        </>
      );
    case "schedule":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </>
      );
    case "description":
      return (
        <>
          <path d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <path d="M15 3v4h4" />
          <path d="M9 11h6M9 15h6" />
        </>
      );
    case "image":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M5 17l5-5 3 3 3-2 3 4" />
        </>
      );
    case "table_view":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <path d="M3 10h18M3 14h18M9 5v14M15 5v14" />
        </>
      );
    case "insert_drive_file":
      return (
        <>
          <path d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <path d="M15 3v4h4" />
        </>
      );
    case "help":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9.5a2.3 2.3 0 114.2 1.2c0 1.3-1.6 1.8-2 2.6-.2.4-.2.7-.2 1" />
          <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={classNames("inline-block h-5 w-5 align-middle", className)}
    >
      <Path name={name} />
    </svg>
  );
}
