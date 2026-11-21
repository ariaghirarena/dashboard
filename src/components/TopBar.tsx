import React from 'react';
import {
  Cloud,
  CloudAlert,
  CloudOff,
  Lock,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Upload,
} from 'lucide-react';
import type { DriveSessionState } from '../types/drive';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  session: DriveSessionState;
  minutesLeft: number | null;
  onConnectDrive: () => void;
  onRefreshCurrent: () => void;
  onOpenUpload: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLock: () => void;
  onOpenMobileMenu: () => void;
  isRefreshing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  session,
  minutesLeft,
  onConnectDrive,
  onRefreshCurrent,
  onOpenUpload,
  isDark,
  onToggleTheme,
  onLock,
  onOpenMobileMenu,
  isRefreshing,
}) => {
  const isConnected = session.status === 'connected';
  const isExpired = session.status === 'expired' || session.status === 'error';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="باز کردن منو"
          className="lg:hidden h-9 w-9 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center shrink-0"
        >
          <Menu className="w-4 h-4" aria-hidden="true" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="relative flex-1 max-w-md min-w-0"
        >
          <label htmlFor="global-drive-search" className="sr-only">
            جستجو در فایل‌ها و حافظه AI-Brain
          </label>
          <Search
            className="w-4 h-4 text-[var(--ink-muted)] pointer-events-none absolute inset-y-0 my-auto start-3.5"
            aria-hidden="true"
          />
          <input
            id="global-drive-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجو در فایل‌ها، پروژه‌ها، چت‌ها و عکس‌ها…"
            className="w-full h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] ps-10 pe-3 text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)] transition-colors"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isConnected ? (
          <button
            type="button"
            onClick={onConnectDrive}
            title="وضعیت اتصال زنده گوگل درایو (تمدید خودکار فعال)"
            className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)] text-xs font-bold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
          >
            <Cloud className="w-4 h-4" aria-hidden="true" />
            <span>متصل به درایو</span>
            {minutesLeft !== null ? (
              <span className="tabular-nums opacity-80">({minutesLeft} دقیقه)</span>
            ) : null}
          </button>
        ) : isExpired ? (
          <button
            type="button"
            onClick={onConnectDrive}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--rose-soft)] text-[var(--rose)] text-xs font-bold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose)]"
          >
            <CloudAlert className="w-4 h-4" aria-hidden="true" />
            <span>اتصال مجدد درایو</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnectDrive}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <CloudOff className="w-4 h-4" aria-hidden="true" />
            <span>اتصال به گوگل درایو</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--ink-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Upload className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
          <span className="hidden md:inline">آپلود فایل</span>
        </button>

        <button
          type="button"
          onClick={onRefreshCurrent}
          aria-label="به‌روزرسانی لیست فایل‌ها"
          className="h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
          className="h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {isDark ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onLock}
          aria-label="قفل کردن داشبورد"
          title="قفل فوری داشبورد"
          className="h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)] hover:border-[var(--rose)]/30 text-[var(--ink-secondary)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose)]"
        >
          <Lock className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
