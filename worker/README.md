# AI-Brain Drive Token Worker — راهنمای نصب (اتصال دائم درایو در همه‌جا)

این Worker همان چیزی است که «هرجا لینک را باز کردی، رمز را زدی، درایو خودبه‌خود وصل باشد» را روی هاست استاتیک ممکن می‌کند:

- Refresh Token گوگل **فقط** داخل KV رمزنگاری‌شده‌ی Cloudflare نگهداری می‌شود (AES-GCM با کلید مشتق‌شده از `TOKEN_PEPPER`).
- مرورگر هرگز Refresh Token را نمی‌بیند؛ فقط یک Access Token یک‌ساعته می‌گیرد.
- داشبورد موقع ورود با رمز، یک کلید مشتق‌شده (`SHA-256("aibrain-worker:" + passcode)`) را در حافظه‌ی دستگاه نگه می‌دارد و با آن از Worker توکن می‌گیرد. این مقدار در باندل عمومی نیست.

> ⚠️ تمام مقادیر (`WORKER_KEY` و `TOKEN_PEPPER`) فقط در فایل خصوصی `SECRETS-AI-Brain-Dashboard.md` در گوگل درایو شما و در خود Worker ذخیره شده‌اند. در هیچ فایلی در ریپو قرار ندارند.

## پیش‌نیاز
- یک اکانت رایگان Cloudflare (dash.cloudflare.com) — ساختش حدود ۲ دقیقه است.

## گام به گام (از طریق داشبورد Cloudflare — بدون نصب چیزی)

1. **ساخت Worker**
   - برو به: `https://dash.cloudflare.com/` → منوی سمت چپ: **Workers & Pages** ← **Create application** ← **Create Worker**
   - نام: `aibrain-drive-token` ← **Deploy** (اول یک Worker نمونه deploy می‌شود — مشکلی نیست)
   - سپس **Edit code** را بزن، همه‌ی کد نمونه را پاک کن و محتوای فایل `worker/worker.js` را کامل پیست کن ← **Save and deploy**

2. **ساخت KV برای نگهداری امن Refresh Token**
   - منوی سمت چپ: **Storage & Databases** ← **KV** ← **Create a namespace**
   - نام: `TOKENS` ← **Add**
   - برگرد به **Workers & Pages** ← Worker شما ← تب **Settings** ← **Bindings** ← **Add binding** ← نوع **KV namespace** ← Variable name: `TOKENS` ← Namespace: همان `TOKENS` ← **Deploy**

3. **افزودن Secretها (به‌صورت رمزنگاری‌شده)**
   در همان Worker ← **Settings** ← **Variables and secrets** ← **Add** ← نوع **Secret** (encrypted) برای هرکدام. مقدارهای واقعی همه در فایل خصوصی **`SECRETS-AI-Brain-Dashboard.md`** در ریشه‌ی پوشه‌ی `AI-Brain` در گوگل درایو شما هستند (هیچ‌کدام اینجا نوشته نمی‌شوند چون ریپو عمومی است):

   | نام Secret | منبع مقدار |
   |---|---|
   | `GOOGLE_CLIENT_ID` | همان Client ID کامل کلاینت `AI-Brain GitHub Pages` |
   | `GOOGLE_CLIENT_SECRET` | Client Secret همان کلاینت (از فایل SECRETS درایو) |
   | `WORKER_KEY` | کلید Worker از فایل SECRETS درایو |
   | `TOKEN_PEPPER` | فلفل رمزنگاری خزانه از فایل SECRETS درایو |

   (بعد از افزودن همه ← دوباره **Deploy**)

4. **ثبت Redirect URI در Google Cloud Console**
   - `https://console.cloud.google.com/` → پروژه‌ی `AI-Brain-Dashboard` → **APIs & Services → Credentials** → کلاینت **AI-Brain GitHub Pages**
   - در **Authorized redirect URIs** روی **+ Add URI** بزن و دقیقاً این را اضافه کن (آدرس Worker خودت):
     ```
     https://aibrain-drive-token.<SUBDOMAIN-تو>.workers.dev/callback
     ```
     آدرس دقیق Worker را در تب Worker → بالای صفحه می‌بینی (چیزی شبیه `https://aibrain-drive-token.xxxxx.workers.dev`).
   - **Save** (اوریجین‌های قبلی دست نمی‌خورد؛ فقط این Redirect URI اضافه می‌شود).

5. **یک‌بار مجوز دائمی را ثبت کن**
   در همان مرورگری که با گوگل لاگینی، این آدرس را باز کن (به‌جای `<WORKER_KEY>` مقدار واقعی فایل SECRETS درایو را بگذار):
   ```
   https://aibrain-drive-token.<SUBDOMAIN-تو>.workers.dev/auth?key=<WORKER_KEY>
   ```
   → صفحه‌ی consent گوگل → چون اپ شخصی و در حالت Production است، روی **Advanced** ← **Go to AI-Brain Dashboard (unsafe)** ← **Continue** → **Continue** برای دسترسی
   → باید صفحه‌ی **«✅ اتصال دائم ثبت شد»** را ببینی. تمام!

6. **وصل‌کردن داشبورد به Worker**
   دو راه دارد:
   - **الف) بیلد با مقدار پیش‌فرض (توصیه‌شده):** به ایجنت بگو URL ورکر چیست تا `docs/` را با `VITE_TOKEN_WORKER_URL` دوباره بیلد و پوش کند.
   - **ب) بدون بیلد:** یک‌بار در کنسول مرورگر داشبورد این را اجرا کن:
     ```js
     localStorage.setItem('aibrain_token_worker_url', 'https://aibrain-drive-token.<SUBDOMAIN-تو>.workers.dev');
     location.reload();
     ```

7. **تست نهایی**
   یک مرورگر دیگر (یا حالت ناشناس + لاگین گوگل) باز کن → داشبورد را باز کن → فقط رمز را بزن ← باید بدون حتی یک کلیک دیگر، گوگل درایو متصل شود. ✅

## عیب‌یابی
| علامت | علت/راه‌حل |
|---|---|
| در `/auth` صفحه‌ی Forbidden | `key` را دقیقاً برابر `WORKER_KEY` گذاشته‌ای؟ |
| «Refresh Token دریافت نشد» | اول در `myaccount.google.com/permissions` دسترسی اپ را حذف کن، دوباره `/auth` را باز کن. |
| داشبورد می‌گوید «مجوز اتصال دائم ثبت نشده» (۴۰۹) | مرحله‌ی ۵ انجام نشده یا URL ورکر اشتباه است. |
| داشبورد می‌گوید کلید Worker نامعتبر است (۴۰۱) | `WORKER_KEY` را در Worker با مقدار دقیق مرحله‌ی ۳ تنظیم کن. |
| بعد از عوض‌کردن رمز داشبورد | `WORKER_KEY` جدید = `SHA-256("aibrain-worker:" + رمز جدید)` — در Worker به‌روز کن (اپ خودش با ورود دوباره مقدار جدید می‌سازد). |
| `refresh_failed` (۵۰۲) | Refresh Token باطل شده (مثلاً دسترسی از myaccount.google.com برداشته شده) — مرحله‌ی ۵ را تکرار کن. |

## امنیت (خلاصه)
- ریپو عمومی است؛ هیچ‌کدام از Secretها در آن نیست (فقط کد Worker که هیچ مقدار محرمانه‌ای ندارد).
- KV فقط با اکانت Cloudflare تو قابل خواندن است و محتوایش هم رمزنگاری‌شده است.
- اگر Passcode لو رفت: سریعاً رمز را عوض کن (بیلد `VITE_PASSCODE_HASH` جدید + آپدیت `WORKER_KEY` در Worker) و در `myaccount.google.com/permissions` دسترسی را Revoke کن.
