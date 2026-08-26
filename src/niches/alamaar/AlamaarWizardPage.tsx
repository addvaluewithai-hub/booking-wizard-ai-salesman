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

const SESSION_KEY = 'alamaar-guided-material-session-v3';

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
  const completedTurns = STEPS
    .map((step, index) => ({ step, index, label: answerLabel(step.key, answers[step.key]) }))
    .filter((item) => Boolean(item.label) && (isResults || item.index < stepIndex));

  const clearAdvance = () => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const triggerApprove = () => {
    setReaction('approve');
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction('idle'), 560);
  };

  const scheduleAdvance = (targetIndex: number) => {
    clearAdvance();
    advanceTimer.current = window.setTimeout(() => {
      setReaction('idle');
      setStepIndex(Math.min(targetIndex, STEPS.length));
      advanceTimer.current = null;
    }, 640);
  };

  const selectChoice = (choice: Choice) => {
    if (!currentStep) return;
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
    };

    setFreeformTurns((current) => [...current, userTurn].slice(-8));
    setComposer('');
    setComposerFocused(false);
    setChatStatus('thinking');

    if (freeformTimer.current) window.clearTimeout(freeformTimer.current);
    freeformTimer.current = window.setTimeout(() => {
      const assistantTurn: ConversationTurn = {
        id: turnId('assistant'),
        role: 'assistant',
        text: interpretation.assistantText,
        kind: 'system',
        createdAt: Date.now(),
      };
      setFreeformTurns((current) => [...current, assistantTurn].slice(-8));
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
      }
      freeformTimer.current = null;
    }, interpretation.requiresAi ? 760 : 420);
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

      <main className="alamaar-demo__stage">
        <div className="alamaar-demo__background" aria-hidden="true">
          <div className="alamaar-demo__panel alamaar-demo__panel--one" style={{ transform: `translate3d(${look.x * -0.025}px, ${look.y * -0.012}px, 0) rotate(-6deg)` }} />
          <div className="alamaar-demo__panel alamaar-demo__panel--two" style={{ transform: `translate3d(${look.x * 0.018}px, ${look.y * -0.009}px, 0) rotate(2deg)` }} />
          <div className="alamaar-demo__panel alamaar-demo__panel--three" style={{ transform: `translate3d(${look.x * 0.03}px, ${look.y * 0.011}px, 0) rotate(7deg)` }} />
          <div className="alamaar-demo__grain" />
          <div className="alamaar-demo__hero-copy">
            <span>HPL</span>
            <strong>اختيار خامة كأنه حوار، مش فورم.</strong>
          </div>
        </div>
        <div className="alamaar-demo__veil" />

        <section className={`alamaar-conversation-shell ${isResults ? 'is-results' : ''}`} aria-live="polite">
          <div className="alamaar-conversation__mascot-seat" aria-label="مساعد اختيار الخامات">
            <MascotStage
              state={characterState}
              stepIndex={stepIndex}
              lookX={look.x}
              lookY={look.y}
              talking={false}
              engaged
              seated
              riveSrc={riveSrc}
            />
          </div>

          <div className="alamaar-conversation-card">
            <header className="alamaar-conversation__header">
              <div>
                <span className="alamaar-conversation__presence"><i /> MATERIAL CONCIERGE</span>
                <strong>{chatStatus === 'thinking' ? 'بفهم اللي كتبته…' : 'اختار بسرعة، أو اكتب بطريقتك.'}</strong>
              </div>
              <div className="alamaar-conversation__understanding">
                <span>فهمت {answeredCount} من {STEPS.length}</span>
                <i><b style={{ width: `${(answeredCount / STEPS.length) * 100}%` }} /></i>
              </div>
            </header>

            {completedTurns.length ? (
              <div className="alamaar-conversation__memory" aria-label="ملخص الحوار">
                {completedTurns.slice(-4).map(({ step, index, label }, visibleIndex, visible) => (
                  <div className={visibleIndex < visible.length - 2 ? 'is-faded' : ''} key={step.key}>
                    <span>{step.title}</span>
                    <button type="button" onClick={() => goToStep(index)}>{label} <b>✓</b></button>
                  </div>
                ))}
              </div>
            ) : null}

            {freeformTurns.length ? (
              <div className="alamaar-conversation__freeform-log" aria-label="الرسائل الحرة الأخيرة">
                {freeformTurns.slice(-4).map((turn) => (
                  <div key={turn.id} className={`is-${turn.role}`}>
                    <span>{turn.role === 'user' ? 'أنت' : 'المساعد'}</span>
                    <p>{turn.text}</p>
                  </div>
                ))}
                {chatStatus === 'thinking' ? (
                  <div className="is-assistant is-thinking"><span>المساعد</span><p><i /><i /><i /></p></div>
                ) : null}
              </div>
            ) : null}

            {!isResults && currentStep ? (
              <div className="alamaar-conversation__active-turn" key={currentStep.key}>
                <div className="alamaar-conversation__assistant-turn">
                  <div className="alamaar-conversation__assistant-meta">
                    <span>{guide.eyebrow}</span>
                    <i aria-hidden="true" />
                  </div>
                  <p>{guide.text}</p>
                  {guide.emphasis ? <small>{guide.emphasis}</small> : null}
                </div>

                <div className="alamaar-conversation__question">
                  <span>{currentStep.eyebrow}</span>
                  <h1>{currentStep.title}</h1>
                  <p>{currentStep.subtitle}</p>
                </div>

                <div className={`alamaar-conversation__choices choices-${currentStep.choices.length}`}>
                  {currentStep.choices.map((choice) => {
                    const value = choiceValue(choice);
                    const selected = selectedValue === value;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        className={selected ? 'is-selected' : ''}
                        onClick={() => selectChoice(choice)}
                        aria-pressed={selected}
                        data-choice-tone={choice.tone ?? ''}
                      >
                        <span className="alamaar-conversation__choice-icon">{choice.icon}</span>
                        <span><strong>{choice.label}</strong><small>{choice.hint}</small></span>
                        <b>{selected ? '✓' : '›'}</b>
                      </button>
                    );
                  })}
                </div>

                <div className="alamaar-conversation__turn-footer">
                  <button type="button" onClick={back} disabled={stepIndex === 0}>رجوع</button>
                  <span>{selectedValue ? 'تمام — مكمل لوحدي…' : 'اختيار واحد يكفّي عشان نكمل.'}</span>
                  {canRevealEarly ? <button type="button" onClick={revealEarly}>ورّيني ترشيحات دلوقتي</button> : <i />}
                </div>
              </div>
            ) : (
              <div className="alamaar-results alamaar-conversation__results" key="results">
                <div className="alamaar-results__intro">
                  <div className="alamaar-wizard__heading">
                    <span>CURATED SHORTLIST</span>
                    <h1>وصلنا لثلاث خامات تستحق تبدأ منها</h1>
                    <p>الترتيب مبني على اختياراتك البصرية والبيانات العامة المتاحة. المواصفات الفنية والملاءمة النهائية لازم تتراجع من المصدر.</p>
                  </div>
                  <div className="alamaar-results__summary" aria-label="ملخص اختياراتك">
                    {STEPS.map((step) => {
                      const label = answerLabel(step.key, answers[step.key]);
                      return label ? <span key={step.key}><small>{step.eyebrow}</small>{label}</span> : null;
                    })}
                  </div>
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
                  <button type="button" className="alamaar-button alamaar-button--ghost" onClick={() => goToStep(Math.max(0, STEPS.length - 1))}>عدّل الاختيارات</button>
                  <button type="button" className="alamaar-text-action" onClick={restart}>ابدأ من جديد</button>
                </div>
              </div>
            )}

            <form className={`alamaar-conversation__composer ${composerFocused ? 'is-focused' : ''}`} onSubmit={submitFreeform}>
              <div className="alamaar-conversation__composer-copy">
                <span>مش لاقي إجابتك؟</span>
                <small>اكتب إجابة مختلفة أو اسأل أي سؤال — الـ AI bridge جاهز للربط.</small>
              </div>
              <div className="alamaar-conversation__composer-input">
                <textarea
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  onFocus={() => setComposerFocused(true)}
                  onBlur={() => setComposerFocused(false)}
                  placeholder={isResults ? 'اسأل عن خامة أو اكتب احتياج مختلف…' : 'مثلاً: أنا بعمل ريسبشن عيادة… أو عندي سؤال مختلف'}
                  rows={1}
                  aria-label="اكتب إجابة أو سؤال مختلف"
                />
                <button type="submit" disabled={!composer.trim() || chatStatus === 'thinking'} aria-label="إرسال">↑</button>
              </div>
              <div className="alamaar-conversation__composer-status">
                <span><i /> الكتابة الحرة لا تغيّر المسار إلا لو فهمناها بثقة</span>
                <b>{chatStatus === 'thinking' ? 'READING' : 'HYBRID FLOW'}</b>
              </div>
            </form>
          </div>
        </section>

        <div className="alamaar-demo__source" title="النسخة تحاول استخدام WooCommerce Store API العام أولاً ثم تستخدم fallback عام عند الحاجة.">
          <span className={catalogSource === 'live' ? 'is-live' : ''} />
          {catalogSource === 'live' ? 'الكتالوج العام متصل' : 'وضع fallback للكتالوج العام'}
          {riveSrc ? <b>· Rive source connected</b> : <b>· seated motion rig</b>}
        </div>
      </main>
    </div>
  );
}
