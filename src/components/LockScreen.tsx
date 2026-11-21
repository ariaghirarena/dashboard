import React, { useState } from 'react';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import {
  getConfiguredPasscodeHash,
  persistUnlockState,
  verifyPasscode,
} from '../lib/auth';

interface LockScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onUnlocked: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isDark,
  onToggleTheme,
  onUnlocked,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [remember, setRemember] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasConfiguredHash = Boolean(getConfiguredPasscodeHash());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('لطفاً رمز عبور داشبورد را وارد کنید.');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const ok = await verifyPasscode(passcode);
      if (!ok) {
        setError('رمز عبور نادرست است. دوباره بررسی کنید.');
        return;
      }
      persistUnlockState(remember);
      onUnlocked();
    } catch {
      setError('مرورگر شما از Web Crypto برای بررسی امن رمز پشتیبانی نمی‌کند (نیاز به HTTPS است).');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[var(--bg-canvas)] text-[var(--ink-primary)] px-4 py-6">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" translate="no">
              AI-Brain
            </p>
            <p className="text-xs text-[var(--ink-muted)]">مرکز کنترل شخصی</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
          className="h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--border-strong)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {isDark ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </header>

      <main className="w-full max-w-md mx-auto my-8">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 sm:p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-5">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>

          <h1 className="text-xl font-black tracking-tight mb-1.5">
            ورود به داشبورد <span translate="no">AI-Brain</span>
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mb-6">
            برای مشاهده فایل‌ها، حافظه، پروژه‌ها و چت‌های آرنا، رمز امنیتی اختصاصی خود را وارد کنید.
          </p>

          {!hasConfiguredHash ? (
            <div className="rounded-xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] p-4 text-sm text-[var(--ink-primary)] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[var(--amber)]">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>راز رمز عبور در GitHub تنظیم نشده است</span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                در ریپازیتوری گیت‌هاب به مسیر{' '}
                <code className="font-mono-ltr px-1 py-0.5 rounded bg-[var(--bg-surface)]">
                  Settings → Secrets and variables → Actions
                </code>{' '}
                بروید، یک Secret با نام{' '}
                <code className="font-mono-ltr px-1 py-0.5 rounded bg-[var(--bg-surface)]">
                  DASHBOARD_PASSCODE
                </code>{' '}
                بسازید و دوباره دیپلوی کنید.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="dashboard-passcode"
                  className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5"
                >
                  رمز امنیتی داشبورد
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-[var(--ink-muted)]">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="dashboard-passcode"
                    name="passcode"
                    type={showPasscode ? 'text' : 'password'}
                    autoComplete="current-password"
                    spellCheck={false}
                    dir="ltr"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="رمز اختصاصی خود را وارد کنید…"
                    className="w-full h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] ps-10 pe-11 text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] placeholder:text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode((v) => !v)}
                    aria-label={showPasscode ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                  >
                    {showPasscode ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[var(--ink-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
                />
                <span>باز ماندن قفل در این مرورگر تا ۱۴ روز</span>
              </label>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--rose)]"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={checking}
                className="w-full h-11 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>{checking ? 'در حال بررسی…' : 'باز کردن داشبورد'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto flex items-center justify-center gap-2 text-xs text-[var(--ink-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--emerald)]" aria-hidden="true" />
        <span>تایید رمز به‌صورت محلی با SHA-256 و اتصال مستقیم رمزنگاری‌شده به Google Drive</span>
      </footer>
    </div>
  );
};
