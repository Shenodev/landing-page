# Hyperframes Composition Brief: ShenoDev

## Objective

Create a short launch-style brag video for ShenoDev.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material

- Project root: `D:\projects\Sheno\landing-page\web`
- Primary files read: `src/components/Hero.tsx`, `src/components/Services.tsx`, `src/components/pricing/PricingCard.tsx`, `src/components/discovery/DiscoveryPage.tsx`, `src/components/discovery/DiscoveryQuestionnaire.tsx`, `src/components/discovery/DiscoverySuccess.tsx`, `src/app/globals.css`, `public/assets/`
- Product name: ShenoDev
- Tagline / strongest claim: "Think it, Sheno it."
- Key UI or visual moment to recreate: the 5-step discovery questionnaire flow resolving into the "Thank you — Discovery Received!" confirmation
- Copy that must appear verbatim:
  - "Think it, Sheno it."
  - "Empowering Your Business with High-Performance Web Solutions."
  - "Start Your Project"
  - "Thank you — Discovery Received!"
  - "10,000 EGP" / "25,000 EGP" / "45,000 EGP"
  - "Fixed scope. No hidden fees."
  - "shenodev.tech"

## Creative Direction

- Tone preset: polished
- Creative direction: premium agency launch film — confident, restrained, quietly funny
- Interpretation: fewer scenes with longer holds; elegance through restraint; humor comes only from delivering the tagline dead straight
- Angle: An agency that sells precision gets a precision launch film. The tagline "Think it, Sheno it." is delivered completely straight, then proven by watching a project go from questionnaire to booked call in seconds.
- Hook: Giant "Think it, Sheno it." slamming in over deep slate with a cyan glow pulse (first 2–3 seconds).
- Outro / punchline: "Fixed scope. No hidden fees." holds, then cuts to the ShenoDev logo + shenodev.tech. The anti-punchline: an agency bragging about *not* surprising you.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity

- Background: #0b1326 (deep slate)
- Text: #dae2fd (off-white; pure highlights #F8FAFC)
- Accent: #06B6D4 (electric cyan; bright variant #4cd7f6)
- Display font: Sora (fallback: system sans, bold, tight tracking)
- Body font: Inter (fallback: system sans)
- Visual references from the project: glassmorphism cards (rounded-xl, translucent slate, cyan glow), gradient display headline (cyan gradient on key phrase), cyan pill buttons, step cards labeled "01"–"05", check_circle confirmation badge

## Storyboard

Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:

1. Hook: "Think it, Sheno it." — 3s — giant tagline slam + cyan glow pulse, hold for reading
2. Reveal: the hero — 5s — "Empowering Your Business with High-Performance Web Solutions." with gradient phrase, subline, dual CTAs; cursor clicks "Start Your Project"
3. Flow: questionnaire to booked call — 7s — step cards 01→05 arriving one by one, file chip attaching, date pick, "Thank you — Discovery Received!" stamp; hold full set ~1.5s
4. Pricing punchline + logo — 5s — price cards 10,000 / 25,000 / 45,000 EGP popping in sequence, "Fixed scope. No hidden fees.", cut to logo + shenodev.tech

## Audio

- Audio role: sleek modern bed with motion-matched accents
- Audio arc: fades in under the hook, full presence through flow/pricing, hard hit + quick fade on the logo outro
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (60s, ~110 BPM, ende.app "Happy Beats / Business Moves")
- Music treatment: fade in 0–2s, full presence 2–18s, final hit with quick fade at ~18–20s
- Music cue guidance: bundled preset `assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.*` (~110 BPM, ~0.55s beat spacing). Strong cues near 18.01s / 18.55s suit the final logo hit. Scene boundaries near ~5.2s, ~10.4s, ~15.8s may snap to nearby beats within ±0.15s. Sequential card reveals on every *other* beat at most, then hold the full set for reading.
- Audio-reactive treatment: subtle — cyan glow breathing with music energy in hook/outro only
- Audio-coupled moments:
  - Hook slam — text impact + glow pulse
  - Hero — cursor click on "Start Your Project"
  - Flow — card-by-card sequence, file attach tick, confirmation stamp thud
  - Outro — dry logo hit
- SFX selection guidance: soft whooshes on scene changes, card pops for sequential reveals, click for the CTA, stamp thud for confirmation, one dry logo hit at the end; restraint under held reading text
- SFX analysis guidance: use the skill's `sfx-analysis.md` if present; prefer low high-frequency-risk sounds for repeated/polished moments
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: music copied to `brag-output/composition/assets/music/`; SFX to be selected into the same `assets/` tree

## Hyperframes Instructions

Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:

- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
