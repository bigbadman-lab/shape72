# SHAPE72 — Gate 1: Faithful Lovable → Next.js Production Port

## Verdict

**PASS — GATE 1 LOVABLE PORT COMPLETE**

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-23T20:59:18Z` |
| Branch | `main` |
| HEAD | none — unborn branch, no commits yet |
| Working tree status | all project files untracked; no commit or push performed |
| Source Lovable path used | `/lovable-source` (`lovable-source/`) |

---

## Production files added / changed

### Added

- `src/components/HomePage.tsx`
- `src/components/Shape72Wordmark.tsx`
- `src/components/ShapeGallery.tsx`
- `src/components/ShapeTile.tsx`
- `src/components/ShapeModal.tsx`
- `src/components/TokenStrip.tsx`
- `src/data/shapes.ts`
- `public/shapes/shape-1.svg` … `public/shapes/shape-72.svg` (72 files, byte-identical copies)
- `audit/gate-1-lovable-port.md`

### Changed

- `src/app/page.tsx` — App Router home now renders the ported UI
- `src/app/layout.tsx` — SHAPE72 metadata + JetBrains Mono fallback via `next/font`
- `src/app/globals.css` — Lovable design tokens, orange shape mask, rewards pulse
- `tsconfig.json` — exclude `lovable-source` from production typecheck
- `eslint.config.mjs` — ignore `lovable-source/**`

### Intentionally not ported

Lovable editor/preview tooling, TanStack Start/Router/Query, Radix UI kit, `tw-animate-css`, and all unused `lovable-source/src/components/ui/*` primitives.

---

## SVG assets

| Check | Result |
| --- | --- |
| Total SVG count found in Lovable | **72 / 72** (`lovable-source/public/shapes/shape-1.svg` … `shape-72.svg`) |
| Total SVG count copied to production | **72 / 72** (`public/shapes/shape-1.svg` … `shape-72.svg`) |
| Total SVG count rendered | **72 / 72** (DOM: 72 gallery tiles; each tile uses `/shapes/shape-{id}.svg` once) |
| Shape 01 → Shape 72 mapping intact | **Yes** — `shape-{n}.svg` = Shape `n`, IDs 1–72, no duplicates, no reordering, no regenerated artwork |
| Source SVG files modified | **No** — byte-identical to Lovable (`cmp` across all 72) |
| Orange rendering | CSS `mask` / `-webkit-mask` paints `--primary` `#FF5C00` over the original `#545454` fills without editing the asset files |

---

## Wordmark

**Preserved.** Custom inline SVG letterforms from Lovable (`viewBox="-0.6 -0.6 29.1 6.2"`, monoline geometric paths). Not a font heading.

Measured alignment vs gallery bounds:

| Viewport | Left delta | Right delta | Single line |
| --- | --- | --- | --- |
| 1440px | `0px` | `0px` | yes (one SVG row; scales with gallery width) |
| 1024px | `0px` | `0px` | yes |
| 390px | `0px` | `0px` | yes |

---

## Mono Spec status

**Not supplied.** No `.woff` / `.woff2` / `.ttf` / `.otf` font file exists in `/lovable-source`.

The production stack preserves Lovable’s fallback structure:

```text
"Mono Spec", JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace
```

JetBrains Mono is loaded via `next/font/google` as the temporary fallback only. Geist (the create-next-app default) was removed so it is not a permanent substitute. When Mono Spec is provided, add `@font-face` and keep it first in `--font-display` — no component changes required.

---

## Responsive verification

Verified against the running Next.js app at `http://127.0.0.1:3000` (Chrome headless, device metrics override).

### 1440px

- 4 columns × 18 rows
- all 72 Shapes render
- SHAPE72 wordmark aligns exactly to gallery left/right bounds
- AVAILABLE / OWNED / YOURS visible (Shape 01 AVAILABLE, Shape 03 OWNED + REWARDS LIVE, Shape 17 YOURS + mocked SOL, Shape 72 AVAILABLE)
- claim modal: SHAPE 01 / ONE OF 72 / FREE MINT / NETWORK FEES ONLY / CLAIM SHAPE
- yours modal: LIVE + `0.031 SOL` + transfer copy + CLAIM REWARDS
- no horizontal overflow

### 1024px

- 4 columns × 18 rows (approved `lg:grid-cols-4`)
- wordmark still aligned (0px delta)
- no overlap, no clipped copy
- modal usable, no overflow
- token strip 4-up

### 390px

- 2 columns × 36 rows
- wordmark remains a single line
- top copy readable (approved sentence, wraps within `max-w-sm`)
- Shape ID and status do not collide (0 measured overlaps; metadata strip uses `justify-between` + `gap-2`)
- no horizontal overflow
- modal usable (panel fits viewport; CLAIM SHAPE / rewards labels readable)
- rewards labels readable on tiles (`REWARDS LIVE`, `+0.031 SOL`)

---

## Tooling results

| Check | Result |
| --- | --- |
| Lint | **pass** — `npm run lint` (eslint, 0 errors) |
| Typecheck | **pass** — `npx tsc --noEmit` |
| Build | **pass** — `npm run build` (Next.js 16.3.6, `/` prerendered static) |
| Install | existing `node_modules` used; no production dependency added |

---

## Visual differences from Lovable

None material. Intentional production-only deltas:

1. Modal enter animation is local CSS (`fade-in` / `zoom-in-95`) instead of the Lovable `tw-animate-css` package. Same timing and motion.
2. JetBrains Mono is self-hosted via `next/font` rather than a runtime Google Fonts stylesheet.
3. Tile metadata strip includes `gap-2` so Shape ID and status cannot collide at 390px. Lovable used `justify-between` only.
4. Shape modal broken-image reset is keyed by shape id (avoids `setState` inside an effect). Visible behaviour is unchanged.
5. Unused create-next-app assets (`public/next.svg`, `public/vercel.svg`, template SVGs) remain on disk and are not rendered.
6. Two unused extra files are present under `public/shapes/` (`72pfp.png`, `shape72meta.jpg`) and are **not referenced** by the port.

---

## Blockers

None.

---

## Confirmations

- **No blockchain / backend logic added.** Mock local React state only. `package.json` production dependencies remain `next`, `react`, `react-dom`. No Solana wallet adapter, Metaplex, Pump.fun, Supabase, or API routes.
- **No real token data or real rewards logic.** Native-token strip and SOL balances are the Lovable mock constants.
- **No deployment occurred.**
- **No commit or push occurred.**

---

## PASS criteria checklist

- [x] Next.js app faithfully reproduces the approved Lovable UI
- [x] All 72 SVGs present and correctly mapped
- [x] Desktop is 4 columns × 18 rows
- [x] Mobile is 2 columns
- [x] Custom SHAPE72 vector wordmark preserved
- [x] Top creator-rewards copy is exact
- [x] FREE MINT claim state is correct
- [x] AVAILABLE / OWNED / YOURS states are present
- [x] Creator rewards UI preserved
- [x] Native-token mock strip preserved
- [x] 1440 / 1024 / 390 verified
- [x] Build passes
- [x] No blockchain logic added
- [x] No deployment occurred
- [x] No commit / push occurred
