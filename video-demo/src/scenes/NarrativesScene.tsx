import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

// AI narratives scene — shows the layered LLM architecture:
// 3 page-level LLMs feed into a synthesizer; the synthesizer emits
// a structured 5-section read; 4 status badges materialize.

const SECTIONS = [
  'Upstream prices',
  'Inflation passthrough',
  'Physical supply',
  'Downstream activity',
  'Overall',
];

const STATUS_LEVELS = [
  {label: 'Calm',     color: COL.calm},
  {label: 'Watchful', color: COL.watchful},
  {label: 'Strained', color: COL.strained},
  {label: 'Critical', color: COL.critical},
];

const PAGE_BOXES = [
  {label: 'Global Shocks', y: 250},
  {label: 'Singapore',     y: 410},
  {label: 'Regional',      y: 570},
];

export const NarrativesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headingOpacity = spring({frame, fps, config: {damping: 18}});

  // Stage 1: 3 page-level LLM boxes appear (frames 30-90)
  const pageBoxOpacity = (i: number) =>
    interpolate(frame, [30 + i * 15, 60 + i * 15], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });

  // Stage 2: Synthesizer box appears (frames 110-140)
  const synthOpacity = interpolate(frame, [110, 140], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 2b: Arrows from page boxes to synthesizer draw (frames 130-180)
  const arrowProgress = interpolate(frame, [130, 180], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 3: 5 narrative sections reveal one at a time (frames 200-450)
  const sectionOpacity = (i: number) =>
    interpolate(frame, [200 + i * 35, 230 + i * 35], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });

  // Stage 4: 4 status badges appear (frames 480-580)
  const badgeOpacity = (i: number) =>
    interpolate(frame, [480 + i * 18, 510 + i * 18], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  const badgeScale = (i: number) =>
    interpolate(frame, [480 + i * 18, 510 + i * 18], [0.6, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });

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
        AI writes the answers
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 24,
          color: COL.textMid,
          fontStyle: 'italic',
          opacity: headingOpacity,
          marginBottom: 48,
          maxWidth: 1500,
        }}
      >
        Four LLM calls — one per page, then a synthesizer — produce structured reads and status badges.
      </div>

      {/* Layered LLM architecture (left side) */}
      <div style={{position: 'relative', width: 700, height: 480}}>
        {/* 3 page-level LLM boxes */}
        {PAGE_BOXES.map((pg, i) => (
          <div
            key={pg.label}
            style={{
              position: 'absolute',
              left: 0,
              top: pg.y - 250 + 0,
              width: 240,
              padding: '20px 24px',
              background: COL.bgPanel,
              border: `2px solid ${COL.amber}`,
              borderRadius: 10,
              fontFamily: FONT.body,
              fontSize: 22,
              fontWeight: 700,
              color: COL.textHigh,
              opacity: pageBoxOpacity(i),
            }}
          >
            <div style={{fontSize: 14, color: COL.amber, marginBottom: 4, letterSpacing: 2}}>LLM {i + 1}</div>
            {pg.label}
          </div>
        ))}

        {/* Connecting arrows (3 lines from page boxes to synthesizer) */}
        <svg
          style={{position: 'absolute', left: 240, top: 0, width: 200, height: 480}}
          viewBox="0 0 200 480"
        >
          {PAGE_BOXES.map((pg, i) => {
            const fromY = pg.y - 250 + 32;
            const toY = 410 - 250 + 36;  // synthesizer center
            const length = arrowProgress;
            return (
              <line
                key={i}
                x1="0"
                y1={fromY}
                x2={length * 200}
                y2={fromY + (toY - fromY) * length}
                stroke={COL.amber}
                strokeWidth="2.5"
              />
            );
          })}
        </svg>

        {/* Synthesizer box */}
        <div
          style={{
            position: 'absolute',
            left: 440,
            top: 410 - 250,
            width: 240,
            padding: '24px 28px',
            background: COL.teal,
            borderRadius: 10,
            fontFamily: FONT.body,
            fontSize: 22,
            fontWeight: 700,
            color: COL.textOnDark,
            opacity: synthOpacity,
            boxShadow: `0 0 24px ${COL.teal}66`,
          }}
        >
          <div style={{fontSize: 14, marginBottom: 4, letterSpacing: 2, opacity: 0.85}}>SYNTHESIZER</div>
          4ᵗʰ LLM call
        </div>
      </div>

      {/* Right side — structured 5-section output */}
      <div
        style={{
          position: 'absolute',
          right: 100,
          top: 220,
          width: 880,
        }}
      >
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            letterSpacing: 4,
            color: COL.amber,
            marginBottom: 20,
            fontWeight: 700,
            textTransform: 'uppercase',
            opacity: interpolate(frame, [200, 230], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            }),
          }}
        >
          Structured 5-section output
        </div>
        {SECTIONS.map((sec, i) => (
          <div
            key={sec}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 20px',
              marginBottom: 8,
              background: COL.bgPanel,
              borderLeft: `4px solid ${COL.tealLight}`,
              borderRadius: 6,
              opacity: sectionOpacity(i),
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: COL.teal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.body,
                fontSize: 18,
                fontWeight: 700,
                color: COL.textOnDark,
                marginRight: 20,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 26,
                fontWeight: 600,
                color: COL.textHigh,
              }}
            >
              {sec}
            </div>
          </div>
        ))}
      </div>

      {/* Status badges row at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 100,
          right: 100,
        }}
      >
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            letterSpacing: 4,
            color: COL.textMid,
            marginBottom: 18,
            fontWeight: 700,
            textTransform: 'uppercase',
            textAlign: 'center',
            opacity: interpolate(frame, [460, 490], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            }),
          }}
        >
          Each question gets a status badge
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 24}}>
          {STATUS_LEVELS.map((lvl, i) => (
            <div
              key={lvl.label}
              style={{
                padding: '18px 40px',
                background: lvl.color,
                borderRadius: 8,
                fontFamily: FONT.head,
                fontSize: 30,
                fontWeight: 700,
                color: COL.textOnDark,
                letterSpacing: 1,
                opacity: badgeOpacity(i),
                transform: `scale(${badgeScale(i)})`,
                minWidth: 200,
                textAlign: 'center',
              }}
            >
              {lvl.label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
