import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

// Animated counter that ticks from 0 to target over the given window
const Counter: React.FC<{
  value: number;
  startFrame: number;
  endFrame: number;
}> = ({value, startFrame, endFrame}) => {
  const frame = useCurrentFrame();
  const eased = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return <>{Math.round(value * eased).toLocaleString()}</>;
};

const StatBlock: React.FC<{
  value: number;
  label: string;
  startFrame: number;
  endFrame: number;
  color: string;
}> = ({value, label, startFrame, endFrame, color}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame - 10, startFrame], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{flex: 1, textAlign: 'center', opacity}}>
      <div
        style={{
          fontFamily: FONT.head,
          fontSize: 96,
          fontWeight: 700,
          color,
          lineHeight: 1,
          marginBottom: 12,
        }}
      >
        <Counter value={value} startFrame={startFrame} endFrame={endFrame} />
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 20,
          color: COL.textMid,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// 8 data sources to "light up" sequentially
const SOURCES = [
  'CEIC',
  'Bloomberg',
  'SingStat',
  'UN Comtrade',
  'IMF PortWatch',
  'yfinance',
  'Motorist.sg',
  'ADB',
];

export const ChallengeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Heading appears first
  const headingOpacity = spring({frame, fps, config: {damping: 18}});

  // 8 source chips light up sequentially (frames 30-150, ~15f each)
  const sourceStartFrames = SOURCES.map((_, i) => 30 + i * 15);

  // 3 stat counters appear after all sources have lit (frames 200-260)
  const statStarts = [200, 220, 240];
  const statEnds   = [240, 260, 280];

  // The two questions reveal at the bottom after the stats
  const q1Opacity = interpolate(frame, [310, 350], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const q2Opacity = interpolate(frame, [340, 380], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

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
          marginBottom: 14,
        }}
      >
        The challenge
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 24,
          color: COL.textMid,
          fontStyle: 'italic',
          opacity: headingOpacity,
          marginBottom: 36,
          maxWidth: 1500,
        }}
      >
        Track the Iran-Israel conflict's economic transmission to Singapore and the region — refreshed daily from many sources.
      </div>

      {/* Section A: 8 source chips lighting up sequentially */}
      <div style={{marginBottom: 24}}>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 14,
            letterSpacing: 4,
            color: COL.amber,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: 16,
            opacity: headingOpacity,
          }}
        >
          Daily ingestion from 8 sources
        </div>
        <div style={{display: 'flex', gap: 14, flexWrap: 'wrap'}}>
          {SOURCES.map((src, i) => {
            const lightOpacity = interpolate(
              frame,
              [sourceStartFrames[i], sourceStartFrames[i] + 12],
              [0, 1],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
            );
            const checkOpacity = interpolate(
              frame,
              [sourceStartFrames[i] + 8, sourceStartFrames[i] + 22],
              [0, 1],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
            );
            return (
              <div
                key={src}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  background: COL.bgPanel,
                  border: `1.5px solid ${interpolate(checkOpacity, [0, 1], [0.3, 1]) > 0.6 ? COL.calm : COL.border}`,
                  borderRadius: 8,
                  opacity: lightOpacity,
                  transition: 'border-color 0.3s',
                }}
              >
                {/* Checkmark when "ingested" */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: COL.calm,
                    marginRight: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: checkOpacity,
                  }}
                >
                  ✓
                </div>
                <span
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 18,
                    fontWeight: 600,
                    color: COL.textHigh,
                  }}
                >
                  {src}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section B: 3 animated counter blocks for series/charts/economies */}
      <div style={{display: 'flex', gap: 40, marginBottom: 28}}>
        <StatBlock value={491} label="Series tracked" startFrame={statStarts[0]} endFrame={statEnds[0]} color={COL.amber} />
        <StatBlock value={208} label="Charts rendered" startFrame={statStarts[1]} endFrame={statEnds[1]} color={COL.coral} />
        <StatBlock value={11}  label="Economies"      startFrame={statStarts[2]} endFrame={statEnds[2]} color={COL.calm} />
      </div>

      {/* The two daily questions, each with the 5 narrative-section bullets
          mirroring the dashboard's structured-output schema (matches Slide 2
          of the showcase deck). Bullets stagger in after the question pill. */}
      {(() => {
        const energyBullets = ['Upstream prices', 'Inflation passthrough', 'Physical supply', 'Downstream activity', 'Overall'];
        const financeBullets = ['Credit risk', 'Interest rate risk', 'FX risk', 'Liquidity risk', 'Overall'];
        const bulletStartFrame = (qStartFrame: number) => qStartFrame + 30;
        const bulletOpacity = (qStartFrame: number, idx: number) =>
          interpolate(
            frame,
            [bulletStartFrame(qStartFrame) + idx * 8, bulletStartFrame(qStartFrame) + 25 + idx * 8],
            [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );

        return (
          <div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 14,
                letterSpacing: 4,
                color: COL.amber,
                marginBottom: 14,
                opacity: q1Opacity,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              And the dashboard answers two daily questions
            </div>
            <div style={{display: 'flex', gap: 24}}>
              {/* Q1 — Energy supply */}
              <div style={{flex: 1, opacity: q1Opacity}}>
                <div
                  style={{
                    padding: '20px 24px',
                    background: COL.teal,
                    borderRadius: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT.head,
                      fontSize: 26,
                      fontWeight: 700,
                      color: COL.textOnDark,
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    How concerned should MAS be about energy supply?
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                  {energyBullets.map((b, i) => (
                    <div
                      key={b}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        opacity: bulletOpacity(310, i),
                      }}
                    >
                      <div style={{width: 11, height: 11, borderRadius: 6, background: COL.teal, marginRight: 14, flexShrink: 0}} />
                      <div style={{fontFamily: FONT.body, fontSize: 23, color: COL.textHigh}}>{b}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q2 — Financial markets */}
              <div style={{flex: 1, opacity: q2Opacity}}>
                <div
                  style={{
                    padding: '20px 24px',
                    background: COL.navy,
                    borderRadius: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT.head,
                      fontSize: 26,
                      fontWeight: 700,
                      color: COL.textOnDark,
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Are financial markets showing signs of tightening?
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                  {financeBullets.map((b, i) => (
                    <div
                      key={b}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        opacity: bulletOpacity(340, i),
                      }}
                    >
                      <div style={{width: 11, height: 11, borderRadius: 6, background: COL.navy, marginRight: 14, flexShrink: 0}} />
                      <div style={{fontFamily: FONT.body, fontSize: 23, color: COL.textHigh}}>{b}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
