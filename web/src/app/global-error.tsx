"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    // Senior-level: log to monitoring, not just console
    console.error("[web:global-error]", error.message, error.stack, error.digest);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-surface min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-xl bg-error-container/20 border border-error/30 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-error text-3xl">error</span>
        </div>
        <h2 className="text-[22px] font-semibold text-on-surface mb-2">Critical error</h2>
        <p className="text-[13px] text-on-surface-variant max-w-md text-center mb-6">
          A critical error occurred. Please reload. If it persists, contact support.
        </p>
        <button
          onClick={reset}
          type="button"
          className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] font-medium px-6 py-3 rounded-lg font-semibold glow-button"
        >
          Reload
        </button>
      </body>
    </html>
  );
};

export default GlobalError;
