"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "shenodev-cookie-consent";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

type ConsentValue = "accepted" | "declined";

const readConsent = (): ConsentValue | null => {
  try {
    const raw: string | null = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value?: ConsentValue; at?: number };
    if ((parsed.value === "accepted" || parsed.value === "declined") && typeof parsed.at === "number") {
      if (Date.now() - parsed.at > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed.value;
    }
    return null;
  } catch {
    return null;
  }
};

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (readConsent() === null) {
        setVisible(true);
      }
    });
  }, []);

  const choose = (value: ConsentValue): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
    } catch {
      // Storage unavailable (private mode) — banner simply reappears next visit.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[60] rounded-xl border border-white/10 bg-surface/95 backdrop-blur-md p-5"
    >
      <p className="text-body-sm text-on-surface font-semibold mb-1.5">Cookie Preferences</p>
      <p className="text-body-sm leading-[20px] text-on-surface-variant mb-4">
        We use essential local state only to remember your preferences without third-party tracking. Details in our{" "}
        <Link href="/cookies" className="text-primary hover:underline">
          Cookie Policy
        </Link>
        .
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => choose("declined")}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-dim hover:bg-surface border border-white/10 text-on-surface text-body-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Accept
        </button>
      </div>
    </div>
  );
};
