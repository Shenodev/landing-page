# Hyperframes Composition Brief: ShenoDev (Vertical Reel)

## Objective

Create a 9:16 vertical-cut brag reel for ShenoDev.

## Output

- Composition directory: `brag-output-2026-09-22-112107/composition/`
- Rendered video: `brag-output-2026-09-22-112107/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 20 seconds

## Source Material

- Project root: `D:\projects\Sheno\landing-page\web`
- Primary files read: `src/components/Hero.tsx`, `src/components/Services.tsx`, `src/components/pricing/PricingCard.tsx`, `src/components/discovery/DiscoveryPage.tsx`, `src/components/discovery/DiscoverySuccess.tsx`, `src/app/globals.css`
- Product name: ShenoDev
- Tagline / strongest claim: "Think it, Sheno it."
- Key UI or visual moment to recreate: the 5-step discovery flow as a vertical card stack resolving into "Thank you — Discovery Received!"
- Copy that must appear verbatim:
  - "Think it, Sheno it."
  - "High-Performance Web Solutions."
  - "Start Your Project"
  - "Thank you — Discovery Received!"
  - "10,000 EGP" / "25,000 EGP" / "45,000 EGP"
  - "Fixed scope. No hidden fees."
  - "shenodev.tech"

## Creative Direction

- Tone preset: polished
- Creative direction: premium agency reel — vertical cut of the launch film
- Interpretation: stacked full-width layouts, larger type for phone viewing, same restraint as the landscape cut
- Angle: the precision-launch-film angle, reframed for the phone screen — tagline stacked huge, flow as a thumb-scroll of step cards, prices as a rate card.
- Hook: "Think it," / "Sheno it." stacked giant across two lines (first 2–3 seconds).
- Outro / punchline: "Fixed scope. No hidden fees." then logo + shenodev.tech.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity

- Background: #0b1326 (deep slate)
- Text: #dae2fd (off-white; pure highlights #F8FAFC)
- Accent: #06B6D4 (electric cyan; bright variant #4cd7f6)
- Display font: Sora (local `assets/fonts/sora-800-latin.woff2`)
- Body font: Inter (local `assets/fonts/inter-latin.woff2`)
- Visual references from the project: glassmorphism cards, cyan glow, gradient display headline, cyan pill buttons, "01"–"05" step cards, check_circle confirmation badge

## Storyboard

Use the storyboard in `brag-output-2026-09-22-112107/brag-plan.md` as the creative contract.

Scene summary:

1. Hook, stacked — 3s — two-line tagline slam + glow pulse, hold for reading
2. Reveal: hero, stacked — 5s — stacked headline, subline, full-width CTAs, tap on primary
3. Flow: card stack — 7s — title, 5 step cards top to bottom, file chip + date pill, confirmation stamp, hold full set
4. Pricing stack + logo — 5s — 3 stacked price cards, punchline, logo + URL

## Audio

- Audio role: sleek modern bed with motion-matched accents
- Audio arc: fades in under the hook, full presence through flow/pricing, hard hit + quick fade on the logo outro
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (already in `composition/assets/music/`)
- Music treatment: fade in 0–2s, full presence 2–18s, final hit with quick fade at ~18–20s
- Music cue guidance: bundled preset read in the prior run (~110 BPM, ~0.55s spacing). Strong cues near 18.01s / 18.55s for the logo hit; boundaries near ~5.2s, ~10.4s, ~15.8s may snap within ±0.15s. Card reveals on every *other* beat at most, then hold.
- Audio-reactive treatment: subtle — cyan glow breathing in hook/outro only
- Audio-coupled moments:
  - Hook slam — line impacts + glow pulse
  - Hero — tap on "Start Your Project"
  - Flow — top-to-bottom card sequence, file/date ticks, confirmation stamp thud
  - Outro — dry logo hit
- SFX selection guidance: reuse the landscape cut's files in `composition/assets/sfx/` (soft impacts, clicks, bell)
- Exact SFX choice: Hyperframes should choose timestamps, density, and volume based on the implemented animation.
- Audio files: music + SFX already in `composition/assets/`; local fonts in `composition/assets/fonts/`

## Hyperframes Instructions

Same contract as the landscape cut: Hyperframes owns implementation, timing mechanics, lint, and render. Requirements: real project UI/copy shown; all text readable; 15–25s; music/SFX layer included; cue metadata optional; 1–3 strong cue locks; sequential events on the beat grid or natural timing for readability; SFX matched to motion; local assets; `hyperframes check` with zero errors before render.
