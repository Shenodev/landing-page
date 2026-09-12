"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const Error = ({ error, reset }: ErrorProps) => {
  useEffect(() => {
    console.error("[web:error-boundary]", error.message, error.stack);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center bg-background">
      <div className="w-16 h-16 rounded-xl bg-error-container/20 border border-error/30 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-error text-3xl">error</span>
      </div>
      <h2 className="text-[22px] leading-[30px] font-semibold font-display text-on-surface mb-2">Something went wrong</h2>
      <p className="text-[13px] leading-[20px] text-on-surface-variant max-w-md mb-6">
        An unexpected error occurred. Our team has been notified. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] font-medium px-6 py-3 rounded-lg font-semibold glow-button active:scale-95 transition-all"
        type="button"
      >
        Try again
      </button>
    </div>
  );
};

export default Error;
