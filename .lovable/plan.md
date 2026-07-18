
## Goal
When a visitor lands on the site, play a short, premium brand-name intro animation (letters of the brand assembling with a subtle cab motion), then smoothly hand off into the landing page so the hero appears in sync with the animation's finish.

## Behavior
- Plays on first visit per session (sessionStorage flag `intro_played`), so it doesn't replay on every internal navigation.
- Auto-skips for users who prefer reduced motion (`prefers-reduced-motion`) — instant reveal.
- Small "Skip" button in the corner.
- Total duration ~2.2s. Non-blocking: page is already mounted underneath, overlay fades out.
- Only on the landing route (`/`), not on `/auth`, `/book`, admin, etc.

## Animation choreography (framer-motion)
1. 0.0–0.4s: Dark warm-sand overlay fades in with a soft vignette.
2. 0.2–1.2s: Brand letters (e.g. "O N E W A Y C A B") stagger in — each letter slides up + fades, slight blur-to-sharp, staggered 60ms.
3. 0.9–1.6s: A minimalist cab silhouette (SVG) drives across underlining the wordmark, headlight sweep highlights letters as it passes.
4. 1.4–1.8s: Tagline "Trips, done right." fades in beneath.
5. 1.8–2.2s: Whole overlay scales slightly and fades out; landing hero's existing fade-in kicks in at the same moment so the transition feels continuous (hero heading uses the same font weight/scale end-state as the wordmark for a "morph" feel).

## Files to add / change
- `src/components/BrandIntro.tsx` — new. Framer-motion overlay component with the choreography above, reduced-motion guard, session flag, skip button.
- `src/components/CabGlyph.tsx` — new. Small inline SVG cab used inside the intro (kept local so no asset import churn).
- `src/routes/index.tsx` — mount `<BrandIntro />` at the top of the landing route only; delay the hero's entrance by ~100ms so the handoff lines up. No business logic changes.
- `src/styles.css` — add two small keyframes (`headlight-sweep`, `letter-rise`) and a `.brand-intro-mask` utility using existing warm-sand tokens; no new color tokens.

## Non-goals
- No changes to auth, booking, admin, MCP, or data layer.
- No new dependencies (framer-motion is already installed).
- No route changes; intro is purely presentational.

## Verification
- Load `/` → intro plays once, hero visible after ~2.2s.
- Reload `/` in same tab → intro skipped (session flag).
- Open in a new tab with reduced-motion enabled → intro instantly dismissed.
- Navigate `/` → `/auth` → back to `/` in the same session → no replay.
- `/auth`, `/book`, `/_authenticated/*` → intro never mounts.
