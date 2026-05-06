import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

interface Stage {
  num: string;
  name: string;
  color: string;
  headline: string;   // big short phrase — what this stage does
  caption: string;    // 1 short line of supporting detail
}

const STAGES: Stage[] = [
  {
    num: '01', name: 'INGEST', color: '#5DADE2',  // bright sky-blue (navy was too dark on dark bg)
    headline: '8 sources, daily refresh',
    caption: 'Zero manual intervention',
  },
  {
    num: '02', name: 'DERIVE', color: COL.tealLight,
    headline: '30+ computed series',
    caption: 'Shares, indices, country aggregates',
  },
  {
    num: '03', name: 'NARRATE', color: COL.amber,
    headline: '4 AI calls per refresh',
    caption: 'Structured reads, every claim cited',
  },
  {
    num: '04', name: 'RENDER', color: COL.coral,
    headline: 'Static HTML, click-to-cite',
    caption: 'One source, two deploy targets',
  },
  {
    num: '05', name: 'DEPLOY', color: COL.calm,
    headline: 'Auto-published every morning',
    caption: 'GitHub Pages + Airbase, email on failure',
  },
];

export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headingOpacity = spring({frame, fps, config: {damping: 18}});

  // Each stage card animates in with a stagger. 120-frame intervals
  // (4 sec) give the viewer enough time to read each card before the
  // next one appears.
  const cardStarts = [40, 160, 280, 400, 520];

  // Bottom caption appears after the last card has settled
  const captionOpacity = interpolate(frame, [700, 740], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Card geometry — wider cards, less content per card so they read fast
  const cardW = 320;
  const cardH = 480;
  const cardGap = 50;
  const totalW = STAGES.length * cardW + (STAGES.length - 1) * cardGap;
  const startX = (1920 - totalW) / 2;
  const cardY = 360;

  return (
    <AbsoluteFill style={{padding: '90px 100px'}}>
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
        Cowork built every layer
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
        From raw data feeds to a daily-refreshed dashboard — five end-to-end stages.
      </div>

      {/* 5 stage cards laid out absolutely. Each rendered as its own
          top-level div with a stable key so React can keep them straight. */}
      {STAGES.map((stg, i) => {
        const x = startX + i * (cardW + cardGap);
        const start = cardStarts[i];
        const cardOpacity = interpolate(frame, [start, start + 25], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const cardLift = interpolate(frame, [start, start + 25], [40, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        // Headline + caption fade in shortly after the card lands
        const textOpacity = interpolate(frame, [start + 18, start + 40], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });

        return (
          <div
            key={`card-${stg.name}`}
            style={{
              position: 'absolute',
              left: x,
              top: cardY,
              width: cardW,
              height: cardH,
              background: COL.bgPanel,
              border: `1px solid ${COL.border}`,
              borderRadius: 12,
              opacity: cardOpacity,
              transform: `translateY(${cardLift}px)`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top accent stripe — full width, sits at very top of card */}
            <div
              style={{
                width: '100%',
                height: 8,
                background: stg.color,
                flexShrink: 0,
              }}
            />

            {/* Inner content padding */}
            <div
              style={{
                flex: 1,
                padding: '32px 36px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Stage number — top left, large, in accent color */}
              <div
                style={{
                  fontFamily: FONT.head,
                  fontSize: 56,
                  fontWeight: 700,
                  color: stg.color,
                  lineHeight: 1,
                  marginBottom: 16,
                }}
              >
                {stg.num}
              </div>

              {/* Stage name — large, centered, white */}
              <div
                style={{
                  fontFamily: FONT.head,
                  fontSize: 30,
                  fontWeight: 700,
                  color: COL.textHigh,
                  letterSpacing: 1.5,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {stg.name}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 2,
                  background: stg.color,
                  opacity: 0.4,
                  marginBottom: 28,
                  marginTop: 16,
                }}
              />

              {/* Headline — short, bold, the one thing to remember */}
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 22,
                  fontWeight: 700,
                  color: COL.textHigh,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  marginBottom: 14,
                  opacity: textOpacity,
                }}
              >
                {stg.headline}
              </div>

              {/* Caption — supporting detail, italic, muted */}
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 16,
                  color: COL.textMid,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  fontStyle: 'italic',
                  opacity: textOpacity,
                }}
              >
                {stg.caption}
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrows between cards — separate pass so they stack cleanly.
          Arrow draws AFTER the card has fully settled and its text has
          had a long pause to read (90-frame = 3-sec pause from card landing).
          Once drawn, a tiny "data dot" loops along the arrow to suggest
          continuous flow through the pipeline. */}
      {STAGES.slice(0, -1).map((_, i) => {
        const x = startX + i * (cardW + cardGap);
        const arrowStart = cardStarts[i] + 90;
        const arrowEndDraw = arrowStart + 25;
        const arrowProgress = interpolate(frame, [arrowStart, arrowEndDraw], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        // Looping data-dot — only visible after the arrow has been drawn.
        // Position cycles 0→1 every 60 frames (2s).
        const dotActive = frame >= arrowEndDraw;
        const dotCyclePos = ((frame - arrowEndDraw) % 60) / 60;
        const dotX = (cardGap - 10) * dotCyclePos;
        return (
          <svg
            key={`arrow-${i}`}
            style={{
              position: 'absolute',
              left: x + cardW,
              top: cardY + cardH / 2 - 20,
              width: cardGap,
              height: 40,
            }}
            viewBox={`0 0 ${cardGap} 40`}
          >
            <line
              x1="0" y1="20"
              x2={(cardGap - 10) * arrowProgress} y2="20"
              stroke={COL.amber}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {arrowProgress > 0.85 && (
              <polygon
                points={`${cardGap - 10},14 ${cardGap},20 ${cardGap - 10},26`}
                fill={COL.amber}
              />
            )}
            {dotActive && (
              <circle
                cx={dotX}
                cy="20"
                r="3.5"
                fill={COL.gold}
                opacity={
                  // Fade in/out at start and end of cycle
                  dotCyclePos < 0.1 ? dotCyclePos * 10 :
                  dotCyclePos > 0.9 ? (1 - dotCyclePos) * 10 :
                  1
                }
              />
            )}
          </svg>
        );
      })}

      {/* Bottom caption */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 100,
          right: 100,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontSize: 22,
          color: COL.textMid,
          fontStyle: 'italic',
          opacity: captionOpacity,
        }}
      >
        Five layers, one shared codebase. Researcher reviewed and shaped — Cowork wrote.
      </div>
    </AbsoluteFill>
  );
};
