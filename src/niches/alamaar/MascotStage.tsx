import { lazy, Suspense, useEffect, useState } from 'react';
import type { MascotState } from './experience';
import ProceduralMascot from './ProceduralMascot';
import './mascot-stage.css';

const RiveMascotCanvas = lazy(() => import('./RiveMascotCanvas'));

export type MascotStageProps = {
  state: MascotState;
  stepIndex: number;
  lookX: number;
  lookY: number;
  talking?: boolean;
  engaged?: boolean;
  seated?: boolean;
  riveSrc?: string | null;
};

export default function MascotStage({
  state,
  stepIndex,
  lookX,
  lookY,
  engaged = true,
  seated = false,
  riveSrc,
}: MascotStageProps) {
  const [riveReady, setRiveReady] = useState(false);

  useEffect(() => {
    setRiveReady(false);
  }, [riveSrc]);

  return (
    <div
      className={`alamaar-character-stage ${riveReady ? 'is-rive-ready' : 'is-fallback'} ${seated ? 'is-seated' : ''}`}
      data-mascot-state={state}
      data-character-engine={riveReady ? 'rive' : 'procedural'}
      data-seated={seated ? 'true' : 'false'}
    >
      <div className="alamaar-character-stage__procedural" aria-hidden={riveReady}>
        <ProceduralMascot
          state={state}
          stepIndex={stepIndex}
          lookX={lookX}
          lookY={lookY}
          talking={false}
          engaged={engaged}
        />
      </div>

      {riveSrc ? (
        <Suspense fallback={null}>
          <div className="alamaar-rive-layer" aria-hidden={!riveReady}>
            <RiveMascotCanvas
              src={riveSrc}
              state={state}
              stepIndex={stepIndex}
              lookX={lookX}
              lookY={lookY}
              talking={false}
              engaged={engaged}
              seated={seated}
              onReady={() => setRiveReady(true)}
            />
          </div>
        </Suspense>
      ) : null}

      <span className="alamaar-character-stage__engine">
        {riveReady ? 'RIVE · MICRO LIVE' : seated ? 'SEATED RIG · LIVE' : 'MICRO RIG · LIVE'}
      </span>
    </div>
  );
}
