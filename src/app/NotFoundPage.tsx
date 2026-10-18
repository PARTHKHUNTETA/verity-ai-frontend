import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <p className="text-brand-600 text-sm font-semibold">404</p>
      <h1 className="text-ink mt-2 text-xl font-semibold">Page not found</h1>
      <Link to="/" className="text-brand-600 hover:text-brand-700 mt-4 text-sm font-medium">
        Back to VerityAI
      </Link>
    </div>
  );
}
