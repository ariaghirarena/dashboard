/**
 * AI-Brain Skills catalog — the 12 REAL skills installed in Google Drive `AI-Brain/02-Skills/`.
 * Kept in sync with `02-Skills/INDEX.md` (source of truth for SKILL.md file IDs).
 * In connected mode the dashboard lists the live folder and merges any NEW skill it finds
 * (folders on Drive that are missing from this catalog), so newly installed skills appear automatically.
 */

export interface SkillEntry {
  /** Exact folder slug inside 02-Skills, e.g. `github-pages-deploy` */
  slug: string;
  /** Drive folder ID of the skill folder inside 02-Skills */
  folderId: string;
  /** Drive file ID of the skill's SKILL.md (from INDEX.md at catalog time) */
  fileId: string;
  /** Persian short title for card display */
  titleFa: string;
  /** Persian one-line purpose */
  purposeFa: string;
  /** Where the skill comes from */
  source: string;
  /** Persian natural triggers */
  triggersFa: string;
}

export const SKILLS_CATALOG: SkillEntry[] = [
  {
    slug: 'project-lifecycle',
    folderId: '1vXN1b0g_sQbtu43IY1Wjqk_imbJKRLo9',
    fileId: '12pV3D5LvftetxiNc4R3GTzjrgvSlmHz8',
    titleFa: 'مدیریت چرخه‌ی حیات پروژه',
    purposeFa: 'از صفر تا نسخه نهایی: ۱ ریپو برای هر پروژه، ورژنینگ و جایگزینی فایل قدیمی درایو با لینک گیت‌هاب',
    source: 'Custom Core',
    triggersFa: 'شروع پروژه جدید، آپدیت نسخه، جایگزینی فایل قدیمی در درایو',
  },
  {
    slug: 'wordpress-plugin-builder',
    folderId: '1nS8bM6mppE7eArsq3OiUl4SlBCOe5e15',
    fileId: '1AZtQxKsgmsoosxU8cMrwHOum-gY7l-ww',
    titleFa: 'ساخت افزونه وردپرس',
    purposeFa: 'ساخت، امنیت، تست، پکیج .zip و ریلیز روی گیت‌هاب + همگام‌سازی افزونه در پوشه final/ درایو',
    source: 'Custom Core',
    triggersFa: 'ساخت افزونه وردپرس، آپدیت پلاگین',
  },
  {
    slug: 'github-pages-deploy',
    folderId: '1wZI2nJcdS5BrfHhlCUajrVg1e_hWK9Ou',
    fileId: '1TVVzmGoGbAKTJfUnjW523JdYrZkaXViL',
    titleFa: 'دیپلوی GitHub Pages',
    purposeFa: 'بیلد، تست، انتشار .github.io و ثبت در رجیستری گیت‌هاب',
    source: 'Custom Core',
    triggersFa: 'ساخت صفحه گیت‌هاب پیج، دیپلوی .github.io',
  },
  {
    slug: 'skill-creator',
    folderId: '1PLXEoAEV6PsmJRMG3OkrIX4I27cR6Zr_',
    fileId: '1ble0Xb_LdBOxGZCajcAbyBmEwbJdasNM',
    titleFa: 'ساخت اسکیل جدید',
    purposeFa: 'تبدیل هر فرایند اثبات‌شده به SKILL.md استاندارد و ثبت آن در INDEX',
    source: 'Custom Core',
    triggersFa: 'تبدیل به اسکیل، ساخت اسکیل جدید، افزونه کردن اسکیل',
  },
  {
    slug: 'find-skills',
    folderId: '1pQN8RfLz7HCftlKnjYZ36qtIQ9n1154Z',
    fileId: '1_x2GzPhp0sxM9BpTG0XUFZhbM8hcTwf4',
    titleFa: 'یافتن اسکیل از جامعه',
    purposeFa: 'کشف، راستی‌آزمایی (نصب‌ها + امنیت) و نصب اسکیل از vercel-labs/skills با npx skills',
    source: 'vercel-labs/skills',
    triggersFa: 'پیدا کردن اسکیل، جستجوی اسکیل، نصب اسکیل',
  },
  {
    slug: 'frontend-design',
    folderId: '1anGnlBI_2gMUKNm8pdcpKxn6OKP63HSN',
    fileId: '18hlCQBcrwE7MlTFcnJSniH4uTMpRqo_6',
    titleFa: 'طراحی رابط متمایز',
    purposeFa: 'طراحی بصری هدفمند و غیرجنریک برای وب‌اپ و داشبورد + کپی‌نویسی UI',
    source: 'anthropics/skills',
    triggersFa: 'طراحی UI، ساخت داشبورد، frontend design',
  },
  {
    slug: 'web-design-guidelines',
    folderId: '1mfQDxGlyFwEZIt87W0xEEhwWP-_frM0t',
    fileId: '1VNqceaFatTgz4-knptC3r8EHELQEPdjL',
    titleFa: 'ممیزی UX و دسترس‌پذیری',
    purposeFa: 'بررسی کد رابط کاربری در برابر دستورالعمل‌های زندهٔ Vercel (UX، Accessibility، RTL)',
    source: 'vercel-labs/agent-skills',
    triggersFa: 'بررسی UI، بازبینی UX، آدیت رابط',
  },
  {
    slug: 'context-engineering',
    folderId: '1FMCvp0Ru53IOQuBAmLgjypIZcW0KyBSQ',
    fileId: '1p0dlGQbgj5L5x-LUvY_U71a82avCaJBR',
    titleFa: 'مهندسی کانتکست',
    purposeFa: 'سلسله‌مراتب کانتکست، مرزهای اعتماد، قرارداد تحویل و مدیریت سردرگمی',
    source: 'addyosmani/agent-skills',
    triggersFa: 'بهینه‌سازی کانتکست، هندآف چت، مهندسی کانتکست',
  },
  {
    slug: 'memory-management',
    folderId: '1F3xNHntOEzcD9M3tyXC6UyKFsm6QL0R_',
    fileId: '1U4pCd2K0hT7IM6ps63FfT-7JkLpBKJKo',
    titleFa: 'مدیریت حافظه دولایه',
    purposeFa: 'MEMORY.md (کش داغ) + فرهنگ لغت کامل با چرخهٔ ترفیع و تنزل سراسری',
    source: 'anthropics/knowledge-work-plugins',
    triggersFa: 'مدیریت حافظه، فرهنگ لغت اصطلاحات',
  },
  {
    slug: 'wp-elementor-studio',
    folderId: '1HJmFqg_Kkg7l-CYpFxpNO4xwUs3V13Vw',
    fileId: '1aBBD5simxXVyL8niuhwjFaOFoR-Q3Qj8',
    titleFa: 'تم + افزونه با المنتور',
    purposeFa: 'ساخت تم و افزونه با ویجت‌های عمیق المنتور، تب Advanced، انیمیشن لایه‌ای و بیلد تک‌کلیک',
    source: 'GitHub: ariaghirarena/refrence-theme-and-plugin-motion-creator',
    triggersFa: 'ساخت قالب وردپرس + افزونه المنتور، سایت با المنتور',
  },
  {
    slug: 'real-plugin-demo',
    folderId: '1-k9isGTyiLVdAb7JJOi03VVjdT3k-8CW',
    fileId: '1Byec3rs3C1TqEKP4LQMKmwy0-5VugIph',
    titleFa: 'دمو از افزونه واقعی',
    purposeFa: 'ساخت دموی مرورگر مستقیم از دارایی‌های واقعی افزونه (SPA interceptor یا پیش‌رندر PHP CLI)',
    source: 'Custom Core (Seolity + AIWriter Proven)',
    triggersFa: 'دموی واقعی افزونه، پیش‌نمایش واقعی افزونه',
  },
  {
    slug: 'zhaket',
    folderId: '1FuYf-noApq9pn0aqq3IMumYysUfEJi-M',
    fileId: '13kYdyTKUjGA-Tpc0qnQ3B8VH0CNkRRWi',
    titleFa: 'کارخانهٔ فروش ژاکت',
    purposeFa: 'خط تولید محصول ژاکت: فونت‌ها از درایو، ۳D chroma-key، کاور HTML، دموی واقعی و ZIP آمادهٔ آپلود',
    source: 'Custom Core (Seolity + AIWriter Factory v2.2)',
    triggersFa: 'پروژه ژاکت، انتشار در ژاکت، بنر ژاکت',
  },
];

export interface SkillPromptOptions {
  slug: string;
  fileId: string | null;
  folderId: string | null;
}

/** Prompt the user pastes into any chat so that chat reads the skill from Drive and learns it. */
export function skillActivationPrompt({ slug, fileId, folderId }: SkillPromptOptions): string {
  if (fileId) {
    return `لطفاً فایل SKILL.md اسکیل «${slug}» را از گوگل درایو بخوان (شناسه فایل: ${fileId}) و طبق آن عمل کن. اول به‌طور خلاصه بگو فهمیدی چه کاری باید انجام دهی، بعد اجرا کن.`;
  }
  return `لطفاً فایل SKILL.md پوشه‌ی «02-Skills/${slug}» را از گوگل درایو بخوان (شناسه پوشه: ${folderId ?? '02-Skills'}) و طبق آن عمل کن. اول به‌طور خلاصه بگو فهمیدی چه کاری باید انجام دهی، بعد اجرا کن.`;
}

/** Prompt for installing a brand-new skill (used in guidance/help text). */
export const ADD_SKILL_PROMPT_EXAMPLE =
  'لطفاً اسکیل «<نام یا لینک اسکیل>» را نصب کن. طبق پروتکل 02-Skills/README.md (و بخش How to ADD a New Skill در INDEX.md) عمل کن: اول README/SKILL.md اصلی آن اسکیل را بخوان، ساختار را با سیستم AI-Brain تطبیق بده، پوشهٔ با همان slug بساز، SKILL.md را داخلش قرار بده و در 02-Skills/INDEX.md ردیف جدید با slug، source، purpose، triggers و File ID دقیق SKILL.md ثبت کن تا در داشبورد دیده شود.';
