# AI-Brain Dashboard (`v1.0.0`)

داشبورد وب مینیمال، زنده و فارسی (با فونت **PeydaFaNum** و تم روشن/تیره) برای مدیریت پوشه `AI-Brain` در گوگل درایو، چت‌های آرنا، پروژه‌ها، حافظه، اسکیل‌ها و گالری تصاویر.

## امکانات کلیدی
- قفل ورود امنیتی با هش `SHA-256` (ذخیره‌شده در GitHub Actions Secrets — بدون وجود رمز خام در کد)
- اتصال مستقیم و زنده به Google Drive API v3 با **تمدید بی‌صدا (Silent Auto-Refresh)**
- صفحه بازیابی اتصال مجدد با راهنمای کامل در صورت انقضا پس از مدت طولانی
- مرورگر کامل پوشه‌ها و فایل‌ها، جستجوی آنی، ساخت پوشه، تغییر نام و انتقال به زباله‌دان
- نمایشگر و **ویرایشگر زنده Markdown** (ذخیره مستقیم روی گوگل درایو)
- گالری زنده تصاویر خصوصی (با Lightbox) + آپلود مستقیم Drag & Drop با نوار پیشرفت
- کپی ۱ کلیکی پرامپت شروع چت جدید آرنا (`BOOTSTRAP.md`)

## راه‌اندازی روی GitHub Pages
1. یک ریپازیتوری جدید در گیت‌هاب بسازید (مثلاً `ai-brain-dashboard`) و تمام این فایل‌ها را در شاخه `main` پوش کنید.
2. به مسیر `Settings → Secrets and variables → Actions` بروید:
   - در تب **Secrets** یک Secret جدید بسازید:
     - Name: `DASHBOARD_PASSCODE`
     - Secret: `<رمز اختصاصی خودتان>`
   - در تب **Variables** دو متغیر بسازید:
     - `GOOGLE_CLIENT_ID` = شناسه OAuth Web Client ID از Google Cloud
     - `DRIVE_ROOT_FOLDER_ID` = `1xbgHAgoAoJIWEoERxdXILgC6N861F8h6`
3. به مسیر `Settings → Pages` بروید و **Source** را روی **GitHub Actions** بگذارید.
4. از تب **Actions** ورک‌فلو `Deploy AI-Brain Dashboard to GitHub Pages` را اجرا کنید.
