import Link from "next/link";
import { Icon } from "@/components/Icon";

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-gray-900" : ""}>{item.label}</span>
            )}
            {!isLast ? (
              <Icon name="chevron_right" className="h-4 w-4" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
