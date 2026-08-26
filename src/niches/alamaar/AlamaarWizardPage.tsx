import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { ALAMAAR_FALLBACK_PRODUCTS, fetchAlamaarProducts, type AlamaarProduct } from './catalog';
import { interpretFreeformLocally, type ConversationTurn } from './chatBridge';
import MascotStage from './MascotStage';
import {
  STEPS,
  choiceValue,
  guideMessage,
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

const SESSION_KEY = 'alamaar-guided-material-session-v4';

type PersistedSession = {
  stepIndex?: number;
  answers?: Answers;
  savedIds?: string[];
  freeformTurns?: ConversationTurn[];
};

function restoreSession(): PersistedSession {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedSession;
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

function ResultCard({
  product,
  index,
  answers,
  saved,
  compared,
  onSave,
  onCompare,
}: {
  product: AlamaarProduct;
  index: number;
  answers: Answers;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
}) {
  const badges = resultBadges(product, answers);

  return (
    <article className={`alamaar-result-card ${index === 0 ? 'alamaar-result-card--hero' : ''}`}>
      <div className="alamaar-result-card__image">
        <img src={product.image} alt={`${product.name} ${product.code}`} loading={index === 0 ? 'eager' : 'lazy'} />
        <div className="alamaar-result-card__image-actions">
          <button type="button" onClick={onSave} aria-label={saved ? 'إزالة من المحفوظات' : 'حفظ الخامة'} aria-pressed={saved}>
            {saved ? '♥' : '♡'}
          </button>
          <button type="button" onClick={onCompare} aria-label={compared ? 'إزالة من المقارنة' : 'إضافة للمقارنة'} aria-pressed={compared}>
            {compared ? '✓' : '⇄'}
          </button>
        </div>
        {index === 0 ? <span className="alamaar-result-card__rank">الأقرب لاختياراتك</span> : <span className="alamaar-result-card__rank">بديل {index}</span>}
      </div>

      <div className="alamaar-result-card__body">
        <div className="alamaar-result-card__meta">
          <small>{product.family.toUpperCase()}</small>
          <strong>{product.code}</strong>
        </div>
        <h2>{product.name}</h2>
        <p>{resultReason(product, answers)}</p>
        <div className="alamaar-result-card__badges">
          {badges.map((badge) => <span key={badge}>{badge}</span>)}
        </div>
        <div className="alamaar-result-card__links">
          <a href={product.url} target="_blank" rel="noreferrer">افتح الخامة ↗</a>
          <button type="button" onClick={onCompare}>{compared ? 'في المقارنة ✓' : 'قارنها'}</button>
        </div>
      </div>
    </article>
  );
}

function ComparePanel({ products, onClear }: { products: AlamaarProduct[]; onClear: () => void }) {
  if (products.length < 2) return null;

  return (
    <section className="alamaar-compare-panel" aria-label="مقارنة بصرية سريعة">
      <div className="alamaar-compare-panel__heading">
        <div>
          <span>مقارنة بصرية</span>
          <h2>شوف الفرق قبل ما تخرج من التجربة</h2>
        </div>
        <button type="button" onClick={onClear}>مسح المقارنة</button>
      </div>
      <div className="alamaar-compare-panel__grid">
        {products.map((product) => (
          <article key={product.id}>
            <img src={product.image} alt="" />
            <div>
              <strong>{product.name}</strong>
              <span>{product.code}</span>
              <dl>
                <div><dt>العائلة</dt><dd>{product.family}</dd></div>
                <div><dt>الاتجاه اللوني</dt><dd>{product.tone}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>
      <p>المقارنة هنا بصرية فقط. راجع المواصفات الفنية الفعلية من صفحة كل منتج أو مع فريق العمار قبل الاختيار النهائي.</p>
    </section>
  );
}

function AssistantHistoryBubble({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--history">
      <div className="alamaar-chat__avatar alamaar-chat__avatar--ghost" aria-hidden="true">A</div>
      <div className="alamaar-chat__bubble alamaar-chat__bubble--assistant">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

export default function AlamaarWizardPage() {
  const restored = useMemo(restoreSession, []);
  const [stepIndex, setStepIndex] = useState(() => Math.min(restored.stepIndex ?? 0, STEPS.length));
  const [answers, setAnswers] = useState<Answers>(() => restored.answers ?? {});
  const [catalog, setCatalog] = useState<AlamaarProduct[]>(ALAMAAR_FALLBACK_PRODUCTS);
  const [catalogSource, setCatalogSource] = useState<'live' | 'fallback'>('fallback');
  const [savedIds, setSavedIds] = useState<string[]>(() => restored.savedIds ?? []);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [reaction, setReaction] = useState<'idle' | 'approve'>('idle');
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [composer, setComposer] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const [chatStatus, setChatStatus] = useState<'idle' | 'thinking'>('idle');
  const [freeformTurns, setFreeformTurns] = useState<ConversationTurn[]>(() => restored.freeformTurns ?? []);
  const reactionTimer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const freeformTimer = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const riveSrc = useMemo(() => {
    const query = new URLSearchParams(window.location.search).get('rive');
    return query?.trim() || null;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlamaarProducts(controller.signal).then(({ products, source }) => {
      setCatalog(products);
      setCatalogSource(source);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ stepIndex, answers, savedIds, freeformTurns } satisfies PersistedSession),
    );
  }, [answers, freeformTurns, savedIds, stepIndex]);

  useEffect(() => () => {
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    if (freeformTimer.current) window.clearTimeout(freeformTimer.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const currentStep = STEPS[stepIndex];
  const isResults = stepIndex >= STEPS.length;
  const selectedValue = currentStep ? answers[currentStep.key] : undefined;
  const recommendations = useMemo(() => rankProducts(catalog, answers, 3), [catalog, answers]);
  const topProduct = recommendations[0];
  const guide = guideMessage(stepIndex, answers, topProduct);
  const baseCharacterState = mascotState(stepIndex, answers, reaction);
  const characterState: MascotState = chatStatus === 'thinking' ? 'think' : composerFocused ? 'listen' : baseCharacterState;
  const mood = sceneTone(answers);
  const comparedProducts = compareIds
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is AlamaarProduct => Boolean(product));
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const canRevealEarly = !isResults && stepIndex >= 1 && answeredCount >= 2;

  const completedSteps = STEPS
    .map((step, index) => ({ step, index, label: answerLabel(step.key, answers[step.key]) }))
    .filter((item) => Boolean(item.label) && (isResults || item.index < stepIndex));

  const unresolvedFreeformTurns = freeformTurns.filter((turn) => !turn.resolvedAnswer);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (!threadRef.current) return;
      threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [chatStatus, freeformTurns.length, isResults, selectedValue, stepIndex]);

  const clearAdvance = () => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const triggerApprove = () => {
    setReaction('approve');
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction('idle'), 520);
  };

  const scheduleAdvance = (targetIndex: number) => {
    clearAdvance();
    advanceTimer.current = window.setTimeout(() => {
      setReaction('idle');
      setStepIndex(Math.min(targetIndex, STEPS.length));
      advanceTimer.current = null;
    }, 680);
  };

  const selectChoice = (choice: Choice) => {
    if (!currentStep || selectedValue) return;
    const value = choiceValue(choice);
    setAnswers((current) => ({ ...current, [currentStep.key]: value }));
    triggerApprove();
    scheduleAdvance(stepIndex + 1);
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    clearAdvance();
    setReaction('idle');
    setStepIndex(index);
  };

  const back = () => {
    clearAdvance();
    setReaction('idle');
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const revealEarly = () => {
    clearAdvance();
    setReaction('idle');
    setStepIndex(STEPS.length);
  };

  const restart = () => {
    clearAdvance();
    setAnswers({});
    setSavedIds([]);
    setCompareIds([]);
    setFreeformTurns([]);
    setComposer('');
    setReaction('idle');
    setChatStatus('idle');
    setStepIndex(0);
    window.sessionStorage.removeItem(SESSION_KEY);
  };

  const toggleSaved = (id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id].slice(-2);
    });
  };

  const submitFreeform = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = composer.trim();
    if (!message || chatStatus === 'thinking') return;

    const interpretation = interpretFreeformLocally(message, stepIndex);
    const userTurn: ConversationTurn = {
      id: turnId('user'),
      role: 'user',
      text: message,
      kind: 'freeform',
      createdAt: Date.now(),
      stepIndex,
      resolvedAnswer: interpretation.answer,
    };

    setFreeformTurns((current) => [...current, userTurn].slice(-12));
    setComposer('');
    setComposerFocused(false);
    setChatStatus('thinking');

    if (freeformTimer.current) window.clearTimeout(freeformTimer.current);
    freeformTimer.current = window.setTimeout(() => {
      setChatStatus('idle');

      if (interpretation.answer && currentStep) {
        const matchedChoice = currentStep.choices.find(
          (choice) => choiceValue(choice) === interpretation.answer?.value,
        );
        if (matchedChoice) {
          setAnswers((current) => ({ ...current, [currentStep.key]: choiceValue(matchedChoice) }));
          triggerApprove();
          scheduleAdvance(interpretation.nextStepIndex ?? stepIndex + 1);
        }
      } else {
        const assistantTurn: ConversationTurn = {
          id: turnId('assistant'),
          role: 'assistant',
          text: interpretation.assistantText,
          kind: 'system',
          createdAt: Date.now(),
          stepIndex,
        };
        setFreeformTurns((current) => [...current, assistantTurn].slice(-12));
      }

      freeformTimer.current = null;
    }, interpretation.requiresAi ? 760 : 360);
  };

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
        <a className="alamaar-demo__brand" href="https://alamaarhpl.com/" target="_blank" rel="noreferrer">
          <strong>AL AMAAR</strong>
          <span>DECORATIVE MATERIALS</span>
        </a>
        <nav aria-label="روابط العمار">
          <a href="https://alamaarhpl.com/" target="_blank" rel="noreferrer">الرئيسية</a>
          <a href="https://alamaarhpl.com/shop/" target="_blank" rel="noreferrer">المنتجات</a>
          <a href="https://alamaarhpl.com/projects/" target="_blank" rel="noreferrer">المشاريع</a>
        </nav>
        <a className="alamaar-demo__header-cta" href="https://wa.me/201008897060" target="_blank" rel="noreferrer">تواصل معنا</a>
      </header>

      <main className="alamaar-demo__stage alamaar-chat-stage">
        <div className="alamaar-demo__background" aria-hidden="true">
          <div className="alamaar-demo__panel alamaar-demo__panel--one" style={{ transform: `translate3d(${look.x * -0.025}px, ${look.y * -0.012}px, 0) rotate(-6deg)` }} />
          <div className="alamaar-demo__panel alamaar-demo__panel--two" style={{ transform: `translate3d(${look.x * 0.018}px, ${look.y * -0.009}px, 0) rotate(2deg)` }} />
          <div className="alamaar-demo__panel alamaar-demo__panel--three" style={{ transform: `translate3d(${look.x * 0.03}px, ${look.y * 0.011}px, 0) rotate(7deg)` }} />
          <div className="alamaar-demo__grain" />
          <div className="alamaar-demo__hero-copy">
            <span>HPL</span>
            <strong>اختيار خامة كأنه شات، بس أسرع وأوضح.</strong>
          </div>
        </div>
        <div className="alamaar-demo__veil" />

        <section className={`alamaar-chat-shell ${isResults ? 'is-results' : ''}`} aria-label="محادثة اختيار الخامات">
          <header className="alamaar-chat__topbar">
            <div>
              <span className="alamaar-chat__presence"><i /> MATERIAL CONCIERGE</span>
              <strong>{chatStatus === 'thinking' ? 'بفهم الرسالة…' : 'رد باختيار، أو اكتب بطريقتك.'}</strong>
            </div>
            <div className="alamaar-chat__progress" aria-label={`فهمت ${answeredCount} من ${STEPS.length}`}>
              <span>{answeredCount}/{STEPS.length}</span>
              <i><b style={{ width: `${(answeredCount / STEPS.length) * 100}%` }} /></i>
            </div>
          </header>

          <div className="alamaar-chat__thread" ref={threadRef}>
            <div className="alamaar-chat__intro">
              <span>ابدأ باختيار سريع، ولو إجابتك مختلفة اكتبها تحت.</span>
            </div>

            {completedSteps.map(({ step, index, label }) => {
              const typedAnswer = freeformTurns
                .filter((turn) => turn.role === 'user' && turn.stepIndex === index && turn.resolvedAnswer)
                .at(-1);
              return (
                <div className="alamaar-chat__exchange" key={step.key}>
                  <AssistantHistoryBubble title={step.title} subtitle={step.subtitle} />
                  <div className="alamaar-chat__row alamaar-chat__row--user">
                    <button className="alamaar-chat__bubble alamaar-chat__bubble--user alamaar-chat__bubble--editable" type="button" onClick={() => goToStep(index)}>
                      <span>{typedAnswer?.text ?? label}</span>
                      <small>{typedAnswer ? `فهمتها: ${label}` : 'تعديل الاختيار'} · ✓</small>
                    </button>
                  </div>
                </div>
              );
            })}

            {unresolvedFreeformTurns.slice(-6).map((turn) => (
              <div className={`alamaar-chat__row alamaar-chat__row--${turn.role}`} key={turn.id}>
                {turn.role === 'assistant' ? <div className="alamaar-chat__avatar alamaar-chat__avatar--ghost" aria-hidden="true">A</div> : null}
                <div className={`alamaar-chat__bubble alamaar-chat__bubble--${turn.role}`}>
                  <span>{turn.text}</span>
                </div>
              </div>
            ))}

            {chatStatus === 'thinking' ? (
              <div className="alamaar-chat__row alamaar-chat__row--assistant">
                <div className="alamaar-chat__avatar alamaar-chat__avatar--ghost" aria-hidden="true">A</div>
                <div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--typing" aria-label="المساعد يفكر">
                  <i /><i /><i />
                </div>
              </div>
            ) : null}

            {!isResults && currentStep ? (
              <div className="alamaar-chat__active" key={currentStep.key}>
                <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--live">
                  <div className="alamaar-chat__live-mascot" aria-hidden="true">
                    <MascotStage
                      state={characterState}
                      stepIndex={stepIndex}
                      lookX={look.x}
                      lookY={look.y}
                      talking={false}
                      engaged
                      riveSrc={riveSrc}
                    />
                  </div>
                  <div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--question">
                    <div className="alamaar-chat__assistant-meta"><span>{guide.eyebrow}</span><i /></div>
                    <p>{guide.text}</p>
                    <h1>{currentStep.title}</h1>
                    <span>{currentStep.subtitle}</span>
                    {guide.emphasis ? <small>{guide.emphasis}</small> : null}
                  </div>
                </div>

                {selectedValue ? (
                  <div className="alamaar-chat__row alamaar-chat__row--user alamaar-chat__row--pending">
                    <div className="alamaar-chat__bubble alamaar-chat__bubble--user">
                      <span>{answerLabel(currentStep.key, selectedValue)}</span>
                      <small>تم الاختيار · ✓</small>
                    </div>
                  </div>
                ) : (
                  <div className="alamaar-chat__reply-zone">
                    <span className="alamaar-chat__reply-label">اختار ردك</span>
                    <div className={`alamaar-chat__quick-replies replies-${currentStep.choices.length}`}>
                      {currentStep.choices.map((choice) => (
                        <button
                          key={choice.value}
                          type="button"
                          onClick={() => selectChoice(choice)}
                          onFocus={() => setLook({ x: -62, y: 12 })}
                          data-choice-tone={choice.tone ?? ''}
                        >
                          <span className="alamaar-chat__quick-icon">{choice.icon}</span>
                          <span><strong>{choice.label}</strong><small>{choice.hint}</small></span>
                        </button>
                      ))}
                    </div>
                    <div className="alamaar-chat__reply-actions">
                      <button type="button" onClick={back} disabled={stepIndex === 0}>رجوع</button>
                      {canRevealEarly ? <button type="button" onClick={revealEarly}>ورّيني الترشيحات دلوقتي</button> : <span>أو اكتب إجابة مختلفة تحت</span>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="alamaar-chat__results-block" key="results">
                <div className="alamaar-chat__row alamaar-chat__row--assistant alamaar-chat__row--live alamaar-chat__row--results">
                  <div className="alamaar-chat__live-mascot" aria-hidden="true">
                    <MascotStage
                      state={characterState}
                      stepIndex={stepIndex}
                      lookX={look.x}
                      lookY={look.y}
                      talking={false}
                      engaged
                      riveSrc={riveSrc}
                    />
                  </div>
                  <div className="alamaar-chat__bubble alamaar-chat__bubble--assistant alamaar-chat__bubble--question">
                    <div className="alamaar-chat__assistant-meta"><span>{guide.eyebrow}</span><i /></div>
                    <p>{guide.text}</p>
                    <h1>وصلنا لثلاث خامات تستحق تبدأ منها</h1>
                    <span>الترتيب بصري، والمواصفات الفنية لازم تتراجع من المصدر قبل الاعتماد.</span>
                  </div>
                </div>

                <div className="alamaar-results alamaar-conversation__results">
                  <div className="alamaar-results__summary" aria-label="ملخص اختياراتك">
                    {STEPS.map((step) => {
                      const label = answerLabel(step.key, answers[step.key]);
                      return label ? <button type="button" key={step.key} onClick={() => goToStep(STEPS.indexOf(step))}><small>{step.eyebrow}</small>{label}</button> : null;
                    })}
                  </div>

                  <div className="alamaar-results__grid">
                    {recommendations.map((product, index) => (
                      <ResultCard
                        key={product.id}
                        product={product}
                        index={index}
                        answers={answers}
                        saved={savedIds.includes(product.id)}
                        compared={compareIds.includes(product.id)}
                        onSave={() => toggleSaved(product.id)}
                        onCompare={() => toggleCompare(product.id)}
                      />
                    ))}
                  </div>

                  <ComparePanel products={comparedProducts} onClear={() => setCompareIds([])} />

                  <div className="alamaar-results__actions">
                    <a className="alamaar-button alamaar-button--primary" href="https://alamaarhpl.com/contact/" target="_blank" rel="noreferrer">اطلب عينة</a>
                    <a className="alamaar-button alamaar-button--secondary" href="https://wa.me/201008897060" target="_blank" rel="noreferrer">اسأل مهندس على واتساب</a>
                    <button type="button" className="alamaar-button alamaar-button--ghost" onClick={() => goToStep(Math.max(0, STEPS.length - 1))}>عدّل آخر اختيار</button>
                    <button type="button" className="alamaar-text-action" onClick={restart}>ابدأ من جديد</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form className={`alamaar-chat__composer ${composerFocused ? 'is-focused' : ''}`} onSubmit={submitFreeform}>
            <div className="alamaar-chat__composer-inner">
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                onFocus={() => {
                  setComposerFocused(true);
                  setLook({ x: -45, y: 45 });
                }}
                onBlur={() => setComposerFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={isResults ? 'اسأل عن خامة أو اكتب احتياج مختلف…' : 'اكتب إجابة مختلفة أو اسألني أي سؤال…'}
                rows={1}
                aria-label="اكتب إجابة أو سؤال مختلف"
              />
              <button type="submit" disabled={!composer.trim() || chatStatus === 'thinking'} aria-label="إرسال">↑</button>
            </div>
            <div className="alamaar-chat__composer-meta">
              <span><i /> الاختيارات الجاهزة تكمل فورًا · الكتابة الحرة جاهزة للـ AI</span>
              <b>{chatStatus === 'thinking' ? 'READING' : 'HYBRID CHAT'}</b>
            </div>
          </form>
        </section>

        <div className="alamaar-demo__source" title="النسخة تحاول استخدام WooCommerce Store API العام أولاً ثم تستخدم fallback عام عند الحاجة.">
          <span className={catalogSource === 'live' ? 'is-live' : ''} />
          {catalogSource === 'live' ? 'الكتالوج العام متصل' : 'وضع fallback للكتالوج العام'}
          {riveSrc ? <b>· Rive source connected</b> : <b>· chat motion rig</b>}
        </div>
      </main>
    </div>
  );
}
