import React from 'react';
import {
  BookMarked,
  BrainCircuit,
  FolderKanban,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/drive';

interface SidebarProps {
  active: NavSection;
  onSelect: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  connectionBadge: 'connected' | 'demo' | 'expired' | 'connecting' | 'error';
}

interface NavItem {
  id: NavSection;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_ITEMS: NavItem[] = [
  { id: 'overview', label: 'نمای کلی', hint: 'آمار و شروع سریع', icon: LayoutDashboard },
  { id: 'explorer', label: 'مرورگر درایو', hint: 'همه پوشه‌ها و فایل‌ها', icon: FolderTree },
  { id: 'skills', label: 'اسکیل‌ها', hint: 'مهارت‌های نصب‌شده و افزودن اسکیل', icon: Sparkles },
  { id: 'projects', label: 'پروژه‌ها و نهایی‌ها', hint: 'آخرین خروجی و نسخه‌ها', icon: FolderKanban },
  { id: 'chats', label: 'چت‌های آرنا', hint: 'آرشیو و خلاصه گفتگوها', icon: MessageSquareText },
  { id: 'memory', label: 'حافظه و اسکیل‌ها', hint: 'مموری، قوانین و مهارت‌ها', icon: BookMarked },
  { id: 'gallery', label: 'گالری تصاویر', hint: 'عکس محصولات و برند', icon: ImageIcon },
  { id: 'github', label: 'رجیستری گیت‌هاب', hint: 'ریپوها و صفحات .io', icon: GitBranch },
];

export const Sidebar: React.FC<SidebarProps> = ({
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
  connectionBadge,
}) => {
  const navContent = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-e border-[var(--border-subtle)]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight truncate" translate="no">
              AI-Brain OS
            </p>
            <p className="text-[11px] text-[var(--ink-muted)] truncate">
              مرکز کنترل هوشمند
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="بستن منو"
          className="lg:hidden h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="منوی اصلی داشبورد" className="flex-1 overflow-y-auto p-3 space-y-1">
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-bold'
                  : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-tight truncate">{item.label}</div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-[var(--accent)]/80 font-medium' : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {item.hint}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--border-subtle)] space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            onSelect('settings');
            onCloseMobile();
          }}
          aria-current={active === 'settings' ? 'page' : undefined}
          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            active === 'settings'
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-bold'
              : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Settings className="w-[18px] h-[18px]" aria-hidden="true" />
            <span>تنظیمات و اتصال</span>
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              connectionBadge === 'connected'
                ? 'bg-[var(--emerald)]'
                : connectionBadge === 'expired' || connectionBadge === 'error'
                  ? 'bg-[var(--rose)]'
                  : 'bg-[var(--amber)]'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-dvh sticky top-0">
        {navContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 overscroll-contain">
            {navContent}
          </aside>
        </div>
      ) : null}
    </>
  );
};
