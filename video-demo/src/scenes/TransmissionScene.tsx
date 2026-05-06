import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

interface Stage {
  name: string;
  color: string;
  // Metric is split so we can animate the number portion
  metricPrefix: string;   // e.g. "Brent "
  metricSign:   string;   // "+" or "−"
  metricValue:  number;   // the value to count UP to
  metricSuffix: string;   // "%"
  driver:  string;
  caption: string;
}

const STAGES: Stage[] = [
  {
    name:    'Global',
    color:   COL.coral,
    metricPrefix: 'Brent ',
    metricSign:   '+',
    metricValue:  97,
    metricSuffix: '%',
    driver:  'Hormuz transits −14%',
    caption: 'Upstream commodity prices and shipping flows',
  },
  {
    name:    'Singapore',
    color:   COL.amber,
    metricPrefix: 'Refining IIP ',
    metricSign:   '−',
    metricValue:  22,
    metricSuffix: '%',
    driver:  'Pump prices +18%',
    caption: 'Domestic transmission to refining, prices, activity',
  },
  {
    name:    'Regional',
    color:   COL.tealLight,
    metricPrefix: 'Vietnam CPI ',
    metricSign:   '+',
    metricValue:  1.9,
    metricSuffix: 'pp',
    driver:  'Philippines 10Y yields +47bp',
    caption: 'Spillover into 10 ASEAN+NEA economies',
  },
];

export const TransmissionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headingOpacity = spring({frame, fps, config: {damping: 18}});

  // Each stage card animates in with a stagger; arrows draw between them
  const stageStartFrames = [40, 130, 220];

  return (
    <AbsoluteFill style={{padding: '120px 100px'}}>
      {/* Heading */}
      <div
        style={{
          fontFamily: FONT.head,
          fontSize: 60,
          fontWeight: 700,
          color: COL.textHigh,
          opacity: headingOpacity,
          marginBottom: 16,
        }}
      >
        Tracing the shock
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 26,
          color: COL.textMid,
          fontStyle: 'italic',
          opacity: headingOpacity,
          marginBottom: 80,
          maxWidth: 1500,
        }}
      >
        From global commodity markets, through Singapore's refining hub, into the wider region.
      </div>

      {/* 3 stage cards in a horizontal flow */}
      <div style={{display: 'flex', alignItems: 'center', gap: 0, position: 'relative'}}>
        {STAGES.map((stg, i) => {
          const start = stageStartFrames[i];
          const cardOpacity = interpolate(frame, [start, start + 25], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const cardLift = interpolate(frame, [start, start + 25], [40, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });

          // Arrow from this card to the next
          const arrowStart = stageStartFrames[i] + 25;
          const arrowProgress = i < STAGES.length - 1
            ? interpolate(frame, [arrowStart, arrowStart + 30], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              })
            : 0;

          return (
            <>
              <div
                style={{
                  flex: 1,
                  background: COL.bgPanel,
                  border: `2px solid ${stg.color}`,
                  borderRadius: 16,
                  padding: '40px 36px',
                  minHeight: 380,
                  opacity: cardOpacity,
                  transform: `translateY(${cardLift}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 16,
                    letterSpacing: 4,
                    color: stg.color,
                    fontWeight: 700,
                    marginBottom: 16,
                    textTransform: 'uppercase',
                  }}
                >
                  Stage {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: FONT.head,
                    fontSize: 56,
                    fontWeight: 700,
                    color: COL.textHigh,
                    marginBottom: 36,
                  }}
                >
                  {stg.name}
                </div>
                {(() => {
                  // Counter ticks from 0 to metricValue, starting once card is settled
                  const counterStart = start + 30;
                  const counterEnd   = start + 75;
                  const eased = interpolate(
                    frame, [counterStart, counterEnd], [0, 1],
                    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3)}
                  );
                  const tickedVal = stg.metricValue * eased;
                  const display = stg.metricValue >= 10
                    ? Math.round(tickedVal).toString()
                    : tickedVal.toFixed(1);
                  return (
                    <div
                      style={{
                        fontFamily: FONT.head,
                        fontSize: 38,
                        fontWeight: 700,
                        color: stg.color,
                        marginBottom: 8,
                      }}
                    >
                      {stg.metricPrefix}
                      <span style={{display: 'inline-block', minWidth: 100, textAlign: 'right'}}>
                        {stg.metricSign}{display}{stg.metricSuffix}
                      </span>
                    </div>
                  );
                })()}
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 22,
                    color: COL.textMid,
                    marginBottom: 40,
                  }}
                >
                  {stg.driver}
                </div>
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 20,
                    color: COL.textMuted,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}
                >
                  {stg.caption}
                </div>
              </div>

              {/* Arrow to next stage */}
              {i < STAGES.length - 1 && (
                <div
                  style={{
                    width: 80,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <svg width="60" height="40" viewBox="0 0 60 40">
                    {/* Animated line */}
                    <line
                      x1="0" y1="20"
                      x2={48 * arrowProgress} y2="20"
                      stroke={COL.amber}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Arrowhead — appears once line is mostly drawn */}
                    {arrowProgress > 0.85 && (
                      <polygon
                        points="48,12 60,20 48,28"
                        fill={COL.amber}
                      />
                    )}
                  </svg>
                </div>
              )}
            </>
          );
        })}
      </div>

      {/* Bottom caption — appears after all stages */}
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
          opacity: interpolate(frame, [330, 380], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
        }}
      >
        One dashboard, three lenses on the same shock.
      </div>
    </AbsoluteFill>
  );
};
