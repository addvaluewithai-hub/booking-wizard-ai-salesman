import { useEffect, useState } from 'react';
import type { MascotState } from './experience';
import './mascot.css';

type ProceduralMascotProps = {
  state: MascotState;
  lookX: number;
  lookY: number;
  talking: boolean;
  engaged: boolean;
  stepIndex: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function ProceduralMascot({
  state,
  lookX,
  lookY,
  talking,
  engaged,
  stepIndex,
}: ProceduralMascotProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let blinkTimer = 0;
    let reopenTimer = 0;
    let cancelled = false;

    const scheduleBlink = () => {
      const delay = 2200 + Math.round(Math.random() * 3600);
      blinkTimer = window.setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        reopenTimer = window.setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          scheduleBlink();
        }, 115);
      }, delay);
    };

    scheduleBlink();
    return () => {
      cancelled = true;
      window.clearTimeout(blinkTimer);
      window.clearTimeout(reopenTimer);
    };
  }, []);

  const pupilX = clamp(lookX * 0.065, -6.5, 6.5);
  const pupilY = clamp(lookY * 0.045, -4.5, 4.5);
  const faceX = clamp(lookX * 0.018, -2.2, 2.2);
  const faceY = clamp(lookY * 0.012, -1.6, 1.6);
  const headTilt = clamp(lookX * 0.015, -1.6, 1.6);

  return (
    <div
      className={`alamaar-proc ${blink ? 'is-blinking' : ''} ${talking ? 'is-talking' : ''} ${engaged ? 'is-engaged' : ''}`}
      data-state={state}
      data-step={stepIndex}
      aria-hidden="true"
    >
      <svg viewBox="0 0 300 380" role="img">
        <defs>
          <linearGradient id="ap-wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#643a24" />
            <stop offset="0.13" stopColor="#8c5734" />
            <stop offset="0.34" stopColor="#c18450" />
            <stop offset="0.57" stopColor="#d29a63" />
            <stop offset="0.76" stopColor="#9d633b" />
            <stop offset="1" stopColor="#5b3522" />
          </linearGradient>
          <linearGradient id="ap-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,.36)" />
            <stop offset="0.38" stopColor="rgba(255,255,255,.04)" />
            <stop offset="1" stopColor="rgba(48,24,11,.3)" />
          </linearGradient>
          <radialGradient id="ap-eye" cx="42%" cy="30%" r="72%">
            <stop offset="0" stopColor="#fffef8" />
            <stop offset="1" stopColor="#efe5d2" />
          </radialGradient>
          <linearGradient id="ap-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#292927" />
            <stop offset="0.52" stopColor="#111110" />
            <stop offset="1" stopColor="#3d2b19" />
          </linearGradient>
          <filter id="ap-shadow" x="-50%" y="-50%" width="200%" height="220%">
            <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#000" floodOpacity=".32" />
          </filter>
          <filter id="ap-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <ellipse className="alamaar-proc__floor-glow" cx="150" cy="339" rx="88" ry="18" fill="#000" opacity=".22" filter="url(#ap-soft)" />
        <ellipse className="alamaar-proc__floor" cx="150" cy="338" rx="77" ry="12" fill="rgba(0,0,0,.24)" />

        <g className="alamaar-proc__rig" filter="url(#ap-shadow)">
          <g className="alamaar-proc__leg alamaar-proc__leg--left">
            <path d="M112 292 C111 309 108 320 103 331" fill="none" stroke="#6c432c" strokeWidth="17" strokeLinecap="round" />
            <path d="M82 338 Q103 322 124 338" fill="none" stroke="#342117" strokeWidth="12" strokeLinecap="round" />
          </g>
          <g className="alamaar-proc__leg alamaar-proc__leg--right">
            <path d="M190 292 C191 309 195 320 200 331" fill="none" stroke="#6c432c" strokeWidth="17" strokeLinecap="round" />
            <path d="M181 338 Q201 322 223 337" fill="none" stroke="#342117" strokeWidth="12" strokeLinecap="round" />
          </g>

          <g className="alamaar-proc__arm alamaar-proc__arm--left">
            <path d="M81 177 C51 179 36 197 29 225" fill="none" stroke="#75482d" strokeWidth="18" strokeLinecap="round" />
            <g className="alamaar-proc__hand alamaar-proc__hand--left">
              <circle cx="27" cy="231" r="14" fill="#b77948" stroke="#4c2c1d" strokeWidth="3" />
              <path d="M17 226 l-9 -10 M25 221 l-3 -13 M34 224 l6 -11" fill="none" stroke="#72442b" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>

          <g className="alamaar-proc__arm alamaar-proc__arm--right">
            <path d="M219 177 C248 178 265 197 272 225" fill="none" stroke="#75482d" strokeWidth="18" strokeLinecap="round" />
            <g className="alamaar-proc__hand alamaar-proc__hand--right">
              <circle cx="274" cy="231" r="14" fill="#b77948" stroke="#4c2c1d" strokeWidth="3" />
              <path d="M265 225 l-5 -12 M274 221 l1 -13 M282 225 l8 -10" fill="none" stroke="#72442b" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>

          <g className="alamaar-proc__body">
            <rect x="75" y="45" width="150" height="252" rx="39" fill="url(#ap-wood)" stroke="#47291b" strokeWidth="5" />
            <rect x="82" y="52" width="136" height="238" rx="33" fill="url(#ap-edge)" opacity=".48" />
            <path d="M91 67 C116 82 145 52 208 73" fill="none" stroke="rgba(66,31,15,.42)" strokeWidth="5" strokeLinecap="round" />
            <path d="M89 104 C121 89 157 113 210 93" fill="none" stroke="rgba(66,31,15,.24)" strokeWidth="3" strokeLinecap="round" />
            <path d="M88 158 C116 141 164 166 211 146" fill="none" stroke="rgba(66,31,15,.22)" strokeWidth="4" strokeLinecap="round" />
            <path d="M91 218 C129 196 165 229 207 205" fill="none" stroke="rgba(66,31,15,.25)" strokeWidth="4" strokeLinecap="round" />
            <path d="M102 272 C125 257 158 276 194 258" fill="none" stroke="rgba(66,31,15,.2)" strokeWidth="3" strokeLinecap="round" />
            <path className="alamaar-proc__body-shine" d="M91 59 Q151 38 207 63 L204 108 Q151 88 91 111 Z" fill="rgba(255,255,255,.12)" />
          </g>

          <g
            className="alamaar-proc__face"
            style={{ transform: `translate(${faceX}px, ${faceY}px) rotate(${headTilt}deg)` }}
          >
            <path className="alamaar-proc__brow alamaar-proc__brow--left" d="M103 113 Q116 101 132 110" fill="none" stroke="#352116" strokeWidth="6" strokeLinecap="round" />
            <path className="alamaar-proc__brow alamaar-proc__brow--right" d="M167 110 Q184 99 198 113" fill="none" stroke="#352116" strokeWidth="6" strokeLinecap="round" />

            <g className="alamaar-proc__eye alamaar-proc__eye--left">
              <ellipse cx="121" cy="143" rx="24" ry="29" fill="url(#ap-eye)" stroke="#3d281b" strokeWidth="4" />
              <g className="alamaar-proc__pupil" transform={`translate(${pupilX} ${pupilY})`}>
                <ellipse cx="124" cy="147" rx="9" ry="11" fill="#221710" />
                <circle cx="128" cy="143" r="3" fill="#fff" opacity=".9" />
              </g>
              <path className="alamaar-proc__eyelid" d="M96 143 Q121 119 146 143 Q121 155 96 143Z" fill="#a46d43" />
            </g>

            <g className="alamaar-proc__eye alamaar-proc__eye--right">
              <ellipse cx="181" cy="143" rx="24" ry="29" fill="url(#ap-eye)" stroke="#3d281b" strokeWidth="4" />
              <g className="alamaar-proc__pupil" transform={`translate(${pupilX} ${pupilY})`}>
                <ellipse cx="184" cy="147" rx="9" ry="11" fill="#221710" />
                <circle cx="188" cy="143" r="3" fill="#fff" opacity=".9" />
              </g>
              <path className="alamaar-proc__eyelid" d="M156 143 Q181 119 206 143 Q181 155 156 143Z" fill="#a46d43" />
            </g>

            <ellipse className="alamaar-proc__cheek alamaar-proc__cheek--left" cx="106" cy="180" rx="12" ry="5" fill="#c87968" opacity=".22" />
            <ellipse className="alamaar-proc__cheek alamaar-proc__cheek--right" cx="197" cy="180" rx="12" ry="5" fill="#c87968" opacity=".22" />

            <g className="alamaar-proc__mouth-wrap">
              <path className="alamaar-proc__mouth alamaar-proc__mouth--smile" d="M113 190 Q151 224 191 188 Q185 236 152 237 Q119 235 113 190" fill="#291710" stroke="#40271a" strokeWidth="4" />
              <path className="alamaar-proc__teeth" d="M126 199 Q151 210 178 197" fill="none" stroke="#fff8e9" strokeWidth="8" strokeLinecap="round" />
              <path className="alamaar-proc__tongue" d="M135 224 Q152 211 170 224" fill="none" stroke="#c86865" strokeWidth="7" strokeLinecap="round" />
              <ellipse className="alamaar-proc__mouth alamaar-proc__mouth--talk" cx="152" cy="211" rx="20" ry="26" fill="#291710" stroke="#40271a" strokeWidth="4" />
              <path className="alamaar-proc__talk-teeth" d="M137 199 Q152 205 167 198" fill="none" stroke="#fff8e9" strokeWidth="7" strokeLinecap="round" />
            </g>
          </g>

          <g className="alamaar-proc__glasses">
            <path d="M94 129 C107 120 135 119 145 129 L142 150 C130 160 105 160 96 150Z" fill="url(#ap-glass)" stroke="#21180f" strokeWidth="4" />
            <path d="M157 129 C170 120 198 119 208 129 L205 150 C193 160 168 160 159 150Z" fill="url(#ap-glass)" stroke="#21180f" strokeWidth="4" />
            <path d="M143 133 Q151 128 159 133" fill="none" stroke="#21180f" strokeWidth="6" />
            <path d="M103 128 L133 151" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
            <path d="M166 128 L196 151" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
          </g>

          <g className="alamaar-proc__sparkles">
            <path className="alamaar-proc__spark alamaar-proc__spark--1" d="M246 78 l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#e2bb70" />
            <path className="alamaar-proc__spark alamaar-proc__spark--2" d="M54 92 l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#f0d9a4" />
            <circle className="alamaar-proc__spark alamaar-proc__spark--3" cx="235" cy="132" r="5" fill="#c8933f" />
          </g>
        </g>
      </svg>
    </div>
  );
}
