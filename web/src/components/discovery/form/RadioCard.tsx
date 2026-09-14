"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

type RadioCardProps = {
  label: string;
  value: string;
  registration: UseFormRegisterReturn;
  caption?: React.ReactNode;
};

export const RadioCard = ({ label, value, registration, caption }: RadioCardProps) => (
  <label className="relative flex flex-col p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest/80 cursor-pointer hover:border-primary/60">
    <input type="radio" value={value} className="sr-only peer" {...registration} />
    <span className="text-label-md font-semibold text-on-surface capitalize peer-checked:text-primary">
      {label}
    </span>
    {caption && <span className="text-label-sm text-on-surface-variant mt-1">{caption}</span>}
    <span
      className={cn(
        "absolute top-3 right-3 w-4 h-4 rounded-full border border-outline-variant",
        "peer-checked:border-primary peer-checked:bg-primary",
      )}
    />
    <span
      className={cn(
        "absolute inset-0 rounded-xl border-2 border-primary opacity-0 peer-checked:opacity-100 pointer-events-none",
      )}
    />
  </label>
);