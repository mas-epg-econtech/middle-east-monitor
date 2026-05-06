import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headlineOpacity = spring({frame, fps, config: {damping: 16}});
  const headlineY = interpolate(spring({frame, fps, config: {damping: 16}}), [0, 1], [40, 0]);

  const subOpacity = interpolate(frame, [40, 75], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const tagOpacity = interpolate(frame, [80, 120], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // URL types out character by character (frames 100-180)
  const URL = 'middle-east-monitor.app.tc1.airbase.sg';
  const charsRevealed = Math.floor(
    interpolate(frame, [100, 180], [0, URL.length], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
  );
  const typedUrl = URL.slice(0, charsRevealed);
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${COL.bgPanel} 0%, ${COL.bgDeep} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Top amber accent */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 8,
          background: COL.amber,
          opacity: headlineOpacity,
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 22,
          letterSpacing: 8,
          color: COL.amber,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          marginBottom: 32,
          fontWeight: 600,
        }}
      >
        MIDDLE EAST MONITOR
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: FONT.head,
          fontSize: 100,
          fontWeight: 700,
          color: COL.textHigh,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          textAlign: 'center',
          lineHeight: 1.05,
          marginBottom: 36,
        }}
      >
        Built in days, not weeks.
      </div>

      {/* Subhead */}
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 30,
          color: COL.textMid,
          opacity: subOpacity,
          textAlign: 'center',
          maxWidth: 1300,
          lineHeight: 1.4,
          fontStyle: 'italic',
          marginBottom: 60,
        }}
      >
        Researcher reviewed and shaped every layer. Cowork wrote the code.
      </div>

      {/* URL CTA — types out character by character */}
      <div
        style={{
          marginTop: 24,
          padding: '18px 36px',
          background: COL.bgPanel,
          border: `2px solid ${COL.amber}`,
          borderRadius: 10,
          fontFamily: FONT.mono,
          fontSize: 28,
          color: COL.amber,
          letterSpacing: 1,
          opacity: interpolate(frame, [95, 120], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
        }}
      >
        <span style={{color: COL.textMuted, marginRight: 12}}>↗</span>
        {typedUrl}
        <span style={{opacity: cursorVisible ? 1 : 0, marginLeft: 2}}>|</span>
      </div>

      {/* Bottom tag */}
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          fontFamily: FONT.body,
          fontSize: 20,
          color: COL.textMuted,
          letterSpacing: 4,
          opacity: tagOpacity,
        }}
      >
        AN MAS INTERNAL DASHBOARD · BUILT WITH COWORK
      </div>
    </AbsoluteFill>
  );
};
