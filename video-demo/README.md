# Middle East Monitor — Video Demo

A ~100-second animated video built with [Remotion](https://www.remotion.dev/) to showcase the Middle East Monitor dashboard project. Companion to the showcase deck (`../middle_east_monitor_showcase.pptx`).

## Scene breakdown

| # | Scene | Duration | Frames | Description |
|---|---|---|---|---|
| 1 | **Title** | 6s | 0–180 | "Middle East Monitor — A daily economic read on the Iran-Israel conflict's transmission to Singapore" with MAS branding |
| 2 | **The Challenge** | 12s | 180–540 | Animated counters (8 sources, 491 series, 208 charts, 11 economies) and the two daily questions |
| 3 | **Tracing the shock** | 14s | 540–960 | Three-stage horizontal flow: Global → Singapore → Regional with concrete metrics on each |
| 4 | **AI Narratives** | 22s | 960–1620 | 3 page-level LLMs feed the synthesizer; structured 5-section output reveals; 4 status badges materialize |
| 5 | **Audit Trail** | 12s | 1620–1980 | Side-by-side Key Drivers panel (left) + Crude Oil chart (right) with `gs.energy.crude_oil` highlighted on both |
| 6 | **Pipeline** | 28s | 1980–2820 | Five-stage Cowork-built pipeline (Ingest → Derive → AI Narratives → Render → Deploy) with capability bullets |
| 7 | **Closing** | 6s | 2820–3000 | "Built in days, not weeks" with attribution |

## Tech stack

- **Remotion 4.0** — React-based programmatic video (1920×1080, 30fps)
- **TypeScript / React** — every scene is a functional component using `useCurrentFrame`, `interpolate`, `spring`
- **Static assets** — screenshots from the dashboard's `screenshots/` directory, copied into `public/`

## Project structure

```
video-demo/
├── src/
│   ├── index.ts                          # Remotion registerRoot entry
│   ├── Root.tsx                          # Composition config
│   ├── MiddleEastMonitorDemo.tsx         # Main composition wiring scenes
│   ├── design.ts                         # Shared color/font/timing constants
│   └── scenes/
│       ├── TitleScene.tsx
│       ├── ChallengeScene.tsx
│       ├── TransmissionScene.tsx
│       ├── NarrativesScene.tsx
│       ├── AuditTrailScene.tsx
│       ├── PipelineScene.tsx
│       └── ClosingScene.tsx
├── public/                               # Static assets (referenced via staticFile())
│   ├── landing.png
│   ├── narrative.png
│   ├── key_drivers.png
│   └── global_chart.png
└── package.json
```

## Design system

All scenes share a consistent visual language matching the dashboard + showcase deck:

- **Backgrounds**: dark navy (`#0F1A2E`) with panel surfaces at `#1A2A4A`
- **Status colors** (canonical, matching the dashboard alert badges):
  - Calm `#10B981` · Watchful `#F59E0B` · Strained `#F97316` · Critical `#EF4444`
- **Brand accents**: navy `#1E2761`, teal `#1B7A8A`, amber `#E8A838`, coral `#E8655A`
- **Typography**: Georgia for headings, Calibri for body
- **Animations**: Spring-based entrances, opacity fades, staggered reveals

## How to preview and render

```bash
# From the video-demo/ directory:
npm install

# Open Remotion Studio for interactive preview
npm start

# Render final MP4
npm run build
# -> out/me-monitor-demo.mp4
```

## How this was built

The entire video — scene design, animation logic, content, layout — was built using **Cowork** (Claude's desktop agent), following the storyboard outlined in `reference/remotion_README.md` (the SGX sentiment video). Existing dashboard screenshots were reused as static assets; everything else (counters, badges, flow diagrams, click-through animation) is rendered programmatically by the React/Remotion components.
