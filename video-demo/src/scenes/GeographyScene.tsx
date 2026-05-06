import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';
import {ASIA_PATHS, project} from '../asiaPaths';

// Stylised geographic visual establishing the transmission story:
// Hormuz Strait → maritime route → Singapore → fan-out to 10 regional economies.
// Uses the same real-geography Asia map (world-atlas/countries-110m) that
// powers the dashboard's regional landing card.
//
// Native projection viewBox is 320×160 (LNG 60-150, LAT -12 to 55). We
// extend the viewBox westward to -30 so the Hormuz Strait at lng 56
// appears just inside the visible area.

const VB_X = -30;
const VB_Y = 0;
const VB_W = 350;   // 320 native + 30 western extension
const VB_H = 160;

// Hormuz coords (lng 56, lat 26.5) — slightly off-grid given the map's
// western boundary is lng 60, but the extended viewBox brings it in.
const HORMUZ   = {lng: 57, lat: 26.5, label: 'Hormuz Strait'};
const SINGAPORE = {lng: 104, lat: 1.3, label: 'Singapore'};

// 10 regional economies — actual capital / centroid coords
const REGION = [
  {iso: 'CN', lng: 104,   lat: 35,   name: 'China'},
  {iso: 'IN', lng:  78,   lat: 22,   name: 'India'},
  {iso: 'JP', lng: 138,   lat: 36,   name: 'Japan'},
  {iso: 'KR', lng: 128,   lat: 37,   name: 'Korea'},
  {iso: 'TW', lng: 121,   lat: 23.5, name: 'Taiwan'},
  {iso: 'TH', lng: 101,   lat: 14,   name: 'Thailand'},
  {iso: 'VN', lng: 108,   lat: 14,   name: 'Vietnam'},
  {iso: 'PH', lng: 122,   lat: 13,   name: 'Philippines'},
  {iso: 'MY', lng: 102,   lat:  4,   name: 'Malaysia'},
  {iso: 'ID', lng: 110,   lat: -3,   name: 'Indonesia'},
];

export const GeographyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headingOpacity = spring({frame, fps, config: {damping: 18}});

  // Stage 1: Hormuz marker pulses in (frames 30-60)
  const hormuzOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const hormuzPulse = 1 + 0.15 * Math.sin((frame - 30) * 0.15);

  // Stage 2: Curved arrow draws from Hormuz to SG (frames 70-150)
  const routeProgress = interpolate(frame, [70, 150], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 3: Singapore marker appears (frames 130-160)
  const sgOpacity = interpolate(frame, [130, 160], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const sgPulse = 1 + 0.15 * Math.sin((frame - 140) * 0.15);

  // Stage 4: Regional dots fan out (frames 160-220)
  const dotOpacity = (i: number) =>
    interpolate(frame, [160 + i * 6, 180 + i * 6], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });

  // Project our anchor points
  const hormuzPt = project(HORMUZ.lng, HORMUZ.lat);
  const sgPt     = project(SINGAPORE.lng, SINGAPORE.lat);

  // Curved route path Hormuz → Singapore (quadratic Bezier with control
  // point above the midpoint to give a natural maritime arc)
  const routePath = (() => {
    const cx = (hormuzPt.x + sgPt.x) / 2;
    const cy = (hormuzPt.y + sgPt.y) / 2 - 25;
    return `M ${hormuzPt.x} ${hormuzPt.y} Q ${cx} ${cy} ${sgPt.x} ${sgPt.y}`;
  })();
  // Approx route length for stroke-dash trick (chord + slight curve compensation)
  const routeLen = (() => {
    const dx = sgPt.x - hormuzPt.x;
    const dy = sgPt.y - hormuzPt.y;
    return Math.sqrt(dx * dx + dy * dy) * 1.05;
  })();

  return (
    <AbsoluteFill style={{padding: '90px 100px'}}>
      {/* Heading */}
      <div
        style={{
          fontFamily: FONT.head,
          fontSize: 60,
          fontWeight: 700,
          color: COL.textHigh,
          opacity: headingOpacity,
          marginBottom: 12,
        }}
      >
        From Hormuz to ASEAN
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 24,
          color: COL.textMid,
          fontStyle: 'italic',
          opacity: headingOpacity,
          maxWidth: 1500,
        }}
      >
        Singapore sits at the receiving end of Middle East energy flows — and refines and re-exports outward to the wider region.
      </div>

      {/* Geographic visual — real cartographic Asia map */}
      <svg
        viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          left: 100,
          top: 220,
          width: 1720,
          height: 760,
        }}
      >
        {/* Subtle ocean-grid backdrop */}
        <defs>
          <pattern id="ocean-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={COL.border} strokeWidth="0.15" opacity="0.4" />
          </pattern>
          <linearGradient id="ocean-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COL.teal} stopOpacity="0.06" />
            <stop offset="100%" stopColor={COL.bgPanel} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill="url(#ocean-bg)" />
        <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill="url(#ocean-grid)" />

        {/* Real country outlines (world-atlas/countries-110m) */}
        {Object.entries(ASIA_PATHS).map(([iso, info]) => (
          <path
            key={iso}
            d={info.d}
            fill="rgba(96, 165, 250, 0.18)"
            stroke="rgba(96, 165, 250, 0.75)"
            strokeWidth="0.35"
            strokeLinejoin="round"
          />
        ))}

        {/* Curved Hormuz → Singapore maritime route */}
        <path
          d={routePath}
          fill="none"
          stroke={COL.amber}
          strokeWidth="1.2"
          strokeDasharray={routeLen}
          strokeDashoffset={routeLen * (1 - routeProgress)}
          strokeLinecap="round"
        />
        {/* Arrowhead near Singapore — appears once route is mostly drawn */}
        {routeProgress > 0.92 && (() => {
          // Arrowhead direction: tangent to the curve at SG (approx, pointing along chord)
          const dx = sgPt.x - hormuzPt.x;
          const dy = sgPt.y - hormuzPt.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len, uy = dy / len;
          const px = -uy, py = ux;
          const headLen = 4, headHalfW = 2.2;
          const tipX = sgPt.x, tipY = sgPt.y;
          const baseX = sgPt.x - ux * headLen;
          const baseY = sgPt.y - uy * headLen;
          return (
            <polygon
              points={`${baseX + px * headHalfW},${baseY + py * headHalfW} ${tipX},${tipY} ${baseX - px * headHalfW},${baseY - py * headHalfW}`}
              fill={COL.amber}
            />
          );
        })()}

        {/* Fan-out lines from Singapore to regional dots */}
        {REGION.map((r, i) => {
          const pt = project(r.lng, r.lat);
          const lineOpacity = interpolate(
            frame,
            [165 + i * 6, 195 + i * 6],
            [0, 0.4],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );
          return (
            <line
              key={`line-${r.iso}`}
              x1={sgPt.x}
              y1={sgPt.y}
              x2={pt.x}
              y2={pt.y}
              stroke={COL.tealLight}
              strokeWidth="0.4"
              opacity={lineOpacity}
            />
          );
        })}

        {/* Hormuz marker */}
        <g opacity={hormuzOpacity}>
          <circle
            cx={hormuzPt.x} cy={hormuzPt.y} r={4.5}
            fill={COL.coral} opacity={0.4}
            transform={`scale(${hormuzPulse})`}
            style={{transformOrigin: `${hormuzPt.x}px ${hormuzPt.y}px`}}
          />
          <circle cx={hormuzPt.x} cy={hormuzPt.y} r={2.2} fill={COL.coral} />
          <text
            x={hormuzPt.x} y={hormuzPt.y - 7}
            fill={COL.textHigh}
            fontSize="5.5" fontFamily={FONT.body} fontWeight="700"
            textAnchor="middle"
            paintOrder="stroke" stroke={COL.bgDeep} strokeWidth="0.8"
          >
            {HORMUZ.label}
          </text>
          <text
            x={hormuzPt.x} y={hormuzPt.y + 12}
            fill={COL.textMid}
            fontSize="4" fontFamily={FONT.body} fontStyle="italic"
            textAnchor="middle"
            paintOrder="stroke" stroke={COL.bgDeep} strokeWidth="0.7"
          >
            ME crude origin
          </text>
        </g>

        {/* Singapore marker */}
        <g opacity={sgOpacity}>
          <circle
            cx={sgPt.x} cy={sgPt.y} r={5}
            fill={COL.amber} opacity={0.4}
            transform={`scale(${sgPulse})`}
            style={{transformOrigin: `${sgPt.x}px ${sgPt.y}px`}}
          />
          <circle cx={sgPt.x} cy={sgPt.y} r={2.6} fill={COL.amber} />
          <text
            x={sgPt.x} y={sgPt.y + 11}
            fill={COL.textHigh}
            fontSize="6" fontFamily={FONT.body} fontWeight="700"
            textAnchor="middle"
            paintOrder="stroke" stroke={COL.bgDeep} strokeWidth="0.9"
          >
            {SINGAPORE.label}
          </text>
          <text
            x={sgPt.x} y={sgPt.y + 17}
            fill={COL.textMid}
            fontSize="4" fontFamily={FONT.body} fontStyle="italic"
            textAnchor="middle"
            paintOrder="stroke" stroke={COL.bgDeep} strokeWidth="0.7"
          >
            Refining + re-export hub
          </text>
        </g>

        {/* 10 regional dots */}
        {REGION.map((r, i) => {
          const pt = project(r.lng, r.lat);
          return (
            <g key={r.iso} opacity={dotOpacity(i)}>
              <circle cx={pt.x} cy={pt.y} r={3} fill={COL.tealLight} opacity={0.4} />
              <circle cx={pt.x} cy={pt.y} r={1.6} fill={COL.tealLight} />
              <text
                x={pt.x + 2.5} y={pt.y + 1.5}
                fill={COL.textHigh}
                fontSize="3.8" fontFamily={FONT.body} fontWeight="600"
                paintOrder="stroke" stroke={COL.bgDeep} strokeWidth="0.6"
              >
                {r.iso}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Bottom caption — appears once the regional dots have settled,
          then holds through the long pause at end of scene */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 100,
          right: 100,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontSize: 26,
          color: COL.textHigh,
          fontStyle: 'italic',
          opacity: interpolate(frame, [220, 260], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
        }}
      >
        One shock at the source. Ten economies on the receiving end.
      </div>
    </AbsoluteFill>
  );
};
