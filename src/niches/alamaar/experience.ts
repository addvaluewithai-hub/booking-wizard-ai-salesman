import type { AlamaarProduct } from './catalog';

export type Tone = AlamaarProduct['tone'];
export type AnswerKey = 'project' | 'style' | 'tone' | 'application';
export type Answers = Partial<Record<AnswerKey, string>>;

export type Choice = {
  value: string;
  label: string;
  hint: string;
  tone?: Tone;
  icon: string;
  microcopy?: string;
};

export type WizardStep = {
  key: AnswerKey;
  title: string;
  subtitle: string;
  eyebrow: string;
  choices: Choice[];
};

export type MascotState =
  | 'welcome'
  | 'listen'
  | 'think'
  | 'approve'
  | 'cool'
  | 'point'
  | 'present'
  | 'celebrate';

export type GuideMessage = {
  eyebrow: string;
  text: string;
  emphasis?: string;
};

export const STEPS: WizardStep[] = [
  {
    key: 'project',
    eyebrow: 'نبدأ من المكان',
    title: 'الخامة دي رايحة فين؟',
    subtitle: 'اختار نوع المشروع وأنا هضيّق الدايرة بصريًا من غير أسئلة زيادة.',
    choices: [
      { value: 'kitchen', label: 'مطبخ', hint: 'وحدات وأسقف عمل', icon: '▦', microcopy: 'مساحة يومية' },
      { value: 'wardrobe', label: 'دريسنج / دواليب', hint: 'واجهات ومساحات كبيرة', icon: '▥', microcopy: 'سطح رأسي واسع' },
      { value: 'furniture', label: 'أثاث / وحدات', hint: 'قطع مخصصة', icon: '▤', microcopy: 'تفاصيل أقرب للعين' },
      { value: 'office', label: 'مكتب', hint: 'مساحات عمل', icon: '▧', microcopy: 'هدوء بصري' },
      { value: 'retail', label: 'محل تجاري', hint: 'هوية وتجربة', icon: '◇', microcopy: 'حضور أقوى' },
      { value: 'hospitality', label: 'فندق / مطعم', hint: 'ضيافة وواجهات', icon: '◫', microcopy: 'جوّ متكامل' },
    ],
  },
  {
    key: 'style',
    eyebrow: 'نحدد الشخصية',
    title: 'تحب المكان يتكلم بأي لغة؟',
    subtitle: 'مش لازم اسم ستايل دقيق — اختار الإحساس الأقرب لدماغك.',
    choices: [
      { value: 'warm-wood', label: 'خشبي دافئ', hint: 'طبيعي ومريح', icon: '≋', microcopy: 'warm & tactile' },
      { value: 'modern-dark', label: 'مودرن داكن', hint: 'قوي وهادئ', icon: '◼', microcopy: 'deep & premium' },
      { value: 'modern-light', label: 'مودرن فاتح', hint: 'نظيف ومضيء', icon: '□', microcopy: 'clean & open' },
      { value: 'classic', label: 'كلاسيك', hint: 'تفاصيل أغنى', icon: '⌘', microcopy: 'rich & composed' },
      { value: 'scandi', label: 'سكاندنافي', hint: 'فاتح وبسيط', icon: '△', microcopy: 'soft & calm' },
      { value: 'statement', label: 'جريء / فخم', hint: 'الخامة ليها حضور', icon: '✦', microcopy: 'hero surface' },
    ],
  },
  {
    key: 'tone',
    eyebrow: 'نضبط المزاج',
    title: 'نروح فاتح ولا نغرق في العمق؟',
    subtitle: 'الدرجة هنا بتغير إحساس المشهد كله — اختار الاتجاه اللي شدّك.',
    choices: [
      { value: 'light', label: 'فاتح', hint: 'إحساس أخف وأوسع', tone: 'light', icon: '○', microcopy: 'airier' },
      { value: 'neutral', label: 'محايد', hint: 'مرن وهادئ', tone: 'neutral', icon: '◌', microcopy: 'balanced' },
      { value: 'wood', label: 'خشبي', hint: 'دفء وملمس طبيعي', tone: 'wood', icon: '◍', microcopy: 'warm grain' },
      { value: 'dark', label: 'داكن', hint: 'عمق وحضور', tone: 'dark', icon: '●', microcopy: 'cinematic' },
    ],
  },
  {
    key: 'application',
    eyebrow: 'آخر تفصيلة',
    title: 'هتشوف الخامة على إيه؟',
    subtitle: 'ده سياق بصري للترشيح فقط — المواصفات الفنية لازم تتراجع من المنتج نفسه.',
    choices: [
      { value: 'worktop', label: 'أسطح مطابخ', hint: 'مسطح أفقي واضح', icon: '▬', microcopy: 'horizontal plane' },
      { value: 'doors', label: 'واجهات دواليب', hint: 'مساحات رأسية كبيرة', icon: '▥', microcopy: 'large verticals' },
      { value: 'walls', label: 'حوائط داخلية', hint: 'feature wall أو تغطية', icon: '▱', microcopy: 'architectural surface' },
      { value: 'furniture', label: 'أثاث', hint: 'وحدات وتفاصيل', icon: '▰', microcopy: 'close-up detail' },
    ],
  },
];

const PROJECT_LABELS: Record<string, string> = {
  kitchen: 'المطبخ',
  wardrobe: 'الدريسنج والدواليب',
  furniture: 'الأثاث والوحدات',
  office: 'المكتب',
  retail: 'المحل التجاري',
  hospitality: 'الفندق أو المطعم',
};

const STYLE_LABELS: Record<string, string> = {
  'warm-wood': 'خشبي دافئ',
  'modern-dark': 'مودرن داكن',
  'modern-light': 'مودرن فاتح',
  classic: 'كلاسيك',
  scandi: 'سكاندنافي',
  statement: 'جريء وفخم',
};

const TONE_LABELS: Record<string, string> = {
  light: 'فاتح',
  neutral: 'محايد',
  wood: 'خشبي دافئ',
  dark: 'داكن',
};

const APPLICATION_LABELS: Record<string, string> = {
  worktop: 'الأسطح الأفقية',
  doors: 'واجهات الدواليب',
  walls: 'الحوائط الداخلية',
  furniture: 'الأثاث',
};

export function choiceValue(choice: Choice): string {
  return choice.tone ?? choice.value;
}

export function scoreProduct(product: AlamaarProduct, answers: Answers): number {
  let score = 0;

  if (answers.tone && product.tone === answers.tone) score += 8;
  if (answers.style === 'warm-wood' && product.family === 'wood') score += 6;
  if (answers.style === 'modern-dark' && product.tone === 'dark') score += 6;
  if (answers.style === 'modern-light' && product.tone === 'light') score += 6;
  if (answers.style === 'scandi' && (product.tone === 'light' || product.tone === 'neutral')) score += 5;
  if (answers.style === 'statement' && (product.family === 'decorative' || product.family === 'stone')) score += 5;
  if (answers.style === 'classic' && (product.family === 'wood' || product.family === 'stone')) score += 3;
  if (answers.project === 'hospitality' && (product.tone === 'wood' || product.tone === 'dark')) score += 2;
  if (answers.project === 'office' && product.tone === 'neutral') score += 2;
  if (answers.project === 'retail' && product.family === 'decorative') score += 2;

  return score;
}

export function rankProducts(products: AlamaarProduct[], answers: Answers, limit = 3): AlamaarProduct[] {
  return [...products]
    .map((product, index) => ({ product, index, score: scoreProduct(product, answers) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ product }) => product);
}

export function resultReason(product: AlamaarProduct, answers: Answers): string {
  const tone = TONE_LABELS[product.tone] ?? 'متوازن';
  const application = APPLICATION_LABELS[answers.application ?? ''] ?? 'المشروع';
  const style = STYLE_LABELS[answers.style ?? ''];

  if (style) {
    return `قريب بصريًا من اتجاه «${style}» بدرجة ${tone}، ويستحق المقارنة على ${application} قبل اعتماد الخامة.`;
  }

  return `درجة ${tone} قريبة من اختياراتك، ويستحق المنتج المقارنة على ${application} قبل الاعتماد.`;
}

export function resultBadges(product: AlamaarProduct, answers: Answers): string[] {
  const badges: string[] = [];

  if (answers.tone === product.tone) badges.push('مطابق لاتجاه اللون');
  if (answers.style === 'warm-wood' && product.family === 'wood') badges.push('خشبي دافئ');
  if (answers.style === 'modern-dark' && product.tone === 'dark') badges.push('مودرن داكن');
  if (answers.style === 'modern-light' && product.tone === 'light') badges.push('مودرن فاتح');
  if (answers.style === 'scandi' && (product.tone === 'light' || product.tone === 'neutral')) badges.push('هادئ وفاتح');
  if (answers.style === 'statement' && (product.family === 'decorative' || product.family === 'stone')) badges.push('حضور بصري قوي');

  const application = APPLICATION_LABELS[answers.application ?? ''];
  if (application) badges.push(`للمقارنة على ${application}`);

  if (!badges.length) badges.push('قريب من اختياراتك');
  return badges.slice(0, 3);
}

export function guideMessage(stepIndex: number, answers: Answers, topProduct?: AlamaarProduct): GuideMessage {
  if (stepIndex <= 0) {
    return {
      eyebrow: 'مساعد الاختيار',
      text: 'ابدأ بالمكان. أنا هتابع اختياراتك وأغيّر الترشيحات والحركة معاك، من غير ما أحوّلها لشات طويل.',
      emphasis: 'أربع اختيارات بس.',
    };
  }

  if (stepIndex === 1) {
    const project = PROJECT_LABELS[answers.project ?? ''] ?? 'المشروع';
    return {
      eyebrow: 'تمام، فهمت السياق',
      text: `وصلت: ${project}. دلوقتي أهم حاجة أعرف الشخصية البصرية اللي عايز المكان يوصلها.`,
      emphasis: 'اختار بالإحساس، مش بالمصطلح.',
    };
  }

  if (stepIndex === 2) {
    const style = STYLE_LABELS[answers.style ?? ''] ?? 'الاتجاه ده';
    return {
      eyebrow: 'الستايل اتحدد',
      text: `«${style}» واضح. اللون دلوقتي هو اللي هيحدد هل النتيجة هتبقى أخف، أهدى، أدفى، ولا أعمق.`,
      emphasis: answers.style === 'modern-dark' ? 'جاهز للـ dark mode؟' : 'ركز على إحساس المساحة.',
    };
  }

  if (stepIndex === 3) {
    const tone = TONE_LABELS[answers.tone ?? ''] ?? 'الدرجة دي';
    return {
      eyebrow: answers.tone === 'dark' ? '😎 اختيار له حضور' : 'الـ mood اتقفل',
      text: `اختيار ${tone}. آخر خطوة: قولي هتشوف الخامة على أي سطح عشان أرتّب العرض بشكل أنسب بصريًا.`,
      emphasis: 'المواصفات الفنية نراجعها من صفحة المنتج.',
    };
  }

  const productName = topProduct ? `${topProduct.name} · ${topProduct.code}` : 'أول ترشيح';
  return {
    eyebrow: 'الـ shortlist جاهزة',
    text: `رتبت لك أقرب اختيارات بصريًا. ${productName} طلع في المقدمة بناءً على إجاباتك — مش ادعاء فني، لكنه أقوى نقطة تبدأ منها المقارنة.`,
    emphasis: 'احفظ، قارن، أو اطلب عينة.',
  };
}

export function mascotState(stepIndex: number, answers: Answers, reaction: 'idle' | 'approve' = 'idle'): MascotState {
  if (reaction === 'approve') return 'approve';
  if (stepIndex >= STEPS.length) return 'present';
  if (stepIndex === 0) return 'welcome';
  if (stepIndex === 1) return 'listen';
  if (stepIndex === 2) return answers.style === 'modern-dark' ? 'cool' : 'think';
  if (stepIndex === 3) return answers.tone === 'dark' ? 'cool' : 'point';
  return 'think';
}

export function sceneTone(answers: Answers): Tone | 'default' {
  if (answers.tone === 'light' || answers.tone === 'neutral' || answers.tone === 'wood' || answers.tone === 'dark') {
    return answers.tone;
  }

  if (answers.style === 'modern-dark') return 'dark';
  if (answers.style === 'modern-light' || answers.style === 'scandi') return 'light';
  if (answers.style === 'warm-wood' || answers.style === 'classic') return 'wood';
  return 'default';
}
