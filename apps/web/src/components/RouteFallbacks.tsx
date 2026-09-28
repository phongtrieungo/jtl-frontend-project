import { Link, type ErrorComponentProps } from '@tanstack/react-router';

const actionClass =
  'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2';

export function RoutePendingFallback(): JSX.Element {
  return (
    <section aria-labelledby="route-loading-heading" aria-busy="true" className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Loading</p>
        <h1 id="route-loading-heading" className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Preparing this page
        </h1>
      </div>
      <p role="status" className="sr-only">
        Loading page content
      </p>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </section>
  );
}

export function RouteErrorFallback({ reset }: ErrorComponentProps): JSX.Element {
  return (
    <section
      aria-labelledby="route-error-heading"
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm"
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-rose-700">Unexpected error</p>
      <h1 id="route-error-heading" className="mt-1 text-2xl font-bold">
        This page could not be displayed
      </h1>
      <p className="mt-2 max-w-xl text-rose-800">
        Your data is still safe. Try loading the page again, or return to the dashboard.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={`${actionClass} bg-rose-700 text-white hover:bg-rose-800`}>
          Try again
        </button>
        <Link to="/" className={`${actionClass} border border-rose-300 bg-white text-rose-800 hover:bg-rose-100`}>
          Return to dashboard
        </Link>
      </div>
    </section>
  );
}

export function RouteNotFoundFallback(): JSX.Element {
  return (
    <section aria-labelledby="not-found-heading" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">404 · Page not found</p>
      <h1 id="not-found-heading" className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        We could not find that page
      </h1>
      <p className="mt-2 max-w-xl text-slate-600">
        The address may be outdated or incomplete. Return to the dashboard to continue working.
      </p>
      <Link to="/" className={`${actionClass} mt-5 bg-indigo-600 text-white hover:bg-indigo-700`}>
        Return to dashboard
      </Link>
    </section>
  );
}
