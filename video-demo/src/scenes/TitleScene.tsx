import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Title fades in with a gentle spring
  const titleOpacity = spring({frame, fps, config: {damping: 18}});
  const titleY = interpolate(spring({frame, fps, config: {damping: 18}}), [0, 1], [30, 0]);

  // Subtitle reveals after title
  const subOpacity = interpolate(frame, [25, 55], [0, 1], {extrapolateRight: 'clamp'});

  // MAS attribution at the bottom
  const masOpacity = interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'});

  // Subtle radial highlight that breathes across the title
  const glowOpacity = 0.20 + 0.10 * Math.sin((frame / 30) * 0.6 * Math.PI);

  // Background — slowly-drifting Brent oil chart line for atmosphere.
  // 60 sample points sketching a rising-then-volatile shape (post-war pattern).
  const chartPoints = (() => {
    const n = 60;
    const pts: {x: number; y: number}[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // Pre-war flat (~y=0.6), then rising spike around t=0.5, then volatile
      const base = t < 0.45
        ? 0.65 + 0.05 * Math.sin(i * 0.6)
        : 0.65 - (t - 0.45) * 1.2 + 0.10 * Math.sin(i * 0.5) + 0.06 * Math.cos(i * 0.9);
      pts.push({x: t * 1920, y: base * 1080});
    }
    return pts;
  })();
  const chartProgress = interpolate(frame, [0, 150], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const chartPath = chartPoints
    .slice(0, Math.ceil(chartPoints.length * chartProgress))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 38%, ${COL.bgPanel} 0%, ${COL.bgDeep} 70%)`,
      }}
    >
      {/* Background — drifting Brent oil chart silhouette */}
      <svg
        viewBox="0 0 1920 1080"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18}}
      >
        <path d={chartPath} fill="none" stroke={COL.amber} strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Soft glow behind the title */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${COL.amber}22 0%, transparent 50%)`,
          opacity: glowOpacity,
        }}
      />

      {/* Top amber accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 8,
          background: COL.amber,
          opacity: titleOpacity,
        }}
      />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 100px'}}>
        {/* Eyebrow tag */}
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 22,
            letterSpacing: 8,
            color: COL.amber,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 32,
            fontWeight: 600,
          }}
        >
          MONETARY AUTHORITY OF SINGAPORE
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FONT.head,
            fontSize: 110,
            fontWeight: 700,
            color: COL.textHigh,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: 'center',
            lineHeight: 1.05,
            marginBottom: 40,
          }}
        >
          Middle East Monitor
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 36,
            color: COL.textMid,
            opacity: subOpacity,
            textAlign: 'center',
            maxWidth: 1300,
            lineHeight: 1.35,
            fontStyle: 'italic',
          }}
        >
          A daily economic read on the Iran-Israel conflict's
          <br />
          transmission to Singapore and the region
        </div>

        {/* Bottom attribution */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            fontFamily: FONT.body,
            fontSize: 20,
            color: COL.textMuted,
            letterSpacing: 4,
            opacity: masOpacity,
          }}
        >
          AN MAS INTERNAL DASHBOARD · BUILT WITH COWORK
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
