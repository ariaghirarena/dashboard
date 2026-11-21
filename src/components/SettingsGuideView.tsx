import React, { useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  ExternalLink,
  KeyRound,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  getEffectiveGoogleClientId,
  getEffectiveRootFolderId,
  STORAGE_KEYS,
} from '../lib/config';
import type { DriveSessionState } from '../types/drive';

interface SettingsGuideViewProps {
  session: DriveSessionState;
  minutesLeft: number | null;
  onSaveConfig: (clientId: string, rootFolderId: string) => void;
  onConnectDrive: (forceConsent?: boolean) => void;
  onSilentRefresh: () => void;
  onDisconnectDrive: () => void;
}

export const SettingsGuideView: React.FC<SettingsGuideViewProps> = ({
  session,
  minutesLeft,
  onSaveConfig,
  onConnectDrive,
  onSilentRefresh,
  onDisconnectDrive,
}) => {
  const [clientId, setClientId] = useState(getEffectiveGoogleClientId());
  const [rootFolderId, setRootFolderId] = useState(getEffectiveRootFolderId());
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://USERNAME.github.io';

  async function copyOrigin() {
    try {
      await navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      window.setTimeout(() => setCopiedOrigin(false), 1800);
    } catch {
      // ignore
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEYS.googleClientId, clientId.trim());
      localStorage.setItem(STORAGE_KEYS.rootFolderId, rootFolderId.trim());
    } catch {
      // ignore
    }
    onSaveConfig(clientId.trim(), rootFolderId.trim());
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-[var(--ink-primary)]">
          تنظیمات اتصال گوگل درایو و راهنمای دائمی ماندن لاگین
        </h1>
        <p className="text-xs text-[var(--ink-secondary)] mt-1">
          تنظیم Google OAuth 2.0 (حالت Public / Production)، تمدید خودکار نشست در پس‌زمینه و بازیابی فوری اتصال
        </p>
      </div>

      {/* Live Connection Status Card */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                session.status === 'connected'
                  ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]'
                  : 'bg-[var(--accent-soft)] text-[var(--accent)]'
              }`}
            >
              <Cloud className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-black">
                {session.status === 'connected'
                  ? 'اتصال زنده گوگل درایو برقرار است'
                  : session.status === 'expired'
                    ? 'نشست منقضی شده — آماده اتصال مجدد'
                    : 'حالت پیش‌نمایش (هنوز متصل نشده)'}
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                {session.userEmail
                  ? `اکانت متصل: ${session.userEmail}${minutesLeft !== null ? ` · تمدید خودکار تا ${minutesLeft} دقیقه دیگر` : ''}`
                  : 'تمدید خودکار Silent Refresh هر ۵۰ دقیقه در پس‌زمینه فعال است.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onConnectDrive(false)}
              className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{session.status === 'connected' ? 'اتصال مجدد' : 'اتصال به گوگل درایو'}</span>
            </button>

            {session.status === 'connected' ? (
              <>
                <button
                  type="button"
                  onClick={onSilentRefresh}
                  className="h-9 px-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-xs font-bold"
                >
                  تمدید بی‌صدا (Silent)
                </button>
                <button
                  type="button"
                  onClick={onDisconnectDrive}
                  className="h-9 px-3 rounded-xl border border-[var(--rose)]/30 text-[var(--rose)] hover:bg-[var(--rose-soft)] text-xs font-bold inline-flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>قطع اتصال</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Credentials Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-sm font-bold">تنظیمات Client ID و پوشه ریشه</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="google-client-id"
              className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5"
            >
              Google OAuth 2.0 Web Client ID
            </label>
            <input
              id="google-client-id"
              type="text"
              dir="ltr"
              spellCheck={false}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="1234567890-xxxxxxxx.apps.googleusercontent.com"
              className="w-full h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-xs font-mono-ltr text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">
              این مقدار را هم می‌توانید در GitHub Actions Variable با نام{' '}
              <code className="font-mono-ltr">GOOGLE_CLIENT_ID</code> ذخیره کنید و هم همینجا تست کنید.
            </p>
          </div>

          <div>
            <label
              htmlFor="drive-root-id"
              className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5"
            >
              شناسه پوشه ریشه AI-Brain در گوگل درایو
            </label>
            <input
              id="drive-root-id"
              type="text"
              dir="ltr"
              spellCheck={false}
              value={rootFolderId}
              onChange={(e) => setRootFolderId(e.target.value)}
              className="w-full h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-xs font-mono-ltr text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
            <span>آدرس Origin فعلی برای ثبت در Google Cloud:</span>
            <code className="font-mono-ltr px-2 py-1 rounded-lg bg-[var(--bg-subtle)] text-[var(--ink-primary)]">
              {currentOrigin}
            </code>
            <button
              type="button"
              onClick={copyOrigin}
              aria-label="کپی آدرس Origin"
              className="h-7 w-7 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--bg-subtle)]"
            >
              {copiedOrigin ? (
                <Check className="w-3.5 h-3.5 text-[var(--emerald)]" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ذخیره تنظیمات</span>
          </button>
        </div>
      </form>

      {/* Complete Built-in Reconnect & Public Mode Guide */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 text-xs text-[var(--ink-secondary)] leading-relaxed">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--ink-primary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--emerald)]" aria-hidden="true" />
          <span>راهنمای تنظیم Google Cloud روی حالت Public (In Production) تا لاگ‌اوت ۷ روزه نداشته باشید</span>
        </div>

        <ol className="list-decimal ps-5 space-y-2.5">
          <li>
            وارد{' '}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>{' '}
            شوید، یک پروژه جدید (مثلاً <code className="font-mono-ltr">AI-Brain-Dashboard</code>) بسازید و از بخش{' '}
            <strong>APIs &amp; Services → Library</strong> سرویس <strong>Google Drive API</strong> را فعال (Enable) کنید.
          </li>
          <li>
            به بخش <strong>Google Auth Platform → Audience</strong> (یا <strong>OAuth consent screen</strong>) بروید، نوع کاربر را{' '}
            <strong>External</strong> انتخاب کنید و سپس روی دکمه <strong>Publish App</strong> کلیک کنید تا وضعیت از{' '}
            <code className="font-mono-ltr">Testing</code> به <code className="font-mono-ltr">In production (Public)</code> تغییر کند (این کار محدودیت انقضای ۷ روزه را برمی‌دارد).
          </li>
          <li>
            در بخش <strong>Clients → Create OAuth client ID</strong>، نوع را <strong>Web application</strong> بزنید و در قسمت{' '}
            <strong>Authorized JavaScript origins</strong> دقیقاً آدرس گیت‌هاب پیج خود را اضافه کنید (مثلاً{' '}
            <code className="font-mono-ltr">https://YOUR_USERNAME.github.io</code> — بدون اسلش انتهایی).
          </li>
          <li>
            مقدار <strong>Client ID</strong> را کپی کنید و در ریپازیتوری گیت‌هاب در مسیر{' '}
            <code className="font-mono-ltr">Settings → Secrets and variables → Actions → Variables</code> با نام{' '}
            <code className="font-mono-ltr">GOOGLE_CLIENT_ID</code> ذخیره کنید.
          </li>
          <li>
            <strong>در اولین اتصال روی حالت Public:</strong> چون اپلیکیشن شخصی شماست و برای عموم مردم تاییدیه گوگل نگرفته‌اید، گوگل یک صفحه هشدار نمایش می‌دهد؛ کافی است روی{' '}
            <strong>Advanced</strong> → <strong>Go to AI-Brain Dashboard (unsafe)</strong> → <strong>Continue</strong> بزنید. پس از آن داشبورد به‌طور خودکار در پس‌زمینه نشست را تمدید (Silent Refresh) می‌کند!
          </li>
        </ol>
      </section>
    </div>
  );
};
