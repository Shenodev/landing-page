export const COLORS = {
  // Strict per ARCHITECTURE.md
  primary: "#06B6D4", // Electric Cyan
  background: "#0F172A", // Deep Slate
  text: "#F8FAFC", // Off-White
  // Derived for glassmorphism / hierarchy (tinted from strict palette)
  surface: "#1E293B", // slate-800
  surfaceHigh: "#334155", // slate-700
  surfaceLowest: "#020617", // slate-950
  onSurfaceVariant: "#94A3B8", // slate-400
  outlineVariant: "#334155",
  error: "#F87171",
  tertiary: "#4ADEA3",
} as const;

export const RADIUS = {
  xl: 12,
  lg: 8,
  full: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
