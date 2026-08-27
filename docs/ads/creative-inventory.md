# Sahan Profiles ad creatives

Drop the exported files from Claude Design here. This folder is Vite's
`publicDir` (vite root is `client/`), so anything in here is served verbatim at
`/ads/sahanprofiles/<filename>` in dev and copied into `dist/public` on build.
No import, no hashing, no code change needed to make a file reachable.

## Filenames to use

Use these exact names — the ad component will reference them directly.

| File | Artboard exported from Claude Design |
|---|---|
| `hero.webp` + `hero@2x.webp` | 1536 × 256 |
| `hero-mobile.webp` + `hero-mobile@2x.webp` | 656 × 360 |
| `mpu.webp` + `mpu@2x.webp` | 768 × 600 |
| `skyscraper.webp` + `skyscraper@2x.webp` | 768 × 1152 |
| `infeed.webp` + `infeed@2x.webp` | 1792 × 280 |
| `infeed-mobile.webp` + `infeed-mobile@2x.webp` | 660 × 440 |
| `footer.webp` + `footer@2x.webp` | 2400 × 240 |
| `sticky-mobile.webp` + `sticky-mobile@2x.webp` | 750 × 112 |
| `logo.svg` | vector lockup |
| `logo-mark.png` | 512 × 512, transparent |

The `@2x` file is the raw Claude Design export at full artboard size. The plain
file is that same image resized to 50%. If you only have one export, name it
`@2x` and I'll generate the 1× downscale.

PNG instead of WebP is fine — I'll convert. Just keep the base names identical.

## What I need from you besides the images

- Destination URL (with any UTM params you want)
- Headline + CTA copy per slot, if it isn't baked into the image
- Alt text for each creative

See `docs/ads/sahanprofiles-ad-specs.md` for the full spec and slot measurements.
