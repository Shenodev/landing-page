"use client";

import { useEffect } from "react";

const UnhandledReporter = () => {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      console.error("[web:unhandledRejection]", event.reason);
      // Prevent default browser error overlay in production - log only
      event.preventDefault();
    };
    const onError = (event: ErrorEvent): void => {
      console.error("[web:uncaughtException]", event.message, event.error?.stack);
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
};

export default UnhandledReporter;
