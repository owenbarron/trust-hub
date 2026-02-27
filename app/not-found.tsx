import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light px-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm max-w-md w-full">
        <Icon name="error" className="h-12 w-12 text-gray-300" />
        <h1 className="mt-3 text-xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">The route or record you requested does not exist.</p>
        <Link
          href="/"
          className="mt-4 inline-flex bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
