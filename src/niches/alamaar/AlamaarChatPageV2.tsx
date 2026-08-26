import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { ALAMAAR_FALLBACK_PRODUCTS, fetchAlamaarProducts, type AlamaarProduct } from './catalog';
import { interpretFreeformLocally, type ConversationTurn } from './chatBridge';
import { buildAlamaarAiRequest, requestAlamaarAiTurn } from './aiClient';
import { advisorMomentForNextStep, buildAlamaarAdvisorRequest, requestAlamaarAdvisorLead } from './advisor';
import { reduceSemanticEvents } from './conversationEngine';
import ConversationEffectRenderer from './ConversationEffectRenderer';
import MascotStage from './MascotStage';
import {
  STEPS,
  choiceValue,
  mascotState,
  rankProducts,
  resultBadges,
  resultReason,
  sceneTone,
  type AnswerKey,
  type Answers,
  type Choice,
  type MascotState,
} from './experience';
import './alamaar-wizard.css';
import './conversation.css';
import './classic-chat.css';
import './classic-chat-v2.css';
import './classic-chat-v3.css';

const SESSION_KEY = 'alamaar-guided-material-session-v8';
type FlowPhase = 'idle' | 'acknowledge' | 'thinking';

type PersistedSession = {
  stepIndex?: number;
  answers?: Answers;
  savedIds?: string[];
  freeformTurns?: ConversationTurn[];
};

type AdvisorLead = {
  stepIndex: number;
  text: string;
};

function restoreSession(): PersistedSession {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as PersistedSession : {};
  } catch {
    return {};
  }
}

function answerLabel(key: AnswerKey, value?: string): string | undefined {
  if (!value) return undefined;
  const step = STEPS.find((item) => item.key === key);
  return step?.choices.find((choice) => choiceValue(choice) === value)?.label;
}

function turnId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function shortLead(stepIndex: number, answers: Answers) {
  if (stepIndex === 0) return 'نبدأ.';
  if (stepIndex === 1) return 'تمام. نحدد الإحساس.';
  if (stepIndex === 2) return 'حلو. نختار الدرجة.';
  if (stepIndex === 3) return answers.tone === 'dark' ? '😎 آخر حاجة.' : 'تمام. آخر حاجة.';
  return 'دي الأقرب ليك.';
}

function StaticAvatar() {
  return <div className="alamaar-chat__avatar alamaar-chat__avatar--ghost alamaar-chat__avatar--quiet" aria-hidden="true"><i /></div>;
}

function LiveMascot({ state, stepIndex, look, riveSrc }: { state: MascotState; stepIndex: number; look: { x: number; y: number }; riveSrc: string | null }) {
  return (
    <div className="alamaar-chat__live-mascot" aria-hidden="true">
      <MascotStage state={state} stepIndex={stepIndex} lookX={look.x} lookY={look.y} talking={false} engaged riveSrc={riveSrc} />
    </div>
  );
}

function HistoryExchange({ step, label, typedText, onEdit }: { step: typeof STEPS[number]; label: string; typedText?: string; onEdit: () => void }) {
  return (
    <div className="alamaar-chat__exchange alamaar-chat__exchange--compact">
      <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--history">
        <StaticAvatar />
        <div className="alamaar-chat__bubble alamaar-chat__bubble--assistant"><strong>{step.title}</strong></div>
      </div>
      <div className="alamaar-chat__row alamaar-chat__row--user">
        <button className="alamaar-chat__bubble alamaar-chat__bubble--user alamaar-chat__bubble--editable" type="button" onClick={onEdit}><span>{typedText ?? label}</span><small>✓</small></button>
      </div>
    </div>
  );
}

function ResultCard({ product, index, answers, saved, compared, onSave, onCompare }: {
  product: AlamaarProduct;
  index: number;
  answers: Answers;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
}) {
  return (
    <article className={`alamaar-result-card ${index === 0 ? 'alamaar-result-card--hero' : ''}`}>
      <div className="alamaar-result-card__image">
        <img src={product.image} alt={`${product.name} ${product.code}`} loading={index === 0 ? 'eager' : 'lazy'} />
        <div className="alamaar-result-card__image-actions">
          <button type="button" onClick={onSave} aria-label={saved ? 'إزالة من المحفوظات' : 'حفظ الخامة'} aria-pressed={saved}>{saved ? '♥' : '♡'}</button>
          <button type="button" onClick={onCompare} aria-label={compared ? 'إزالة من المقارنة' : 'إضافة للمقارنة'} aria-pressed={compared}>{compared ? '✓' : '⇄'}</button>
        </div>
        <span className="alamaar-result-card__rank">{index === 0 ? 'الأقرب ليك' : `بديل ${index}`}</span>
      </div>
      <div className="alamaar-result-card__body">
        <div className="alamaar-result-card__meta"><small>{product.family.toUpperCase()}</small><strong>{product.code}</strong></div>
        <h2>{product.name}</h2>
        <p>{resultReason(product, answers)}</p>
        <div className="alamaar-result-card__badges">{resultBadges(product, answers).map((badge) => <span key={badge}>{badge}</span>)}</div>
        <div className="alamaar-result-card__links"><a href={product.url} target="_blank" rel="noreferrer">افتح الخامة ↗</a><button type="button" onClick={onCompare}>{compared ? 'في المقارنة ✓' : 'قارنها'}</button></div>
      </div>
    </article>
  );
}

export default function AlamaarChatPageV2() {
  const restored = useMemo(restoreSession, []);
  const [stepIndex, setStepIndex] = useState(() => Math.min(restored.stepIndex ?? 0, STEPS.length));
  const [answers, setAnswers] = useState<Answers>(() => restored.answers ?? {});
  const [catalog, setCatalog] = useState<AlamaarProduct[]>(ALAMAAR_FALLBACK_PRODUCTS);
  const [catalogSource, setCatalogSource] = useState<'live' | 'fallback'>('fallback');
  const [savedIds, setSavedIds] = useState<string[]>(() => restored.savedIds ?? []);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [reaction, setReaction] = useState<'idle' | 'approve'>('idle');
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('idle');
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [composer, setComposer] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const [chatStatus, setChatStatus] = useState<'idle' | 'thinking'>('idle');
  const [freeformTurns, setFreeformTurns] = useState<ConversationTurn[]>(() => restored.freeformTurns ?? []);
  const [advisorLead, setAdvisorLead] = useState<AdvisorLead | null>(null);
  const reactionTimer = useRef<number | null>(null);
  const thinkTimer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const aiAbortRef = useRef<AbortController | null>(null);
  const advisorAbortRef = useRef<AbortController | null>(null);
  const riveSrc = useMemo(() => new URLSearchParams(window.location.search).get('rive')?.trim() || null, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlamaarProducts(controller.signal).then(({ products, source }) => { setCatalog(products); setCatalogSource(source); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ stepIndex, answers, savedIds, freeformTurns } satisfies PersistedSession));
  }, [answers, freeformTurns, savedIds, stepIndex]);

  useEffect(() => () => {
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    if (thinkTimer.current) window.clearTimeout(thinkTimer.current);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    aiAbortRef.current?.abort();
    advisorAbortRef.current?.abort();
  }, []);

  const currentStep = STEPS[stepIndex];
  const isResults = stepIndex >= STEPS.length;
  const selectedValue = currentStep ? answers[currentStep.key] : undefined;
  const isGuidedThinking = Boolean(selectedValue) && flowPhase !== 'idle';
  const recommendations = useMemo(() => rankProducts(catalog, answers, 3), [catalog, answers]);
  const baseCharacterState = mascotState(stepIndex, answers, reaction);
  const characterState: MascotState = chatStatus === 'thinking' || flowPhase === 'thinking' ? 'think' : composerFocused ? 'listen' : baseCharacterState;
  const mood = sceneTone(answers);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const canRevealEarly = !isResults && stepIndex >= 1 && answeredCount >= 2;
  const completedSteps = STEPS
    .map((step, index) => ({ step, index, label: answerLabel(step.key, answers[step.key]) }))
    .filter((item) => Boolean(item.label) && (isResults || item.index < stepIndex))
    .slice(-2);
  const currentTurns = freeformTurns.filter((turn) => turn.stepIndex === stepIndex && !turn.resolvedAnswer);
  const latestAssistantTurn = [...currentTurns].reverse().find((turn) => turn.role === 'assistant');
  const hasCurrentInterrupt = currentTurns.some((turn) => turn.role === 'user');
  const engineOwnsReplySurface = Boolean(latestAssistantTurn?.effects?.some((effect) => effect.type === 'guided_candidates'));
  const activeAdvisorLead = advisorLead?.stepIndex === stepIndex ? advisorLead.text : null;
  const comparedProducts = compareIds.map((id) => catalog.find((product) => product.id === id)).filter((product): product is AlamaarProduct => Boolean(product));

  useEffect(() => {
    const id = window.requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' }));
    return () => window.cancelAnimationFrame(id);
  }, [activeAdvisorLead, chatStatus, currentTurns.length, flowPhase, isResults, selectedValue, stepIndex]);

  const clearFlowTimers = () => {
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    if (thinkTimer.current) window.clearTimeout(thinkTimer.current);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    reactionTimer.current = null;
    thinkTimer.current = null;
    advanceTimer.current = null;
  };

  const prepareAdvisorLead = (targetIndex: number, nextAnswers: Answers) => {
    advisorAbortRef.current?.abort();
    advisorAbortRef.current = null;
    setAdvisorLead(null);

    const moment = advisorMomentForNextStep(targetIndex, nextAnswers);
    if (!moment) return;

    const controller = new AbortController();
    advisorAbortRef.current = controller;
    const request = buildAlamaarAdvisorRequest({ moment, answers: nextAnswers, nextStepIndex: targetIndex });
    void requestAlamaarAdvisorLead(request, controller.signal)
      .then((text) => {
        if (!controller.signal.aborted && text) setAdvisorLead({ stepIndex: targetIndex, text });
      })
      .catch(() => undefined)
      .finally(() => {
        if (advisorAbortRef.current === controller) advisorAbortRef.current = null;
      });
  };

  const scheduleGuidedAdvance = (targetIndex: number, nextAnswers?: Answers) => {
    clearFlowTimers();
    if (nextAnswers) prepareAdvisorLead(targetIndex, nextAnswers);
    setFlowPhase('acknowledge');
    setReaction('approve');
    reactionTimer.current = window.setTimeout(() => { setReaction('idle'); reactionTimer.current = null; }, 250);
    thinkTimer.current = window.setTimeout(() => { setFlowPhase('thinking'); thinkTimer.current = null; }, 290);
    advanceTimer.current = window.setTimeout(() => {
      setReaction('idle');
      setFlowPhase('idle');
      setStepIndex(Math.min(targetIndex, STEPS.length));
      advanceTimer.current = null;
    }, 900);
  };

  const applyKnownAnswer = (stepKey: string, value: string) => {
    const targetIndex = STEPS.findIndex((step) => step.key === stepKey);
    const targetStep = STEPS[targetIndex];
    const choice = targetStep?.choices.find((item) => choiceValue(item) === value);
    if (!targetStep || !choice || chatStatus === 'thinking' || flowPhase !== 'idle') return;

    clearFlowTimers();
    const nextAnswers: Answers = { ...answers, [targetStep.key]: value };
    STEPS.slice(targetIndex + 1).forEach((step) => delete nextAnswers[step.key]);
    setAnswers(nextAnswers);
    setStepIndex(targetIndex);
    scheduleGuidedAdvance(targetIndex + 1, nextAnswers);
  };

  const selectChoice = (choice: Choice) => {
    if (!currentStep || selectedValue) return;
    applyKnownAnswer(currentStep.key, choiceValue(choice));
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    aiAbortRef.current?.abort();
    advisorAbortRef.current?.abort();
    setAdvisorLead(null);
    clearFlowTimers();
    setReaction('idle');
    setFlowPhase('idle');
    setChatStatus('idle');
    setAnswers((current) => {
      const next = { ...current };
      STEPS.slice(index).forEach((step) => delete next[step.key]);
      return next;
    });
    setFreeformTurns((current) => current.filter((turn) => turn.stepIndex === undefined || turn.stepIndex < index));
    setStepIndex(index);
  };

  const restart = () => {
    aiAbortRef.current?.abort();
    advisorAbortRef.current?.abort();
    setAdvisorLead(null);
    clearFlowTimers();
    setAnswers({});
    setSavedIds([]);
    setCompareIds([]);
    setFreeformTurns([]);
    setComposer('');
    setReaction('idle');
    setFlowPhase('idle');
    setChatStatus('idle');
    setStepIndex(0);
    window.sessionStorage.removeItem(SESSION_KEY);
  };

  const sendFreeformMessage = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || chatStatus === 'thinking' || flowPhase !== 'idle') return;

    advisorAbortRef.current?.abort();
    setAdvisorLead(null);
    const interpretation = interpretFreeformLocally(trimmed, stepIndex);
    const userTurn: ConversationTurn = {
      id: turnId('user'),
      role: 'user',
      text: trimmed,
      kind: 'freeform',
      createdAt: Date.now(),
      stepIndex,
      resolvedAnswer: interpretation.answer,
    };
    const historyForAi = [...freeformTurns, userTurn];
    setFreeformTurns((current) => [...current, userTurn].slice(-12));
    setComposer('');
    setComposerFocused(false);

    if (interpretation.answer && currentStep) {
      const nextAnswers: Answers = { ...answers, [currentStep.key]: interpretation.answer.value };
      setAnswers(nextAnswers);
      scheduleGuidedAdvance(interpretation.nextStepIndex ?? stepIndex + 1, nextAnswers);
      return;
    }

    setChatStatus('thinking');
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    try {
      const request = buildAlamaarAiRequest({ message: trimmed, stepIndex, answers, history: historyForAi });
      const interpreted = await requestAlamaarAiTurn(request, controller.signal);
      const resolution = reduceSemanticEvents({ response: interpreted, answers, stepIndex, catalog });
      const assistantTurn: ConversationTurn = {
        id: turnId('assistant'),
        role: 'assistant',
        text: interpreted.reply,
        kind: 'ai',
        createdAt: Date.now(),
        stepIndex,
        effects: resolution.effects,
      };

      setFreeformTurns((current) => {
        const marked = resolution.resolvedCurrentAnswer
          ? current.map((turn) => turn.id === userTurn.id ? { ...turn, resolvedAnswer: resolution.resolvedCurrentAnswer } : turn)
          : current;
        return [...marked, assistantTurn].slice(-12);
      });

      if (resolution.didUpdateAnswers) {
        setAnswers(resolution.answers);
        setReaction('approve');
        reactionTimer.current = window.setTimeout(() => setReaction('idle'), 300);
        if (resolution.nextStepIndex !== stepIndex) {
          advanceTimer.current = window.setTimeout(() => {
            setStepIndex(resolution.nextStepIndex);
            setFlowPhase('idle');
            advanceTimer.current = null;
          }, 680);
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        const assistantTurn: ConversationTurn = {
          id: turnId('assistant'),
          role: 'assistant',
          text: 'قولها لي بشكل أقصر شوية.',
          kind: 'system',
          createdAt: Date.now(),
          stepIndex,
        };
        setFreeformTurns((current) => [...current, assistantTurn].slice(-12));
      }
    } finally {
      if (aiAbortRef.current === controller) aiAbortRef.current = null;
      setChatStatus('idle');
    }
  };

  const submitFreeform = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendFreeformMessage(composer);
  };

  const toggleSaved = (id: string) => setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleCompare = (id: string) => setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-2));

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    pointerRef.current = {
      x: ((event.clientX / window.innerWidth) * 2 - 1) * 100,
      y: ((event.clientY / window.innerHeight) * 2 - 1) * 100,
    };
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      setLook(pointerRef.current);
    });
  };

  return (
    <div className="alamaar-demo" dir="rtl" data-scene-tone={mood} onPointerMove={handlePointerMove}>
      <header className="alamaar-demo__header">
        <a className="alamaar-demo__brand" href="https://alamaarhpl.com/" target="_blank" rel="noreferrer"><strong>AL AMAAR</strong><span>DECORATIVE MATERIALS</span></a>
        <nav aria-label="روابط العمار"><a href="https://alamaarhpl.com/" target="_blank" rel="noreferrer">الرئيسية</a><a href="https://alamaarhpl.com/shop/" target="_blank" rel="noreferrer">المنتجات</a><a href="https://alamaarhpl.com/projects/" target="_blank" rel="noreferrer">المشاريع</a></nav>
        <a className="alamaar-demo__header-cta" href="https://wa.me/201008897060" target="_blank" rel="noreferrer">تواصل معنا</a>
      </header>

      <main className="alamaar-demo__stage alamaar-chat-stage">
        <div className="alamaar-demo__background" aria-hidden="true"><div className="alamaar-demo__panel alamaar-demo__panel--one" /><div className="alamaar-demo__panel alamaar-demo__panel--two" /><div className="alamaar-demo__panel alamaar-demo__panel--three" /><div className="alamaar-demo__grain" /></div>
        <div className="alamaar-demo__veil" />

        <section className={`alamaar-chat-shell alamaar-chat-shell--v3 ${isResults ? 'is-results' : ''}`} aria-label="محادثة اختيار الخامات">
          <header className="alamaar-chat__topbar"><span className="alamaar-chat__presence"><i /> AL AMAAR CONCIERGE</span><div className="alamaar-chat__progress" aria-label={`فهمت ${answeredCount} من ${STEPS.length}`}><span>{answeredCount}/{STEPS.length}</span><i><b style={{ width: `${(answeredCount / STEPS.length) * 100}%` }} /></i></div></header>

          <div className="alamaar-chat__thread" ref={threadRef}>
            {completedSteps.map(({ step, index, label }) => {
              const typedAnswer = [...freeformTurns].reverse().find((turn) => turn.role === 'user' && turn.stepIndex === index && turn.resolvedAnswer);
              return <HistoryExchange key={step.key} step={step} label={label!} typedText={typedAnswer?.text} onEdit={() => goToStep(index)} />;
            })}

            {!isResults && currentStep ? (
              <div className={`alamaar-chat__active alamaar-chat__active--v3 ${isGuidedThinking ? 'is-waiting' : ''}`} key={currentStep.key}>
                <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--live">
                  {hasCurrentInterrupt || chatStatus === 'thinking' || isGuidedThinking ? <StaticAvatar /> : <LiveMascot state={characterState} stepIndex={stepIndex} look={look} riveSrc={riveSrc} />}
                  <div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--question">
                    <div className="alamaar-chat__assistant-meta"><span>{activeAdvisorLead ? 'ملاحظة سريعة' : shortLead(stepIndex, answers)}</span><i /></div>
                    {activeAdvisorLead ? <p className="alamaar-chat__advisor-lead" aria-live="polite">{activeAdvisorLead}</p> : null}
                    <h1>{currentStep.title}</h1>
                  </div>
                </div>

                {currentTurns.map((turn) => {
                  const isLatestAssistant = turn.role === 'assistant' && turn.id === latestAssistantTurn?.id && chatStatus !== 'thinking';
                  return (
                    <div className="alamaar-chat__turn-stack" key={turn.id}>
                      <div className={`alamaar-chat__row alamaar-chat__row--${turn.role} ${isLatestAssistant ? 'alamaar-chat__row--ai-active' : ''}`}>
                        {turn.role === 'assistant' ? (isLatestAssistant ? <LiveMascot state={characterState} stepIndex={stepIndex} look={look} riveSrc={riveSrc} /> : <StaticAvatar />) : null}
                        <div className={`alamaar-chat__bubble alamaar-chat__bubble--${turn.role}`}><span>{turn.text}</span></div>
                      </div>
                      {isLatestAssistant && turn.effects?.length ? (
                        <div className="alamaar-chat__ai-surface">
                          <ConversationEffectRenderer effects={turn.effects} catalog={catalog} answers={answers} onKnownAnswer={applyKnownAnswer} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {chatStatus === 'thinking' ? <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--thinking"><LiveMascot state="think" stepIndex={stepIndex} look={look} riveSrc={riveSrc} /><div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--typing" aria-label="المساعد يفكر"><i /><i /><i /></div></div> : null}

                {selectedValue ? <><div className="alamaar-chat__row alamaar-chat__row--user alamaar-chat__row--pending"><div className="alamaar-chat__bubble alamaar-chat__bubble--user"><span>{answerLabel(currentStep.key, selectedValue)}</span><small>✓</small></div></div><div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--guided-thinking"><LiveMascot state={characterState} stepIndex={stepIndex} look={look} riveSrc={riveSrc} /><div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--typing" aria-label="المساعد يفكر"><i /><i /><i /></div></div></> : null}

                {!selectedValue && chatStatus === 'idle' && !engineOwnsReplySurface ? (
                  <div className="alamaar-chat__reply-zone alamaar-chat__reply-zone--resume">
                    <div className={`alamaar-chat__quick-replies replies-${currentStep.choices.length}`}>
                      {currentStep.choices.map((choice) => <button key={choice.value} type="button" onClick={() => selectChoice(choice)} onFocus={() => setLook({ x: -62, y: 12 })} data-choice-tone={choice.tone ?? ''}><span className="alamaar-chat__quick-icon">{choice.icon}</span><strong>{choice.label}</strong></button>)}
                    </div>
                    <div className="alamaar-chat__reply-actions"><button type="button" onClick={() => stepIndex > 0 && goToStep(stepIndex - 1)} disabled={stepIndex === 0}>رجوع</button>{canRevealEarly ? <button type="button" onClick={() => { advisorAbortRef.current?.abort(); setAdvisorLead(null); clearFlowTimers(); setStepIndex(STEPS.length); }}>ورّيني ترشيحات</button> : null}</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="alamaar-chat__results-block">
                <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--live alamaar-chat__row--results"><LiveMascot state={characterState} stepIndex={stepIndex} look={look} riveSrc={riveSrc} /><div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--question"><div className="alamaar-chat__assistant-meta"><span>وصلنا</span><i /></div><h1>دي أقرب 3 خامات ليك</h1></div></div>
                <div className="alamaar-results alamaar-conversation__results">
                  <div className="alamaar-results__grid">{recommendations.map((product, index) => <ResultCard key={product.id} product={product} index={index} answers={answers} saved={savedIds.includes(product.id)} compared={compareIds.includes(product.id)} onSave={() => toggleSaved(product.id)} onCompare={() => toggleCompare(product.id)} />)}</div>
                  {comparedProducts.length === 2 ? <div className="alamaar-chat__compare-note">جاهزين للمقارنة: {comparedProducts.map((product) => product.code).join(' × ')}</div> : null}
                  <div className="alamaar-results__actions"><a className="alamaar-button alamaar-button--primary" href="https://alamaarhpl.com/contact/" target="_blank" rel="noreferrer">اطلب عينة</a><a className="alamaar-button alamaar-button--secondary" href="https://wa.me/201008897060" target="_blank" rel="noreferrer">واتساب</a><button type="button" className="alamaar-button alamaar-button--ghost" onClick={() => goToStep(Math.max(0, STEPS.length - 1))}>عدّل</button><button type="button" className="alamaar-text-action" onClick={restart}>ابدأ من جديد</button></div>
                </div>

                {currentTurns.map((turn) => {
                  const isLatestAssistant = turn.role === 'assistant' && turn.id === latestAssistantTurn?.id && chatStatus !== 'thinking';
                  return (
                    <div className="alamaar-chat__turn-stack" key={turn.id}>
                      <div className={`alamaar-chat__row alamaar-chat__row--${turn.role}`}>
                        {turn.role === 'assistant' ? (isLatestAssistant ? <LiveMascot state={characterState} stepIndex={stepIndex} look={look} riveSrc={riveSrc} /> : <StaticAvatar />) : null}
                        <div className={`alamaar-chat__bubble alamaar-chat__bubble--${turn.role}`}><span>{turn.text}</span></div>
                      </div>
                      {isLatestAssistant && turn.effects?.length ? <ConversationEffectRenderer effects={turn.effects} catalog={catalog} answers={answers} onKnownAnswer={applyKnownAnswer} /> : null}
                    </div>
                  );
                })}
                {chatStatus === 'thinking' ? <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--thinking"><LiveMascot state="think" stepIndex={stepIndex} look={look} riveSrc={riveSrc} /><div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--typing"><i /><i /><i /></div></div> : null}
              </div>
            )}
          </div>

          <form className={`alamaar-chat__composer ${composerFocused ? 'is-focused' : ''}`} onSubmit={submitFreeform}>
            <div className="alamaar-chat__composer-inner">
              <textarea value={composer} onChange={(event) => setComposer(event.target.value)} onFocus={() => { setComposerFocused(true); setLook({ x: -45, y: 45 }); }} onBlur={() => setComposerFocused(false)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="اكتب إجابة مختلفة أو اسأل سؤال…" rows={1} aria-label="اكتب إجابة أو سؤال مختلف" />
              <button type="submit" disabled={!composer.trim() || chatStatus === 'thinking' || flowPhase !== 'idle'} aria-label="إرسال">↑</button>
            </div>
          </form>
        </section>

        <div className="alamaar-demo__source" aria-hidden="true"><span className={catalogSource === 'live' ? 'is-live' : ''} />{catalogSource === 'live' ? 'catalog live' : 'catalog fallback'}</div>
      </main>
    </div>
  );
}
