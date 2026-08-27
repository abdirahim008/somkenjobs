# Sahan Profiles — ad creative specs for somkenjobs.com

All slot widths below are **measured from the live layout** (Tailwind classes in
`client/src/pages/home.tsx`, `client/src/pages/job-details.tsx`,
`client/src/components/RecruiterAdBanner.tsx`, `client/src/components/Footer.tsx`),
not generic IAB sizes.

Rule of thumb: **design the artboard at 2× the CSS size**, export at 1× and 2×.
"Slot (CSS px)" is what the browser renders; "Artboard" is what you ask Claude
Design to create.

---

## 1. Hero banner (highest value)

Sits directly under the search bar on the homepage, same position as the
existing recruiter advert (`max-w-3xl` = 768px, white card on the #0077B5 hero).

| | |
|---|---|
| Slot (CSS px) | **768 × 128** |
| Ratio | 6 : 1 |
| Artboard | **1536 × 256** |
| Mobile crop | 328 × 180 → artboard **656 × 360** (1.82:1) |

- Card is white with `rounded-xl` (12px radius) — design on white, not transparent.
- Left 56px is a coloured icon rail in the current banner; keep your logo out of
  the far-left 64px if you want to match that pattern, or go full-bleed.
- CTA button lives on the right on desktop, full-width underneath on mobile.

## 2. Sidebar MPU (best repeat-impression slot)

Left sidebar: `lg:w-80` (320px) on job detail pages, `lg:w-80 xl:w-96`
(320px → 384px) on the homepage. One artboard covers both because the ratio is
identical.

| | |
|---|---|
| Slot (CSS px) | **320 → 384 wide × 250 → 300 tall** |
| Ratio | 1.28 : 1 |
| Artboard | **768 × 600** |

- Renders crisp at both 320px and 384px widths.
- The job-details sidebar is `sticky top-6` — this creative stays on screen while
  the user scrolls a long job post. Design it to survive being looked at twice.

## 3. Sidebar skyscraper (optional, below the MPU)

| | |
|---|---|
| Slot (CSS px) | **320 → 384 wide × 480 → 576 tall** |
| Ratio | 2 : 3 |
| Artboard | **768 × 1152** |

## 4. In-feed unit (between job cards)

Main results column is `max-w-4xl` (896px) on desktop, ~328px on mobile. Needs
two crops — a single image will letterbox badly.

| | Desktop | Mobile |
|---|---|---|
| Slot (CSS px) | **896 × 140** | **330 × 220** |
| Ratio | 6.4 : 1 | 3 : 2 |
| Artboard | **1792 × 280** | **660 × 440** |

## 5. Mobile sticky bottom bar (optional)

| | |
|---|---|
| Slot (CSS px) | **375 × 56** (full viewport width) |
| Ratio | 6.7 : 1 |
| Artboard | **750 × 112** |

- Needs a dismiss (×) affordance and must not cover the apply button.

## 6. Footer leaderboard

Footer container is `max-w-7xl` (1280px), clamped to 1200px at ≥1536px.

| | |
|---|---|
| Slot (CSS px) | **1200 × 120** |
| Ratio | 10 : 1 |
| Artboard | **2400 × 240** |
| Mobile crop | 328 × 120 → artboard **656 × 240** |

## 7. Brand assets (needed once, reused everywhere)

| Asset | Size | Format |
|---|---|---|
| Square mark | **512 × 512** | PNG, transparent |
| Horizontal lockup (mark + "Sahan Profiles") | **600 × 160** | PNG, transparent |
| Both of the above | vector | SVG |
| Small inline mark for text-only ads | **96 × 96** | PNG, transparent |

---

## Constraints to give Claude Design

**Safe zone.** Keep all text and the logo inside the central 88% of the artboard,
with a minimum 24px (CSS) padding on every edge. Nothing meaningful in the outer
6% — narrow viewports crop it.

**Minimum type sizes** (in CSS px, so ×2 on the artboard): body 14px, headline
16px, eyebrow/label 11px. Logo wordmark never below 28px tall.

**Tap targets.** Any CTA rendered inside the image must read as ≥44px tall at
1× — otherwise it looks untappable on mobile.

**Colour.** somkenjobs' accent is **#0077B5** (LinkedIn blue) on white cards with
`text-gray-900` headings and `text-gray-600` body. Use Sahan Profiles' own brand
colour for the CTA so the ad is distinguishable from site chrome, but keep the
background white or a light neutral — a saturated background fights the blue hero
and reads as a scam banner.

**Radius & shadow.** 12px corner radius, no drop shadow baked into the image (the
site card already applies `shadow-lg ring-1 ring-black/5`).

**Text in image: minimise.** Put the headline and CTA as live HTML text where
possible and let the image carry only brand/illustration. Baked-in text doesn't
translate, doesn't scale, and hurts accessibility. If Claude Design bakes text in,
keep it to ≤6 words.

**Dark mode.** The site defines dark tokens (`.dark` in `index.css`) but has no
active toggle today. Skip a dark variant for now; if a toggle ships, you'll need
a light-background alternate.

**File output.** WebP at quality 82 as primary, PNG as fallback. Budget: ≤120KB
desktop creatives, ≤60KB mobile. Supply 1× and 2×.

**Compliance.** Every slot needs a visible "Sponsored" or "Ad" label (11px,
uppercase, `text-gray-500`) and the outbound link must carry
`rel="sponsored noopener"` — self-serving links between your own sites without it
is exactly the pattern Google penalises.

---

## Ready-to-paste prompt for Claude Design

> Create an ad creative set for **Sahan Profiles** (sahanprofiles.com) to run on
> somkenjobs.com, an East African humanitarian jobs board. Lay out these artboards
> on one canvas:
>
> 1. Hero banner — 1536 × 256
> 2. Hero banner, mobile — 656 × 360
> 3. Sidebar MPU — 768 × 600
> 4. Sidebar skyscraper — 768 × 1152
> 5. In-feed desktop — 1792 × 280
> 6. In-feed mobile — 660 × 440
> 7. Footer leaderboard — 2400 × 240
> 8. Mobile sticky bar — 750 × 112
>
> Style: clean white or light-neutral card, 12px corner radius, no baked-in drop
> shadow. Host site accent is #0077B5 — use Sahan Profiles' own brand colour for
> the CTA button so the ad stands apart from site chrome. All text and logo inside
> the central 88% with ≥48px artboard padding. Minimum type: 28px body, 32px
> headline, 22px eyebrow (artboard px). Headline ≤6 words. Include a small
> uppercase "SPONSORED" label. Audience: NGO, UN and humanitarian professionals in
> Kenya, Somalia, Ethiopia and Djibouti — professional and trustworthy, not playful.

*(Fill in the actual headline/CTA copy — the spec above is deliberately
copy-agnostic since it depends on what Sahan Profiles is selling.)*
