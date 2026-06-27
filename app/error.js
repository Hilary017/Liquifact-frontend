'use client';

import { useEffect } from 'react';
import { reportError } from '../lib/observability/reportError';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to our pluggable reporter
    // React provides error.digest for matching server-side errors
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="rounded-lg bg-white p-8 shadow-md max-w-md w-full">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="mb-6 text-gray-600">
          We&apos;ve been notified of the issue and are looking into it. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
