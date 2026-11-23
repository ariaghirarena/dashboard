import React, { useState } from 'react';
import {
  ArrowUpLeft,
  BookMarked,
  Check,
  Cloud,
  Copy,
  FileCode2,
  FolderKanban,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  Layers,
  MessageSquareText,
  Sparkles,
  Terminal,
  Upload,
} from 'lucide-react';
import { AI_BRAIN_IDS, getArenaBootPrompt } from '../lib/config';
import { renderSafeMarkdown } from '../lib/markdown';
import type { DriveFile, DriveSessionState, NavSection } from '../types/drive';

interface OverviewViewProps {
  session: DriveSessionState;
  memoryPreview: string;
  rootItemsCount: number;
  onNavigate: (section: NavSection) => void;
  onOpenFileById: (file: DriveFile) => void;
  onConnectDrive: () => void;
  onOpenUpload: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  session,
  memoryPreview,
  rootItemsCount,
  onNavigate,
  onOpenFileById,
  onConnectDrive,
  onOpenUpload,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const bootPrompt = getArenaBootPrompt();

  async function handleCopyBootPrompt() {
    try {
      await navigator.clipboard.writeText(bootPrompt);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      // fallback ignored
    }
  }

  const quickShortcuts: {
    title: string;
    subtitle: string;
    section: NavSection;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { title: 'پروژه‌ها و فایل‌های نهایی', subtitle: '04-Projects + لینک نسخه‌های گیت‌هاب', section: 'projects', icon: FolderKanban },
    { title: 'چت‌های آرشیوشده آرنا', subtitle: '05-Chats + قرارداد تحویل جلسه', section: 'chats', icon: MessageSquareText },
    { title: 'حافظه، قوانین و اسکیل‌ها', subtitle: 'MEMORY.md + فرهنگ لغت + ۱۲ اسکیل', section: 'memory', icon: BookMarked },
    { title: 'رجیستری گیت‌هاب و .io', subtitle: 'لیست ریپوها و صفحات زنده', section: 'github', icon: GitBranch },
    { title: 'گالری تصاویر و برند', subtitle: 'عکس محصولات و دارایی‌های نهایی', section: 'gallery', icon: ImageIcon },
    { title: 'مرورگر کامل درایو', subtitle: `${rootItemsCount} آیتم در ریشه AI-Brain`, section: 'explorer', icon: Layers },
  ];

  const coreFiles: { label: string; id: string; desc: string }[] = [
    { label: 'BOOTSTRAP.md', id: AI_BRAIN_IDS.bootstrapFile, desc: 'کرنل اصلی بوت چت‌ها (نسخه ۱.۱)' },
    { label: 'MEMORY.md', id: AI_BRAIN_IDS.files.memoryIndex, desc: 'حافظه سریع (Hot Cache)' },
    { label: 'glossary.md', id: AI_BRAIN_IDS.files.glossary, desc: 'فرهنگ لغت و نام‌های مستعار' },
    { label: 'lessons-learned.md', id: AI_BRAIN_IDS.files.lessons, desc: 'بانک تجربه‌های موفق و ناموفق' },
    { label: '02-Skills/INDEX.md', id: AI_BRAIN_IDS.files.skillsIndex, desc: 'فهرست ۱۲ اسکیل آماده' },
    { label: 'github-registry.md', id: AI_BRAIN_IDS.files.githubRegistry, desc: 'دفترکل ریپوها و صفحات .io' },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Focal Hero Strip */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {session.status === 'connected'
                  ? `متصل به گوگل درایو${session.userEmail ? ` (${session.userEmail})` : ''}`
                  : 'حالت پیش‌نمایش فعال — آماده اتصال زنده به گوگل درایو'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-[1.75rem] font-black tracking-tight text-[var(--ink-primary)]">
              مرکز فرماندهی <span translate="no">AI-Brain</span>
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              همه پوشه‌های گوگل درایو، حافظه بلندمدت، چت‌های آرنا، عکس‌های محصولات و فایل‌های نهایی پروژه‌ها را به‌صورت زنده مرور، ویرایش، دانلود و آپلود کنید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {session.status !== 'connected' ? (
              <button
                type="button"
                onClick={onConnectDrive}
                className="h-10 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Cloud className="w-4 h-4" aria-hidden="true" />
                <span>اتصال زنده به گوگل درایو</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenUpload}
              className="h-10 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-sm font-bold text-[var(--ink-primary)] inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <Upload className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <span>آپلود مستقیم به درایو</span>
            </button>
          </div>
        </div>

        {/* One-Click Arena Boot Prompt Strip */}
        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <Terminal className="w-4 h-4 text-[var(--ink-muted)] shrink-0 mt-1" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--ink-primary)]">
                پرامپت آماده شروع هر چت جدید در <span translate="no">Arena.ai</span>
              </p>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5 break-words">
                {bootPrompt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyBootPrompt}
            className="h-9 px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--ink-primary)] inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--emerald)]" aria-hidden="true" />
                <span>کپی شد</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>کپی پرامپت شروع</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Featured Twin Gateways: Google Drive files + Skills */}
      <section aria-label="دسترسی اصلی" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('explorer')}
          className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/60 p-6 sm:p-7 text-start flex flex-col gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <FolderTree className="w-6 h-6" aria-hidden="true" />
            </div>
            <ArrowUpLeft
              className="w-5 h-5 text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition-colors"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--ink-primary)] group-hover:text-[var(--accent)] transition-colors">
              فایل‌های گوگل درایو
            </h2>
            <p className="mt-1 text-xs text-[var(--ink-secondary)] leading-6">
              مرور، جستجو، ویرایش، دانلود و آپلود همه‌ی پوشه‌ها و فایل‌های AI-Brain به‌صورت زنده و مستقیم.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('skills')}
          className="group rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-surface)] hover:border-[var(--accent)] p-6 sm:p-7 text-start flex flex-col gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>
            <ArrowUpLeft
              className="w-5 h-5 text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition-colors"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--ink-primary)] group-hover:text-[var(--accent)] transition-colors">
              اسکیل‌ها <span className="font-mono-ltr">(Skills)</span>
            </h2>
            <p className="mt-1 text-xs text-[var(--ink-secondary)] leading-6">
              ۱۲ اسکیل نصب‌شده در 02-Skills — روی هرکدام بزنید تا متن SKILL.md دیده شود و متن یا پرامپت فعال‌سازی را کپی کنید.
            </p>
          </div>
        </button>
      </section>

      {/* Navigation Matrix */}
      <section aria-label="دسترسی سریع بخش‌ها">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {quickShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.section}
                type="button"
                onClick={() => onNavigate(item.section)}
                className="group text-start rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50 p-4 flex items-start justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] group-hover:bg-[var(--accent-soft)] text-[var(--ink-secondary)] group-hover:text-[var(--accent)] flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[var(--ink-primary)] truncate">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[var(--ink-muted)] mt-1 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowUpLeft
                  className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--accent)] shrink-0 mt-1 transition-colors"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Memory + Core Files Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-sm font-bold">خلاصه زنده حافظه (MEMORY.md)</h2>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenFileById({
                  id: AI_BRAIN_IDS.files.memoryIndex,
                  name: 'MEMORY.md',
                  mimeType: 'text/markdown',
                })
              }
              className="text-xs font-bold text-[var(--accent)] hover:underline"
            >
              باز کردن و ویرایش
            </button>
          </div>
          <div className="p-5 max-h-[380px] overflow-y-auto">
            <div
              className="md-prose"
              dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(memoryPreview) }}
            />
          </div>
        </section>

        <section className="xl:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-sm font-bold">فایل‌های هسته سیستم</h2>
            </div>
            <span className="text-[11px] text-[var(--ink-muted)]">بازکردن با ۱ کلیک</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {coreFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  onOpenFileById({
                    id: f.id,
                    name: f.label,
                    mimeType: 'text/markdown',
                  })
                }
                className="w-full px-5 py-3 flex items-center justify-between gap-3 text-start hover:bg-[var(--bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--ink-primary)] font-mono-ltr text-right">
                    {f.label}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 truncate">
                    {f.desc}
                  </p>
                </div>
                <ArrowUpLeft className="w-4 h-4 text-[var(--ink-muted)] shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
