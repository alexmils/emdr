import Link from "next/link";

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-6 md:p-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← Back to session
        </Link>
        <div className="apple-card mt-5 p-8">
          <h1 className="text-large-title">Billing</h1>
          <p className="text-footnote mt-2 text-[var(--text-secondary)]">
            Subscription and payment management will be available in a future
            release.
          </p>
        </div>
      </div>
    </div>
  );
}
