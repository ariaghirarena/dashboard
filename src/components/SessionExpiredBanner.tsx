import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { DriveSessionState } from '../types/drive';

interface SessionExpiredBannerProps {
  session: DriveSessionState;
  hasClientId: boolean;
  onReconnect: (forceConsent?: boolean) => void;
  onOpenSettings: () => void;
}

export const SessionExpiredBanner: React.FC<SessionExpiredBannerProps> = ({
  session,
  hasClientId,
  onReconnect,
  onOpenSettings,
}) => {
  const [showSteps, setShowSteps] = useState(false);

  if (session.status !== 'expired' && session.status !== 'error') {
    return null;
  }

  return (
    <section
      role="alert"
      aria-live="polite"
      className="mb-5 rounded-2xl border border-[var(--rose)]/35 bg-[var(--bg-surface)] overflow-hidden shadow-sm"
    >
      <div className="p-4 sm:p-5 bg-[var(--rose-soft)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--rose)]/15 text-[var(--rose)] flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--ink-primary)]">
              اتصال زنده گوگل درایو خارج یا منقضی شده است
            </h2>
            <p className="text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
              {session.expiredReason ||
                session.lastError ||
                'به دلیل گذشت زمان طولانی یا پاک شدن کوکی مرورگر، نشست گوگل نیاز به اتصال مجدد دارد.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {hasClientId ? (
            <>
              <button
                type="button"
                onClick={() => onReconnect(false)}
                className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>اتصال مجدد فوری (۱ کلیک)</span>
              </button>
              <button
                type="button"
                onClick={() => onReconnect(true)}
                className="h-9 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--ink-primary)] transition-colors"
              >
                ورود با انتخاب اکانت
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              <span>تنظیم Google Client ID</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSteps((v) => !v)}
            className="h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center gap-1.5 transition-colors"
          >
            <span>راهنمای دقیق اتصال مجدد</span>
            {showSteps ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {showSteps ? (
        <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)] space-y-3 text-xs text-[var(--ink-secondary)] leading-relaxed">
          <div className="flex items-center gap-2 text-[var(--ink-primary)] font-bold">
            <ShieldCheck className="w-4 h-4 text-[var(--emerald)]" aria-hidden="true" />
            <span>مراحل دقیق بازیابی اتصال مستقیم از داخل همین داشبورد:</span>
          </div>
          <ol className="list-decimal ps-5 space-y-2">
            <li>
              ابتدا مطمئن شوید در همین مرورگر به اکانت گوگل خود (که پوشه{' '}
              <code className="font-mono-ltr px-1 rounded bg-[var(--bg-subtle)]">AI-Brain</code>{' '}
              در آن است) وارد شده‌اید و مسدودکننده پاپ‌آپ (Popup Blocker) روی این دامنه خاموش است.
            </li>
            <li>
              روی دکمه <strong>«اتصال مجدد فوری (۱ کلیک)»</strong> بزنید. اگر پنجره انتخاب اکانت باز شد، اکانت گوگل خود را انتخاب و دسترسی Drive را تایید کنید.
            </li>
            <li>
              اگر پیام <em>«Google hasn’t verified this app»</em> دیدید (در حالت Public / Production طبیعی است چون اپ شخصی شماست): روی{' '}
              <strong>Advanced</strong> و سپس <strong>Go to AI-Brain Dashboard (unsafe)</strong> و در نهایت <strong>Continue</strong> کلیک کنید.
            </li>
            <li>
              اگر خطای <code className="font-mono-ltr">redirect_uri_mismatch</code> یا{' '}
              <code className="font-mono-ltr">origin_mismatch</code> دیدید، در کنسول گوگل کلود بخش{' '}
              <code className="font-mono-ltr">Credentials → OAuth 2.0 Client ID</code> مطمئن شوید آدرس دقیق فعلی شما (
              <code className="font-mono-ltr px-1 rounded bg-[var(--bg-subtle)]">
                {typeof window !== 'undefined' ? window.location.origin : 'https://USERNAME.github.io'}
              </code>
              ) داخل <strong>Authorized JavaScript origins</strong> ثبت شده باشد.
            </li>
          </ol>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-[var(--accent)] hover:underline"
            >
              <span>باز کردن Google Cloud Credentials</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onOpenSettings}
              className="font-bold text-[var(--ink-primary)] hover:text-[var(--accent)] transition-colors"
            >
              بررسی Client ID و تنظیمات اتصال
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
