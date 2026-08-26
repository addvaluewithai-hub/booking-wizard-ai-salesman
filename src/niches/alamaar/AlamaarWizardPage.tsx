import { useEffect, useMemo, useRef, useState } from 'react';
import { ALAMAAR_FALLBACK_PRODUCTS, fetchAlamaarProducts, type AlamaarProduct } from './catalog';
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
} from './experience';
import './alamaar-wizard.css';

const SESSION_KEY = 'alamaar-guided-material-session-v2';

type PersistedSession = {
  stepIndex?: number;
  answers?: Answers;
  savedIds?: string[];
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
  const reactionTimer = useRef<number | null>(null);
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
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ stepIndex, answers, savedIds } satisfies PersistedSession));
  }, [answers, savedIds, stepIndex]);

  useEffect(() => () => {
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const currentStep = STEPS[stepIndex];
  const isResults = stepIndex >= STEPS.length;
  const selectedValue = currentStep ? answers[currentStep.key] : undefined;
  const recommendations = useMemo(() => rankProducts(catalog, answers, 3), [catalog, answers]);
  const topProduct = recommendations[0];
  const guide = guideMessage(stepIndex, answers, topProduct);
  const characterState = mascotState(stepIndex, answers, reaction);
  const mood = sceneTone(answers);
  const comparedProducts = compareIds
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is AlamaarProduct => Boolean(product));
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const canRevealEarly = !isResults && stepIndex >= 1 && answeredCount >= 2;

  const triggerApprove = () => {
    setReaction('approve');
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction('idle'), 700);
  };

  const selectChoice = (choice: Choice) => {
    if (!currentStep) return;
    setAnswers((current) => ({ ...current, [currentStep.key]: choiceValue(choice) }));
    triggerApprove();
  };

  const next = () => {
    if (!currentStep || !selectedValue) return;
    setReaction('idle');
    setStepIndex((current) => Math.min(current + 1, STEPS.length));
  };

  const goToStep = (index: number) => {
    if (index > stepIndex || index < 0) return;
    setReaction('idle');
    setStepIndex(index);
  };

  const back = () => {
    setReaction('idle');
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const revealEarly = () => {
    setReaction('idle');
    setStepIndex(STEPS.length);
  };

  const restart = () => {
    setAnswers({});
    setSavedIds([]);
    setCompareIds([]);
    setReaction('idle');
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

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
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
          <div
            className="alamaar-demo__panel alamaar-demo__panel--one"
            style={{ transform: `translate3d(${look.x * -0.035}px, ${look.y * -0.018}px, 0) rotate(-6deg)` }}
          />
          <div
            className="alamaar-demo__panel alamaar-demo__panel--two"
            style={{ transform: `translate3d(${look.x * 0.025}px, ${look.y * -0.012}px, 0) rotate(2deg)` }}
          />
          <div
            className="alamaar-demo__panel alamaar-demo__panel--three"
            style={{ transform: `translate3d(${look.x * 0.045}px, ${look.y * 0.016}px, 0) rotate(7deg)` }}
          />
          <div className="alamaar-demo__grain" />
          <div className="alamaar-demo__hero-copy">
            <span>HPL</span>
            <strong>اختيار خامة، بس بإحساس أقل زحمة.</strong>
          </div>
        </div>
        <div className="alamaar-demo__veil" />

        <section className={`alamaar-wizard ${isResults ? 'alamaar-wizard--results' : ''}`} aria-live="polite">
          <div className="alamaar-wizard__topline">
            <div className="alamaar-wizard__mode">
              <span className="alamaar-wizard__mode-dot" />
              GUIDED MATERIAL CONCIERGE
            </div>
            <span>{answeredCount}/{STEPS.length} إشارات بصرية</span>
          </div>

          <div className="alamaar-wizard__progress" aria-label="تقدم الاختيارات">
            {STEPS.map((step, index) => {
              const complete = Boolean(answers[step.key]);
              const current = index === stepIndex && !isResults;
              return (
                <button
                  key={step.key}
                  type="button"
                  className={complete ? 'is-done' : current ? 'is-current' : ''}
                  onClick={() => goToStep(index)}
                  disabled={index > stepIndex || isResults}
                  aria-label={`الخطوة ${index + 1}: ${step.eyebrow}`}
                >
                  <span>{complete ? '✓' : index + 1}</span>
                  <small>{step.eyebrow}</small>
                </button>
              );
            })}
          </div>

          {!isResults && currentStep ? (
            <div className="alamaar-wizard__content" key={currentStep.key}>
              <div className="alamaar-wizard__heading">
                <span>{currentStep.eyebrow} · {stepIndex + 1}/{STEPS.length}</span>
                <h1>{currentStep.title}</h1>
                <p>{currentStep.subtitle}</p>
              </div>

              <div className={`alamaar-wizard__choices alamaar-wizard__choices--${currentStep.choices.length}`}>
                {currentStep.choices.map((choice, index) => {
                  const value = choiceValue(choice);
                  const selected = selectedValue === value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      className={selected ? 'is-selected' : ''}
                      onClick={() => selectChoice(choice)}
                      onFocus={() => setLook({ x: index < currentStep.choices.length / 2 ? 58 : -58, y: -12 })}
                      aria-pressed={selected}
                      data-choice-tone={choice.tone ?? ''}
                    >
                      <span className="alamaar-wizard__choice-shine" />
                      <span className="alamaar-wizard__choice-icon">{choice.icon}</span>
                      <strong>{choice.label}</strong>
                      <small>{choice.hint}</small>
                      <em>{choice.microcopy}</em>
                      <span className="alamaar-wizard__check">✓</span>
                    </button>
                  );
                })}
              </div>

              <div className="alamaar-wizard__actions">
                <button type="button" className="alamaar-button alamaar-button--ghost" onClick={back} disabled={stepIndex === 0}>رجوع</button>
                <div className="alamaar-wizard__actions-center">
                  {canRevealEarly ? <button type="button" className="alamaar-text-action" onClick={revealEarly}>كفاية كده، ورّيني ترشيحات</button> : null}
                </div>
                <button type="button" className="alamaar-button alamaar-button--primary" onClick={next} disabled={!selectedValue}>
                  {stepIndex === STEPS.length - 1 ? 'اكشف الـ shortlist' : 'كمّل'}
                  <span>←</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="alamaar-results" key="results">
              <div className="alamaar-results__intro">
                <div className="alamaar-wizard__heading">
                  <span>CURATED SHORTLIST</span>
                  <h1>ثلاث خامات تستحق تبدأ منها</h1>
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
                <button type="button" className="alamaar-button alamaar-button--ghost" onClick={() => setStepIndex(Math.max(0, STEPS.length - 1))}>عدّل الاختيارات</button>
                <button type="button" className="alamaar-text-action" onClick={restart}>ابدأ من جديد</button>
              </div>
            </div>
          )}
        </section>

        <aside className={`alamaar-guide ${isResults ? 'alamaar-guide--results' : ''}`} aria-label="مساعد اختيار الخامات">
          <div className="alamaar-guide__bubble">
            <div className="alamaar-guide__bubble-topline">
              <span>{guide.eyebrow}</span>
              <i aria-hidden="true" />
            </div>
            <p>{guide.text}</p>
            {guide.emphasis ? <strong>{guide.emphasis}</strong> : null}
          </div>
          <MascotStage
            state={characterState}
            stepIndex={stepIndex}
            lookX={look.x}
            lookY={look.y}
            talking
            engaged
            riveSrc={riveSrc}
          />
        </aside>

        <div className="alamaar-demo__source" title="النسخة تحاول استخدام WooCommerce Store API العام أولاً ثم تستخدم fallback عام عند الحاجة.">
          <span className={catalogSource === 'live' ? 'is-live' : ''} />
          {catalogSource === 'live' ? 'الكتالوج العام متصل' : 'وضع fallback للكتالوج العام'}
          {riveSrc ? <b>· Rive source connected</b> : <b>· Rive contract ready</b>}
        </div>
      </main>
    </div>
  );
}
