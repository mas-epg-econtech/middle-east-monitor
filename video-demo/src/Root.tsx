import {Composition} from 'remotion';
import {MiddleEastMonitorDemo} from './MiddleEastMonitorDemo';
import {CANVAS, TOTAL_FRAMES} from './design';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MiddleEastMonitorDemo"
      component={MiddleEastMonitorDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
    />
  );
};
