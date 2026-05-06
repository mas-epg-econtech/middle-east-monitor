import {AbsoluteFill, Sequence} from 'remotion';
import {DURATIONS, COL} from './design';
import {TitleScene} from './scenes/TitleScene';
import {GeographyScene} from './scenes/GeographyScene';
import {ChallengeScene} from './scenes/ChallengeScene';
import {TransmissionScene} from './scenes/TransmissionScene';
import {NarrativesScene} from './scenes/NarrativesScene';
import {AuditTrailScene} from './scenes/AuditTrailScene';
import {PipelineScene} from './scenes/PipelineScene';
import {ClosingScene} from './scenes/ClosingScene';

// Cumulative scene start frames
const t0 = 0;
const t1 = t0 + DURATIONS.title;
const t2 = t1 + DURATIONS.geography;
const t3 = t2 + DURATIONS.challenge;
const t4 = t3 + DURATIONS.transmission;
const t5 = t4 + DURATIONS.narratives;
const t6 = t5 + DURATIONS.audit;
const t7 = t6 + DURATIONS.pipeline;

export const MiddleEastMonitorDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: COL.bgDeep}}>
      <Sequence from={t0} durationInFrames={DURATIONS.title}>
        <TitleScene />
      </Sequence>
      <Sequence from={t1} durationInFrames={DURATIONS.geography}>
        <GeographyScene />
      </Sequence>
      <Sequence from={t2} durationInFrames={DURATIONS.challenge}>
        <ChallengeScene />
      </Sequence>
      <Sequence from={t3} durationInFrames={DURATIONS.transmission}>
        <TransmissionScene />
      </Sequence>
      <Sequence from={t4} durationInFrames={DURATIONS.narratives}>
        <NarrativesScene />
      </Sequence>
      <Sequence from={t5} durationInFrames={DURATIONS.audit}>
        <AuditTrailScene />
      </Sequence>
      <Sequence from={t6} durationInFrames={DURATIONS.pipeline}>
        <PipelineScene />
      </Sequence>
      <Sequence from={t7} durationInFrames={DURATIONS.closing}>
        <ClosingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
