import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COL, FONT} from '../design';

// Audit-trail scene — visualises slide 9's click-through:
// Key Drivers panel (left) → click on `gs.energy.crude_oil` badge →
// Crude Oil chart (right) materializes with matching ID highlighted.

export const AuditTrailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headingOpacity = spring({frame, fps, config: {damping: 18}});

  // Stage 1: Key Drivers image fades in (frames 30-70)
  const leftImgOpacity = interpolate(frame, [30, 70], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 2: Highlight box appears around the badge (frames 100-130)
  const leftBoxOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 3: Arrow draws horizontally from left badge to the western edge
  // of the right chart panel (frames 160-230)
  const arrowProgress = interpolate(frame, [160, 230], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 4: Right chart appears (frames 230-280)
  const rightImgOpacity = interpolate(frame, [230, 280], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Stage 5: Right highlight box appears (frames 290-320)
  const rightBoxOpacity = interpolate(frame, [290, 320], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Layout coords (1920×1080 stage area)
  // Two image panels side by side. Left = key_drivers (1118×1084 ~ square),
  // Right = global_chart (1230×794 ~ landscape).
  const panelTop = 240;
  const panelH = 620;
  const leftW = panelH * (1118 / 1084);   // ≈ 640
  const rightW = panelH * (1230 / 794);    // ≈ 960
  const leftX = 120;
  const rightX = 1920 - 120 - rightW;

  // Highlight box on LEFT image — shifted slightly right so the box
  // properly contains the chart-ID tag (the pill border around
  // "# gs.energy.crude_oil")
  const leftBadgeX = leftX + leftW * 0.022;
  const leftBadgeY = panelTop + panelH * 0.110;
  const leftBadgeW = leftW * 0.290;
  const leftBadgeH = panelH * 0.045;

  // Highlight box positions on the RIGHT image (badge ≈ x_pct 70-96%, y_pct 87.5-93.5%)
  const rightBadgeX = rightX + rightW * 0.700;
  const rightBadgeY = panelTop + panelH * 0.875;
  const rightBadgeW = rightW * 0.260;
  const rightBadgeH = panelH * 0.060;

  // Arrow goes EASTWARD only — from the right edge of the left badge to
  // the LEFT EDGE (western border) of the right chart panel. Both at the
  // same y so the arrow is purely horizontal.
  const arrowY      = leftBadgeY + leftBadgeH / 2;
  const arrowStartX = leftBadgeX + leftBadgeW;
  const arrowEndX   = rightX;                // western border of right chart panel
  const arrowDrawX  = arrowStartX + (arrowEndX - arrowStartX) * arrowProgress;

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
        Every claim is auditable
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
        Each Key Driver bullet links to the chart it cites — click the badge, the dashboard navigates to the source.
      </div>

      {/* LEFT image — Key Drivers panel */}
      <div
        style={{
          position: 'absolute',
          left: leftX,
          top: panelTop,
          width: leftW,
          height: panelH,
          background: COL.bgDeep,
          border: `1px solid ${COL.border}`,
          opacity: leftImgOpacity,
          overflow: 'hidden',
        }}
      >
        <img src={staticFile('key_drivers.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </div>

      {/* Highlight box on LEFT badge */}
      <div
        style={{
          position: 'absolute',
          left: leftBadgeX,
          top: leftBadgeY,
          width: leftBadgeW,
          height: leftBadgeH,
          border: `3px solid ${COL.amber}`,
          borderRadius: 6,
          opacity: leftBoxOpacity,
          boxShadow: `0 0 20px ${COL.amber}88`,
        }}
      />

      {/* Animated horizontal arrow: left badge → western border of right chart */}
      <svg
        style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}
      >
        <line
          x1={arrowStartX}
          y1={arrowY}
          x2={arrowDrawX}
          y2={arrowY}
          stroke={COL.amber}
          strokeWidth="5"
          strokeLinecap="round"
          opacity={arrowProgress > 0 ? 1 : 0}
        />
        {arrowProgress > 0.92 && (
          <polygon
            points={`${arrowEndX - 18},${arrowY - 10} ${arrowEndX},${arrowY} ${arrowEndX - 18},${arrowY + 10}`}
            fill={COL.amber}
          />
        )}
      </svg>

      {/* "Click" label, sitting just above the arrow midpoint */}
      <div
        style={{
          position: 'absolute',
          left: (arrowStartX + arrowEndX) / 2 - 60,
          top: arrowY - 50,
          fontFamily: FONT.head,
          fontSize: 28,
          fontWeight: 700,
          color: COL.amber,
          opacity: interpolate(frame, [180, 220], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
        }}
      >
        Click →
      </div>

      {/* RIGHT image — Crude Oil chart */}
      <div
        style={{
          position: 'absolute',
          left: rightX,
          top: panelTop,
          width: rightW,
          height: panelH,
          background: COL.bgDeep,
          border: `1px solid ${COL.border}`,
          opacity: rightImgOpacity,
          overflow: 'hidden',
        }}
      >
        <img src={staticFile('global_chart.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </div>

      {/* Highlight box on RIGHT badge */}
      <div
        style={{
          position: 'absolute',
          left: rightBadgeX,
          top: rightBadgeY,
          width: rightBadgeW,
          height: rightBadgeH,
          border: `3px solid ${COL.amber}`,
          borderRadius: 6,
          opacity: rightBoxOpacity,
          boxShadow: `0 0 20px ${COL.amber}88`,
        }}
      />
    </AbsoluteFill>
  );
};
