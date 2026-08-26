import { useEffect, useRef } from 'react';
import { Alignment, Fit, Layout, useRive, useStateMachineInput } from '@rive-app/react-webgl2';
import type { MascotState } from './experience';

const STATE_MACHINE = 'Concierge';

export type RiveMascotCanvasProps = {
  src: string;
  state: MascotState;
  stepIndex: number;
  lookX: number;
  lookY: number;
  talking: boolean;
  engaged: boolean;
  onReady?: () => void;
};

const ENERGY: Record<MascotState, number> = {
  welcome: 78,
  listen: 42,
  think: 28,
  approve: 90,
  cool: 56,
  point: 68,
  present: 76,
  celebrate: 100,
};

const SMILE: Record<MascotState, number> = {
  welcome: 72,
  listen: 38,
  think: 18,
  approve: 92,
  cool: 64,
  point: 58,
  present: 82,
  celebrate: 100,
};

export default function RiveMascotCanvas({
  src,
  state,
  stepIndex,
  lookX,
  lookY,
  talking,
  engaged,
  onReady,
}: RiveMascotCanvasProps) {
  const readyRef = useRef(false);
  const previousState = useRef<MascotState | null>(null);
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
  });

  const inputLookX = useStateMachineInput(rive, STATE_MACHINE, 'lookX', 0);
  const inputLookY = useStateMachineInput(rive, STATE_MACHINE, 'lookY', 0);
  const inputStep = useStateMachineInput(rive, STATE_MACHINE, 'step', 0);
  const inputEngaged = useStateMachineInput(rive, STATE_MACHINE, 'engaged', false);
  const inputTalking = useStateMachineInput(rive, STATE_MACHINE, 'talking', false);
  const inputCoolMode = useStateMachineInput(rive, STATE_MACHINE, 'coolMode', false);
  const inputEnergy = useStateMachineInput(rive, STATE_MACHINE, 'energy', 45);
  const inputSmile = useStateMachineInput(rive, STATE_MACHINE, 'smile', 50);
  const inputTalkLevel = useStateMachineInput(rive, STATE_MACHINE, 'talkLevel', 0);
  const inputAttention = useStateMachineInput(rive, STATE_MACHINE, 'attention', 60);

  const welcome = useStateMachineInput(rive, STATE_MACHINE, 'welcome');
  const listen = useStateMachineInput(rive, STATE_MACHINE, 'listen');
  const think = useStateMachineInput(rive, STATE_MACHINE, 'think');
  const approve = useStateMachineInput(rive, STATE_MACHINE, 'approve');
  const point = useStateMachineInput(rive, STATE_MACHINE, 'point');
  const present = useStateMachineInput(rive, STATE_MACHINE, 'present');
  const celebrate = useStateMachineInput(rive, STATE_MACHINE, 'celebrate');
  const blink = useStateMachineInput(rive, STATE_MACHINE, 'blink');

  useEffect(() => {
    if (!rive || readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  }, [rive, onReady]);

  useEffect(() => {
    if (inputLookX) inputLookX.value = Math.max(-100, Math.min(100, lookX));
    if (inputLookY) inputLookY.value = Math.max(-100, Math.min(100, lookY));
  }, [inputLookX, inputLookY, lookX, lookY]);

  useEffect(() => {
    if (inputStep) inputStep.value = stepIndex;
    if (inputEngaged) inputEngaged.value = engaged;
    if (inputTalking) inputTalking.value = talking;
    if (inputCoolMode) inputCoolMode.value = state === 'cool';
    if (inputEnergy) inputEnergy.value = ENERGY[state];
    if (inputSmile) inputSmile.value = SMILE[state];
    if (inputTalkLevel) inputTalkLevel.value = talking ? Math.max(35, ENERGY[state] - 18) : 0;
    if (inputAttention) inputAttention.value = engaged ? 84 : 38;
  }, [engaged, inputAttention, inputCoolMode, inputEnergy, inputEngaged, inputSmile, inputStep, inputTalkLevel, inputTalking, state, stepIndex, talking]);

  useEffect(() => {
    if (!rive || previousState.current === state) return;
    previousState.current = state;

    if (state === 'welcome') welcome?.fire();
    if (state === 'listen') listen?.fire();
    if (state === 'think' || state === 'cool') think?.fire();
    if (state === 'approve') approve?.fire();
    if (state === 'point') point?.fire();
    if (state === 'present') present?.fire();
    if (state === 'celebrate') celebrate?.fire();
  }, [approve, celebrate, listen, point, present, rive, state, think, welcome]);

  useEffect(() => {
    if (!blink) return;
    let timer = 0;
    let cancelled = false;

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        blink.fire();
        schedule();
      }, 2300 + Math.round(Math.random() * 3300));
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [blink]);

  return <RiveComponent className="alamaar-rive-canvas" aria-hidden="true" />;
}
