import { useEffect, useMemo, useState } from 'react';
import { ALAMAAR_FALLBACK_PRODUCTS, fetchAlamaarProducts, type AlamaarProduct } from './catalog';
import './alamaar-wizard.css';

type Tone = AlamaarProduct['tone'];
type AnswerKey = 'project' | 'style' | 'tone' | 'application';
type Answers = Partial<Record<AnswerKey, string>>;

type Choice = {
  value: string;
  label: string;
  hint: string;
  tone?: Tone;
  icon: string;
};

type WizardStep = {
  key: AnswerKey;
  title: string;
  subtitle: string;
  choices: Choice[];
};

const STEPS: WizardStep[] = [
  {
    key: 'project',
    title: 'أين سيتم استخدام الخامة؟',
    subtitle: 'اختر نوع المشروع',
    choices: [
      { value: 'kitchen', label: 'مطبخ', hint: 'وحدات وأسقف عمل', icon: '▦' },
      { value: 'wardrobe', label: 'دريسنج / دواليب', hint: 'واجهات ومساحات كبيرة', icon: '▥' },
      { value: 'furniture', label: 'أثاث / وحدات', hint: 'قطع مخصصة', icon: '▤' },
      { value: 'office', label: 'مكتب', hint: 'مساحات عمل', icon: '▧' },
      { value: 'retail', label: 'محل تجاري', hint: 'هوية وتجربة', icon: '◇' },
      { value: 'hospitality', label: 'فندق / مطعم', hint: 'ضيافة وواجهات', icon: '◫' },
    ],
  },
  {
    key: 'style',
    title: 'ما الأسلوب الأقرب لذوقك؟',
    subtitle: 'اختر المظهر العام',
    choices: [
      { value: 'warm-wood', label: 'خشبي دافئ', hint: 'طبيعي ومريح', icon: '≋' },
      { value: 'modern-dark', label: 'مودرن داكن', hint: 'قوي وهادئ', icon: '◼' },
      { value: 'modern-light', label: 'مودرن فاتح', hint: 'نظيف ومضيء', icon: '□' },
      { value: 'classic', label: 'كلاسيك', hint: 'تفاصيل غنية', icon: '⌘' },
      { value: 'scandi', label: 'سكاندنافي', hint: 'فاتح وبسيط', icon: '△' },
      { value: 'statement', label: 'جريء / فخم', hint: 'خامة لها حضور', icon: '✦' },
    ],
  },
  {
    key: 'tone',
    title: 'أي درجة لونية تفضل؟',
    subtitle: 'اختر الاتجاه الذي يناسب مساحتك',
    choices: [
      { value: 'light', label: 'فاتح', hint: 'يوسع الإحساس بالمكان', tone: 'light', icon: '○' },
      { value: 'neutral', label: 'محايد', hint: 'مرن وسهل التنسيق', tone: 'neutral', icon: '◌' },
      { value: 'wood', label: 'خشبي', hint: 'دفء وملمس طبيعي', tone: 'wood', icon: '◍' },
      { value: 'dark', label: 'داكن', hint: 'فخامة وعمق', tone: 'dark', icon: '●' },
    ],
  },
  {
    key: 'application',
    title: 'كيف سيتم تطبيق الخامة؟',
    subtitle: 'اختر نوع الاستخدام',
    choices: [
      { value: 'worktop', label: 'أسطح مطابخ', hint: 'سطح بصري عملي', icon: '▬' },
      { value: 'doors', label: 'واجهات دواليب', hint: 'مساحات رأسية', icon: '▥' },
      { value: 'walls', label: 'حوائط داخلية', hint: 'تغطية وfeature walls', icon: '▱' },
      { value: 'furniture', label: 'أثاث', hint: 'تفاصيل ووحدات', icon: '▰' },
    ],
  },
];

const MASCOT_MESSAGES = [
  'أهلاً 👋 قولي المشروع فين، وأنا أضيّق الاختيارات من غير ما نعقّدها.',
  'جميل. دلوقتي نحدد الإحساس البصري اللي تحبه.',
  'الدرجة اللونية بتفرق جدًا في إحساس المساحة.',
  'آخر خطوة — طريقة الاستخدام هتخليني أرتب الترشيحات بشكل أذكى.',
  'دي أقرب اختيارات من الكتالوج. تقدر تفتح الخامة أو تطلب مساعدة من الفريق.',
];

function Mascot({ state }: { state: 'wave' | 'think' | 'cool' | 'point' | 'celebrate' }) {
  return (
    <div className={`alamaar-mascot alamaar-mascot--${state}`} aria-hidden="true">
      <svg viewBox="0 0 220 280" role="img">
        <defs>
          <linearGradient id="woodBody" x1="0" x2="1">
            <stop offset="0" stopColor="#9a6237" />
            <stop offset="0.45" stopColor="#b97a48" />
            <stop offset="1" stopColor="#7d4d2d" />
          </linearGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodOpacity="0.25" />
          </filter>
        </defs>
        <ellipse cx="112" cy="253" rx="70" ry="15" fill="rgba(0,0,0,.2)" />
        <g filter="url(#shadow)">
          <path className="alamaar-mascot__arm alamaar-mascot__arm--left" d="M55 137 C27 145 21 167 16 186" fill="none" stroke="#8b572f" strokeWidth="15" strokeLinecap="round" />
          <path className="alamaar-mascot__arm alamaar-mascot__arm--right" d="M168 140 C197 139 203 158 207 179" fill="none" stroke="#8b572f" strokeWidth="15" strokeLinecap="round" />
          <circle cx="15" cy="187" r="10" fill="#b77a49" />
          <circle cx="207" cy="180" r="10" fill="#b77a49" />
          <rect x="53" y="42" width="116" height="183" rx="32" fill="url(#woodBody)" stroke="#55331f" strokeWidth="5" />
          <path d="M72 63 C98 74 118 49 153 69" fill="none" stroke="rgba(74,40,20,.3)" strokeWidth="4" strokeLinecap="round" />
          <path d="M67 110 C90 99 126 116 158 100" fill="none" stroke="rgba(74,40,20,.24)" strokeWidth="3" strokeLinecap="round" />
          <path d="M70 184 C101 170 125 194 155 179" fill="none" stroke="rgba(74,40,20,.2)" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="91" cy="111" rx="18" ry="23" fill="#fffaf0" stroke="#3b2618" strokeWidth="4" />
          <ellipse cx="133" cy="111" rx="18" ry="23" fill="#fffaf0" stroke="#3b2618" strokeWidth="4" />
          <circle className="alamaar-mascot__pupil" cx="95" cy="115" r="7" fill="#211711" />
          <circle className="alamaar-mascot__pupil" cx="137" cy="115" r="7" fill="#211711" />
          <path d="M85 88 Q93 80 102 87" fill="none" stroke="#3b2618" strokeWidth="5" strokeLinecap="round" />
          <path d="M123 87 Q134 78 145 87" fill="none" stroke="#3b2618" strokeWidth="5" strokeLinecap="round" />
          <path className="alamaar-mascot__mouth" d="M87 151 Q112 176 140 149 Q131 190 111 190 Q91 188 87 151" fill="#2b1710" stroke="#3b2618" strokeWidth="4" />
          <path d="M96 159 Q112 168 132 157" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
          <path d="M80 224 L72 247" stroke="#6c4027" strokeWidth="14" strokeLinecap="round" />
          <path d="M141 224 L148 247" stroke="#6c4027" strokeWidth="14" strokeLinecap="round" />
          <path d="M61 250 Q76 240 90 252" fill="none" stroke="#3b2618" strokeWidth="9" strokeLinecap="round" />
          <path d="M134 252 Q149 240 165 250" fill="none" stroke="#3b2618" strokeWidth="9" strokeLinecap="round" />
          <g className="alamaar-mascot__glasses">
            <rect x="72" y="95" width="40" height="25" rx="8" fill="#191919" />
            <rect x="114" y="95" width="40" height="25" rx="8" fill="#191919" />
            <path d="M110 102 H116" stroke="#191919" strokeWidth="5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function getMascotState(stepIndex: number, answers: Answers): 'wave' | 'think' | 'cool' | 'point' | 'celebrate' {
  if (stepIndex >= STEPS.length) return 'celebrate';
  if (stepIndex === 0) return 'wave';
  if (stepIndex === 2 && answers.tone === 'dark') return 'cool';
  if (stepIndex === 3) return 'point';
  return 'think';
}

function scoreProduct(product: AlamaarProduct, answers: Answers): number {
  let score = 0;
  if (answers.tone && product.tone === answers.tone) score += 5;
  if (answers.style === 'warm-wood' && product.family === 'wood') score += 4;
  if (answers.style === 'modern-dark' && product.tone === 'dark') score += 4;
  if (answers.style === 'modern-light' && product.tone === 'light') score += 4;
  if (answers.style === 'scandi' && (product.tone === 'light' || product.tone === 'neutral')) score += 3;
  if (answers.style === 'statement' && (product.family === 'decorative' || product.family === 'stone')) score += 3;
  if (answers.project === 'hospitality' && product.tone === 'wood') score += 2;
  if (answers.project === 'office' && product.tone === 'neutral') score += 2;
  return score;
}

function resultReason(product: AlamaarProduct, answers: Answers): string {
  const toneText: Record<AlamaarProduct['tone'], string> = {
    light: 'درجة فاتحة',
    neutral: 'درجة محايدة',
    wood: 'طابع خشبي دافئ',
    dark: 'درجة داكنة عميقة',
  };
  const application = answers.application === 'doors' ? 'واجهات الدواليب' : answers.application === 'walls' ? 'الحوائط الداخلية' : answers.application === 'worktop' ? 'أسطح المطبخ' : 'الأثاث';
  return `${toneText[product.tone]} مناسبة بصريًا لاتجاهك، وتستحق المقارنة على ${application}.`;
}

export default function AlamaarWizardPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [catalog, setCatalog] = useState<AlamaarProduct[]>(ALAMAAR_FALLBACK_PRODUCTS);
  const [catalogSource, setCatalogSource] = useState<'live' | 'fallback'>('fallback');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlamaarProducts(controller.signal).then(({ products, source }) => {
      setCatalog(products);
      setCatalogSource(source);
    });
    return () => controller.abort();
  }, []);

  const currentStep = STEPS[stepIndex];
  const isResults = stepIndex >= STEPS.length;
  const recommendations = useMemo(() => [...catalog].sort((a, b) => scoreProduct(b, answers) - scoreProduct(a, answers)).slice(0, 3), [catalog, answers]);
  const mascotState = getMascotState(stepIndex, answers);
  const selectedValue = currentStep ? answers[currentStep.key] : undefined;

  const selectChoice = (choice: Choice) => {
    if (!currentStep) return;
    setAnswers((current) => ({ ...current, [currentStep.key]: choice.tone ?? choice.value }));
  };

  const next = () => {
    if (!currentStep || !selectedValue) return;
    setStepIndex((current) => Math.min(current + 1, STEPS.length));
  };

  const back = () => setStepIndex((current) => Math.max(0, current - 1));

  const restart = () => {
    setAnswers({});
    setSavedIds([]);
    setStepIndex(0);
  };

  const toggleSaved = (id: string) => setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);

  return (
    <div className="alamaar-demo" dir="rtl">
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
          <div className="alamaar-demo__panel alamaar-demo__panel--one" />
          <div className="alamaar-demo__panel alamaar-demo__panel--two" />
          <div className="alamaar-demo__panel alamaar-demo__panel--three" />
          <div className="alamaar-demo__hero-copy"><span>HPL</span><strong>أسطح تصنع روح المكان.</strong></div>
        </div>
        <div className="alamaar-demo__veil" />

        <section className={`alamaar-wizard ${isResults ? 'alamaar-wizard--results' : ''}`} aria-live="polite">
          <div className="alamaar-wizard__progress" aria-label="تقدم الاختيارات">
            {STEPS.map((step, index) => (
              <button
                key={step.key}
                type="button"
                className={index < stepIndex ? 'is-done' : index === stepIndex ? 'is-current' : ''}
                onClick={() => index < stepIndex && setStepIndex(index)}
                disabled={index > stepIndex}
                aria-label={`الخطوة ${index + 1}: ${step.subtitle}`}
              >
                <span>{index < stepIndex ? '✓' : index + 1}</span>
                <small>{step.subtitle.replace('اختر ', '')}</small>
              </button>
            ))}
          </div>

          {!isResults && currentStep ? (
            <div className="alamaar-wizard__content">
              <div className="alamaar-wizard__heading">
                <span>اختيار موجه · {stepIndex + 1}/{STEPS.length}</span>
                <h1>{currentStep.title}</h1>
                <p>{currentStep.subtitle}</p>
              </div>
              <div className={`alamaar-wizard__choices alamaar-wizard__choices--${currentStep.choices.length}`}>
                {currentStep.choices.map((choice) => {
                  const choiceValue = choice.tone ?? choice.value;
                  const selected = selectedValue === choiceValue;
                  return (
                    <button key={choice.value} type="button" className={selected ? 'is-selected' : ''} onClick={() => selectChoice(choice)} aria-pressed={selected}>
                      <span className="alamaar-wizard__choice-icon">{choice.icon}</span>
                      <strong>{choice.label}</strong>
                      <small>{choice.hint}</small>
                      <span className="alamaar-wizard__check">✓</span>
                    </button>
                  );
                })}
              </div>
              <div className="alamaar-wizard__actions">
                <button type="button" className="alamaar-button alamaar-button--ghost" onClick={back} disabled={stepIndex === 0}>رجوع</button>
                <button type="button" className="alamaar-button alamaar-button--primary" onClick={next} disabled={!selectedValue}>{stepIndex === STEPS.length - 1 ? 'اعرض الترشيحات' : 'التالي'}</button>
              </div>
            </div>
          ) : (
            <div className="alamaar-results">
              <div className="alamaar-wizard__heading">
                <span>النتائج</span>
                <h1>هذه أقرب خامات لاختياراتك</h1>
                <p>ترشيح أولي بصري — افتح الخامة لمراجعة التفاصيل الفعلية قبل الاعتماد.</p>
              </div>
              <div className="alamaar-results__grid">
                {recommendations.map((product, index) => (
                  <article className="alamaar-result-card" key={product.id}>
                    <div className="alamaar-result-card__image">
                      <img src={product.image} alt={`${product.name} ${product.code}`} loading="lazy" />
                      <button type="button" onClick={() => toggleSaved(product.id)} aria-label={savedIds.includes(product.id) ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}>{savedIds.includes(product.id) ? '♥' : '♡'}</button>
                      {index === 0 ? <span>الأقرب</span> : null}
                    </div>
                    <div className="alamaar-result-card__body">
                      <small>{product.family.toUpperCase()}</small>
                      <h2>{product.name}</h2>
                      <strong>{product.code}</strong>
                      <p>{resultReason(product, answers)}</p>
                      <a href={product.url} target="_blank" rel="noreferrer">عرض الخامة ↗</a>
                    </div>
                  </article>
                ))}
              </div>
              <div className="alamaar-results__actions">
                <a className="alamaar-button alamaar-button--primary" href="https://alamaarhpl.com/contact/" target="_blank" rel="noreferrer">اطلب عينة</a>
                <a className="alamaar-button alamaar-button--secondary" href="https://wa.me/201008897060" target="_blank" rel="noreferrer">تواصل واتساب</a>
                <button type="button" className="alamaar-button alamaar-button--ghost" onClick={restart}>ابدأ من جديد</button>
              </div>
            </div>
          )}
        </section>

        <aside className="alamaar-guide" aria-label="مساعد اختيار الخامات">
          <div className="alamaar-guide__bubble">
            <span>مساعد الاختيار</span>
            <p>{MASCOT_MESSAGES[Math.min(stepIndex, MASCOT_MESSAGES.length - 1)]}</p>
          </div>
          <Mascot state={mascotState} />
        </aside>

        <div className="alamaar-demo__source" title="The demo first tries Al Amaar's public WooCommerce Store API and falls back to catalog records captured from the public site.">
          <span className={catalogSource === 'live' ? 'is-live' : ''} />
          {catalogSource === 'live' ? 'بيانات مباشرة من الكتالوج العام' : 'نسخة اختبار من بيانات الموقع العامة'}
        </div>
      </main>
    </div>
  );
}
