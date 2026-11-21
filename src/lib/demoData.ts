import { AI_BRAIN_IDS, DRIVE_FOLDER_MIME } from './config';
import type { DriveFile } from '../types/drive';

const now = '2026-11-20T18:45:00.000Z';

export const DEMO_FILES_BY_PARENT: Record<string, DriveFile[]> = {
  [AI_BRAIN_IDS.rootFolder]: [
    { id: AI_BRAIN_IDS.folders.memory, name: '01-Memory', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now, description: 'حافظه بلندمدت، فرهنگ لغت، قوانین و تجربه‌ها' },
    { id: AI_BRAIN_IDS.folders.skills, name: '02-Skills', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now, description: 'کتابخانه ۹ اسکیل آماده برای آرنا و کلادکد' },
    { id: AI_BRAIN_IDS.folders.registry, name: '03-Registry', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now, description: 'دفترکل پروژه‌ها، گیت‌هاب و فایل‌های نهایی' },
    { id: AI_BRAIN_IDS.folders.projects, name: '04-Projects', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now, description: 'پروژه‌ها و آخرین نسخه نهایی هر محصول' },
    { id: AI_BRAIN_IDS.folders.chats, name: '05-Chats', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now, description: 'آرشیو چت‌های مهم آرنا با لینک مستقیم گیت‌هاب' },
    { id: AI_BRAIN_IDS.folders.assets, name: '06-Global-Assets', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now, description: 'لوگوها، هویت بصری و عکس‌های محصولات' },
    { id: AI_BRAIN_IDS.bootstrapFile, name: 'BOOTSTRAP.md', mimeType: 'text/markdown', size: '9820', modifiedTime: now, starred: true, description: 'فایل مادر سیستم AI-Brain نسخه ۱.۱' },
  ],
  [AI_BRAIN_IDS.folders.memory]: [
    { id: AI_BRAIN_IDS.files.memoryIndex, name: 'MEMORY.md', mimeType: 'text/markdown', size: '2450', modifiedTime: now, starred: true },
    { id: AI_BRAIN_IDS.files.glossary, name: 'glossary.md', mimeType: 'text/markdown', size: '1480', modifiedTime: now },
    { id: AI_BRAIN_IDS.files.profile, name: 'profile.md', mimeType: 'text/markdown', size: '1320', modifiedTime: now },
    { id: AI_BRAIN_IDS.files.rules, name: 'rules.md', mimeType: 'text/markdown', size: '3980', modifiedTime: now },
    { id: AI_BRAIN_IDS.files.lessons, name: 'lessons-learned.md', mimeType: 'text/markdown', size: '2860', modifiedTime: now },
  ],
  [AI_BRAIN_IDS.folders.skills]: [
    { id: AI_BRAIN_IDS.files.skillsIndex, name: 'INDEX.md', mimeType: 'text/markdown', size: '2640', modifiedTime: now },
    { id: '12pV3D5LvftetxiNc4R3GTzjrgvSlmHz8', name: 'project-lifecycle/SKILL.md', mimeType: 'text/markdown', size: '4820', modifiedTime: now },
    { id: '1AZtQxKsgmsoosxU8cMrwHOum-gY7l-ww', name: 'wordpress-plugin-builder/SKILL.md', mimeType: 'text/markdown', size: '4120', modifiedTime: now },
    { id: '1TVVzmGoGbAKTJfUnjW523JdYrZkaXViL', name: 'github-pages-deploy/SKILL.md', mimeType: 'text/markdown', size: '2150', modifiedTime: now },
    { id: '18hlCQBcrwE7MlTFcnJSniH4uTMpRqo_6', name: 'frontend-design/SKILL.md', mimeType: 'text/markdown', size: '2950', modifiedTime: now },
    { id: '1VNqceaFatTgz4-knptC3r8EHELQEPdjL', name: 'web-design-guidelines/SKILL.md', mimeType: 'text/markdown', size: '1240', modifiedTime: now },
  ],
  [AI_BRAIN_IDS.folders.registry]: [
    { id: AI_BRAIN_IDS.files.projectsRegistry, name: 'projects-registry.md', mimeType: 'text/markdown', size: '1120', modifiedTime: now },
    { id: AI_BRAIN_IDS.files.githubRegistry, name: 'github-registry.md', mimeType: 'text/markdown', size: '1580', modifiedTime: now },
    { id: AI_BRAIN_IDS.files.assetsRegistry, name: 'assets-registry.md', mimeType: 'text/markdown', size: '1340', modifiedTime: now },
  ],
  [AI_BRAIN_IDS.folders.projects]: [
    { id: '1IgRhKqHbcFLr-aGHmeC0njpxCXx-rPD4', name: '_TEMPLATE', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now },
  ],
  [AI_BRAIN_IDS.folders.chats]: [
    { id: AI_BRAIN_IDS.files.chatsIndex, name: 'INDEX.md', mimeType: 'text/markdown', size: '1180', modifiedTime: now },
    { id: '1-i8glV8EO_1xG90KAi8TwSdndUZAdm1P', name: '_CHAT-TEMPLATE.md', mimeType: 'text/markdown', size: '1820', modifiedTime: now },
  ],
  [AI_BRAIN_IDS.folders.assets]: [
    { id: '1dAVKLanf6JPvR_vmZoaS7AoKPwU_7QPb', name: 'brand', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now },
    { id: '1wsafawA4ULVC1_wLsRL90nUfNKJ7oyXo', name: 'products', mimeType: DRIVE_FOLDER_MIME, modifiedTime: now },
  ],
};

export const DEMO_CONTENT_BY_ID: Record<string, string> = {
  [AI_BRAIN_IDS.files.memoryIndex]: `# حافظه اصلی (Hot Cache — حالت پیش‌نمایش)

> برای دیدن فایل‌های واقعی و زنده گوگل درایوتان، از نوار بالا دکمه **«اتصال به گوگل درایو»** را بزنید.

## خلاصه ساختار سه‌پایه
- **مرکز کنترل:** Arena.ai Agent Mode
- **مغز دائمی و خزانه نسخه نهایی:** گوگل درایو (\`AI-Brain\`)
- **توسعه، تست، تاریخچه و صفحات زنده:** GitHub (یک ریپازیتوری مجزا برای هر پروژه)

## قوانین کلیدی
1. در گوگل درایو **فقط آخرین نسخه نهایی** ذخیره می‌شود.
2. نسخه‌های قدیمی‌تر پس از ثبت **لینک مستقیم گیت‌هاب** از گوگل درایو حذف می‌شوند.
3. تجربه‌های موفق و ناموفق در \`lessons-learned.md\` ثبت می‌شوند.`,

  [AI_BRAIN_IDS.bootstrapFile]: `# AI-BRAIN BOOTSTRAP KERNEL (v1.1)

این فایل کرنل اصلی سیستم حافظه شما در گوگل درایو است.
در شروع هر چت جدید آرنا، با خواندن این فایل، کل حافظه، اسکیل‌ها و رجیستری گیت‌هاب در ۱ ثانیه بارگذاری می‌شود.

- **ریشه پوشه AI-Brain:** \`1xbgHAgoAoJIWEoERxdXILgC6N861F8h6\`
- **حافظه اصلی:** \`1Hypfi18ymNgfxPPSFNbRRjBFFamb3bkM\`
- **فهرست اسکیل‌ها:** \`1Gz_CSc0XhMkYW0vo2_4-IGUPSd4P15OQ\`
- **رجیستری گیت‌هاب:** \`1ooU4EokWue1N6jO-XAl8l3vKYWVegLWY\``,

  [AI_BRAIN_IDS.files.githubRegistry]: `# رجیستری گیت‌هاب و صفحات .github.io

| تاریخ | عنوان چت | پروژه | ریپازیتوری | آدرس زنده | وضعیت |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-11-20 | ساخت داشبورد AI-Brain | \`ai-brain-dashboard\` | آماده انتشار | \`https://USERNAME.github.io/ai-brain-dashboard/\` | آماده دیپلوی |`,

  [AI_BRAIN_IDS.files.projectsRegistry]: `# رجیستری پروژه‌ها

| اسلاگ پروژه | نام | نوع | آخرین نسخه | وضعیت |
| :--- | :--- | :--- | :--- | :--- |
| \`ai-brain-dashboard\` | داشبورد زنده AI-Brain | Web App / Pages | \`v1.0.0\` | آماده انتشار |`,

  [AI_BRAIN_IDS.files.chatsIndex]: `# آرشیو چت‌های مهم آرنا

| تاریخ | عنوان چت | پروژه | خلاصه |
| :--- | :--- | :--- | :--- |
| 2026-11-20 | راه‌اندازی سیستم AI-Brain | \`ai-brain-os\` | طراحی و ساخت معماری سه‌پایه آرنا + درایو + گیت‌هاب همراه با ۹ اسکیل رسمی و قوانین جایگزینی خودکار نسخه |`,

  [AI_BRAIN_IDS.files.skillsIndex]: `# کتابخانه اسکیل‌ها (۹ اسکیل نصب‌شده)

| نام اسکیل | منبع | کاربرد |
| :--- | :--- | :--- |
| \`project-lifecycle\` | Core | چرخه کامل پروژه و جایگزینی خودکار فایل درایو با لینک گیت‌هاب |
| \`wordpress-plugin-builder\` | Core | ساخت، امنیت، بسته‌بندی و ریلیز افزونه وردپرس |
| \`github-pages-deploy\` | Core | دیپلوی و ثبت صفحات \`.github.io\` |
| \`frontend-design\` | Anthropic (1.1M) | طراحی رابط کاربری مدرن و متمایز |
| \`web-design-guidelines\` | Vercel (886K) | ممیزی حرفه‌ای UX و دسترس‌پذیری |
| \`memory-management\` | Anthropic | معماری حافظه دو لایه (Hot Cache + Glossary) |
| \`context-engineering\` | Addy Osmani | مدیریت کانتکست و قرارداد تحویل جلسه |`,
};
