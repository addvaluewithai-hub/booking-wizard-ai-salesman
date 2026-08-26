import { lazy, Suspense, useEffect, useState } from 'react';
import type { MascotState } from './experience';

const RiveMascotCanvas = lazy(() => import('./RiveMascotCanvas'));

export type MascotStageProps = {
  state: MascotState;
  stepIndex: number;
  lookX: number;
  lookY: number;
  talking?: boolean;
  engaged?: boolean;
  riveSrc?: string | null;
};

function FallbackMascot({ state, lookX, lookY }: Pick<MascotStageProps, 'state' | 'lookX' | 'lookY'>) {
  const pupilX = Math.max(-4, Math.min(4, lookX / 24));
  const pupilY = Math.max(-3, Math.min(3, lookY / 30));

  return (
    <div className={`alamaar-mascot alamaar-mascot--${state}`} aria-hidden="true">
      <svg viewBox="0 0 260 330" role="img">
        <defs>
          <linearGradient id="alamaarWoodBody" x1="0" x2="1">
            <stop offset="0" stopColor="#7c4b2c" />
            <stop offset="0.18" stopColor="#a66c3f" />
            <stop offset="0.52" stopColor="#c48a55" />
            <stop offset="0.78" stopColor="#9b6239" />
            <stop offset="1" stopColor="#633b25" />
          </linearGradient>
          <linearGradient id="alamaarWoodHighlight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,.24)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="alamaarCharacterShadow" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="13" stdDeviation="10" floodColor="#000" floodOpacity="0.28" />
          </filter>
        </defs>

        <ellipse className="alamaar-mascot__ground" cx="132" cy="302" rx="82" ry="17" fill="rgba(0,0,0,.24)" />

        <g filter="url(#alamaarCharacterShadow)" className="alamaar-mascot__rig">
          <g className="alamaar-mascot__arm alamaar-mascot__arm--left">
            <path d="M67 163 C42 166 29 184 26 214" fill="none" stroke="#7a482b" strokeWidth="17" strokeLinecap="round" />
            <circle cx="25" cy="218" r="13" fill="#b57948" stroke="#58331f" strokeWidth="3" />
            <path d="M16 213 l-8 -8 M23 207 l-3 -11 M31 210 l4 -10" stroke="#704129" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g className="alamaar-mascot__arm alamaar-mascot__arm--right">
            <path d="M193 163 C218 163 231 180 234 206" fill="none" stroke="#7a482b" strokeWidth="17" strokeLinecap="round" />
            <circle cx="235" cy="210" r="13" fill="#b57948" stroke="#58331f" strokeWidth="3" />
            <path d="M227 204 l-5 -10 M236 201 l1 -11 M243 205 l7 -8" stroke="#704129" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g className="alamaar-mascot__body">
            <rect x="61" y="42" width="136" height="224" rx="36" fill="url(#alamaarWoodBody)" stroke="#4f2f1e" strokeWidth="5" />
            <path d="M74 56 C102 72 125 44 184 65" fill="none" stroke="rgba(71,38,20,.34)" strokeWidth="5" strokeLinecap="round" />
            <path d="M75 94 C103 83 141 103 183 83" fill="none" stroke="rgba(71,38,20,.24)" strokeWidth="3" strokeLinecap="round" />
            <path d="M72 148 C101 132 143 156 185 137" fill="none" stroke="rgba(71,38,20,.22)" strokeWidth="4" strokeLinecap="round" />
            <path d="M76 213 C112 194 145 220 182 201" fill="none" stroke="rgba(71,38,20,.25)" strokeWidth="4" strokeLinecap="round" />
            <path d="M76 50 Q123 35 184 57 L184 106 Q129 86 74 108 Z" fill="url(#alamaarWoodHighlight)" opacity=".7" />
          </g>

          <g className="alamaar-mascot__face">
            <path className="alamaar-mascot__brow alamaar-mascot__brow--left" d="M88 101 Q101 89 115 99" fill="none" stroke="#3b2418" strokeWidth="6" strokeLinecap="round" />
            <path className="alamaar-mascot__brow alamaar-mascot__brow--right" d="M143 99 Q158 87 173 100" fill="none" stroke="#3b2418" strokeWidth="6" strokeLinecap="round" />

            <ellipse cx="105" cy="128" rx="22" ry="27" fill="#fff9ec" stroke="#43291b" strokeWidth="4" />
            <ellipse cx="157" cy="128" rx="22" ry="27" fill="#fff9ec" stroke="#43291b" strokeWidth="4" />
            <circle cx={108 + pupilX} cy={132 + pupilY} r="8" fill="#201510" />
            <circle cx={160 + pupilX} cy={132 + pupilY} r="8" fill="#201510" />
            <circle cx={111 + pupilX} cy={129 + pupilY} r="2.5" fill="#fff" opacity=".8" />
            <circle cx={163 + pupilX} cy={129 + pupilY} r="2.5" fill="#fff" opacity=".8" />

            <path className="alamaar-mascot__mouth" d="M99 177 Q130 205 164 175 Q157 222 131 223 Q105 221 99 177" fill="#2a1710" stroke="#43291b" strokeWidth="4" />
            <path d="M111 187 Q131 197 153 185" stroke="#fff9ed" strokeWidth="7" strokeLinecap="round" />
            <path className="alamaar-mascot__tongue" d="M118 211 Q133 200 148 211" fill="none" stroke="#c46762" strokeWidth="6" strokeLinecap="round" />
          </g>

          <g className="alamaar-mascot__glasses">
            <rect x="78" y="111" width="51" height="31" rx="10" fill="#151514" stroke="#4a351f" strokeWidth="3" />
            <rect x="134" y="111" width="51" height="31" rx="10" fill="#151514" stroke="#4a351f" strokeWidth="3" />
            <path d="M128 120 H136" stroke="#151514" strokeWidth="6" />
            <path d="M87 116 L117 137" stroke="rgba(255,255,255,.16)" strokeWidth="4" />
            <path d="M143 116 L174 137" stroke="rgba(255,255,255,.16)" strokeWidth="4" />
          </g>

          <g className="alamaar-mascot__legs">
            <path d="M96 262 L88 292" stroke="#65402a" strokeWidth="16" strokeLinecap="round" />
            <path d="M161 262 L169 292" stroke="#65402a" strokeWidth="16" strokeLinecap="round" />
            <path d="M69 300 Q87 286 105 301" fill="none" stroke="#342218" strokeWidth="11" strokeLinecap="round" />
            <path d="M153 301 Q171 286 191 299" fill="none" stroke="#342218" strokeWidth="11" strokeLinecap="round" />
          </g>

          <g className="alamaar-mascot__sparkles">
            <path d="M219 62 l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#d8ae63" />
            <path d="M35 87 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f0d49a" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function MascotStage({
  state,
  stepIndex,
  lookX,
  lookY,
  talking = true,
  engaged = true,
  riveSrc,
}: MascotStageProps) {
  const [riveReady, setRiveReady] = useState(false);

  useEffect(() => {
    setRiveReady(false);
  }, [riveSrc]);

  return (
    <div className={`alamaar-character-stage ${riveReady ? 'is-rive-ready' : 'is-fallback'}`} data-mascot-state={state}>
      <FallbackMascot state={state} lookX={lookX} lookY={lookY} />
      {riveSrc ? (
        <Suspense fallback={null}>
          <div className="alamaar-rive-layer" aria-hidden={!riveReady}>
            <RiveMascotCanvas
              src={riveSrc}
              state={state}
              stepIndex={stepIndex}
              lookX={lookX}
              lookY={lookY}
              talking={talking}
              engaged={engaged}
              onReady={() => setRiveReady(true)}
            />
          </div>
        </Suspense>
      ) : null}
      <span className="alamaar-character-stage__engine">{riveReady ? 'RIVE · LIVE' : 'RIVE · READY'}</span>
    </div>
  );
}
