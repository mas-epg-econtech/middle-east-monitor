# Geography scene — how the real-cartography SVG was generated

The Geography scene (`src/scenes/GeographyScene.tsx`) shows a stylised but
**cartographically real** map of Asia, with markers for the Hormuz Strait,
Singapore, and 10 ASEAN+NEA economies. This note documents how that map
was put together so it can be tweaked or regenerated later.

---

## Source data

The country outlines come from [`world-atlas/countries-110m`](https://github.com/topojson/world-atlas)
— specifically the **Natural Earth Admin-0 1:110m** dataset bundled as
TopoJSON. This is the same dataset that powers the dashboard's regional
landing-page card (rendered by `hero_regional()` in `src/illustrations.py`).

Why 1:110m and not higher resolution:

- **File size** — 1:110m fits comfortably inline as SVG paths (the full
  Asia subset is ~16 KB of path data); higher resolutions balloon to
  hundreds of KB and slow Remotion's bundler down with no visual gain
  at the slide's render scale.
- **Visual style** — at the 1920×1080 stage, fine coastline detail
  reads as noise. The 1:110m simplification gives clean, recognisable
  silhouettes that match the dashboard's aesthetic.
- **Attribution-friendly** — Natural Earth is public-domain, requires
  no per-use licence.

## Projection

The map uses a **simple equirectangular projection** (Plate Carrée) with
the bounding box:

```
LNG_MIN, LNG_MAX = 60, 150    (degrees east)
LAT_MIN, LAT_MAX = -12, 55    (degrees south to north)
```

Pre-projected into a 320 × 160 SVG viewBox. The forward projection is
defined in both the Python source (`src/asia_paths.py`) and the TypeScript
copy (`video-demo/src/asiaPaths.ts`):

```ts
function project(lng, lat) {
  const x = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * SVG_W;   // 0–320
  const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * SVG_H;  // 0–160
  return {x, y};
}
```

Equirectangular is good enough at this latitude range — distortion at
40°N is mild and the map reads as a recognisable Asia. Mercator would
exaggerate Japan/Korea relative to Indonesia; conic projections need
extra parameters and aren't worth the complexity here.

## How the path data was generated

The Python script that produced `src/asia_paths.py` walked the Natural
Earth countries-110m TopoJSON, filtered to Asia (ISO numeric prefixes
in the 100s/300s/400s/500s/600s/700s belonging to Asian states), and
emitted each country's outer ring as an SVG `<path d="...">` string,
already projected into the 320 × 160 viewBox.

21 countries are included:

> Indonesia · Timor-Leste · Cambodia · Thailand · Laos · Myanmar ·
> Vietnam · North Korea · South Korea · Mongolia · India · Bangladesh ·
> Bhutan · Nepal · Sri Lanka · China · Taiwan · Philippines · Malaysia ·
> Brunei · Japan

Middle Eastern countries (Saudi Arabia, Iran, UAE, etc.) were not
included in the dashboard's source data because the dashboard's regional
view is Asia-focused. The video makes do without them — see "Hormuz at
the edge" below.

## Copying into the video project

Remotion is a separate Node project from the Python pipeline, so the
path data can't be imported directly. A small script in this repo
regenerates the TypeScript copy from the Python source:

```bash
# From the repo root, with src/asia_paths.py importable:
python3 <<'PY'
import sys; sys.path.insert(0, '.')
from src.asia_paths import ASIA_PATHS

out = ['export interface CountryPath { name: string; d: string; }']
out.append('export const ASIA_PATHS: Record<string, CountryPath> = {')
for iso, info in ASIA_PATHS.items():
    out.append(f"  '{iso}': {{ name: '{info['name']}', d: '{info['d']}' }},")
out.append('};')
# Plus the project() helper and PROJECTION constants — see actual file
with open('video-demo/src/asiaPaths.ts', 'w') as f:
    f.write('\n'.join(out) + '\n')
PY
```

If `src/asia_paths.py` is ever regenerated (e.g. with newer Natural
Earth data, or to add countries), re-run that snippet to refresh
`video-demo/src/asiaPaths.ts`.

## Hormuz at the edge

The dashboard's projection covers LNG 60–150°E, but the **Strait of
Hormuz sits at ≈ 56°E** — just outside the original western boundary.
Two options were considered:

1. **Extend the source data westward** to include Saudi Arabia, Iran,
   etc., which would widen the viewBox to LNG ~40–150 and require
   regenerating the path data.
2. **Extend only the viewBox**, leaving the country paths as-is, and
   place the Hormuz marker just inside the new western edge.

Option 2 was chosen because (a) the additional Middle East countries
add nothing to the *receiving* side of the transmission story, (b) it
avoids regenerating the path data, and (c) leaving the area west of
LNG 60 visibly empty visually emphasises that "the shock comes from
off-map / outside our region of focus."

In `GeographyScene.tsx`:

```ts
const VB_X = -30;
const VB_W = 350;   // 320 native + 30 extra to the west
```

Hormuz is placed at `lng: 57, lat: 26.5` — projected x ≈ −10.7, y ≈ 80.4,
which sits just inside the extended viewBox.

## Marker positions

All markers use the same `project(lng, lat)` function so they land on
their real geographic positions:

| Marker | lng    | lat   | Notes |
|---|---|---|---|
| Hormuz Strait    | 57    | 26.5 | Slightly east of true (56°E) to keep inside the extended viewBox |
| Singapore        | 104   |  1.3 | Approximate centroid |
| China (CN)       | 104   | 35   | Near Xi'an / central |
| India (IN)       | 78    | 22   | Central India |
| Japan (JP)       | 138   | 36   | Near Tokyo |
| South Korea (KR) | 128   | 37   | Near Seoul |
| Taiwan (TW)      | 121   | 23.5 | Near Taipei |
| Thailand (TH)    | 101   | 14   | Near Bangkok |
| Vietnam (VN)     | 108   | 14   | Approximate |
| Philippines (PH) | 122   | 13   | Near Manila |
| Malaysia (MY)    | 102   |  4   | Peninsular MY |
| Indonesia (ID)   | 110   | -3   | Central Indonesia (west of Jakarta) |

Tweak these in the `REGION` array at the top of `GeographyScene.tsx`.

## Hormuz → Singapore route

The maritime route arc is a single SVG quadratic Bezier:

```ts
M ${hormuzPt.x} ${hormuzPt.y}
Q ${(hormuzPt.x + sgPt.x) / 2} ${(hormuzPt.y + sgPt.y) / 2 - 25}
  ${sgPt.x} ${sgPt.y}
```

The control point sits 25 units above the midpoint, giving the curve a
gentle northward bow that vaguely mimics the actual Indian-Ocean
shipping lane (which arcs north-east via the Bay of Bengal / Andaman
Sea before turning south through the Strait of Malacca). It's not
geographically precise — it's a stylised cue.

The route is drawn with the standard `stroke-dasharray` /
`stroke-dashoffset` trick to animate it as if being drawn over time.

## Styling

Country fills mirror the dashboard's regional card:

```ts
fill   = "rgba(96, 165, 250, 0.18)"   // soft blue, low opacity
stroke = "rgba(96, 165, 250, 0.75)"   // crisper outline
```

Combined with the ocean-grid pattern background and the gradient
overlay, this gives a recognisable "navigation chart" aesthetic that
matches the rest of the deck/dashboard's dark-theme visual language.
