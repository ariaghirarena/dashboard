import React, { useEffect, useState } from 'react';
import {
  Check,
  Columns2,
  Copy,
  Download,
  Edit3,
  Eye,
  Save,
  X,
} from 'lucide-react';
import { renderSafeMarkdown } from '../lib/markdown';
import type { DriveFile } from '../types/drive';

interface MarkdownModalProps {
  file: DriveFile | null;
  initialContent: string;
  loading: boolean;
  canSave: boolean;
  onSave: (file: DriveFile, newContent: string) => Promise<void>;
  onDownload: (file: DriveFile) => void;
  onClose: () => void;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({
  file,
  initialContent,
  loading,
  canSave,
  onSave,
  onDownload,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'preview' | 'edit' | 'split'>('preview');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(initialContent);
    setMode('preview');
  }, [initialContent, file?.id]);

  const isDirty = content !== initialContent;

  useEffect(() => {
    if (!file) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!isDirty || window.confirm('تغییرات ذخیره نشده‌اند. پنجره بسته شود؟')) {
          onClose();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && canSave && isDirty) {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!file) return null;

  async function handleSave() {
    if (!file || !canSave) return;
    setSaving(true);
    try {
      await onSave(file, content);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/60 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={file.name}
        className="w-full max-w-5xl h-[90dvh] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl flex flex-col overflow-hidden overscroll-contain"
      >
        {/* Modal Header */}
        <header className="px-4 sm:px-5 py-3 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-black text-[var(--ink-primary)] truncate font-mono-ltr text-right">
              {file.name}
            </h2>
            <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
              {isDirty ? 'تغییرات ذخیره نشده دارید' : 'ذخیره‌شده و همگام با گوگل درایو'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="حالت نمایش"
              className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-0.5"
            >
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                  mode === 'preview'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>نمایش</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                  mode === 'edit'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ویرایش</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('split')}
                className={`hidden md:inline-flex h-8 px-2.5 rounded-lg text-xs font-bold items-center gap-1 transition-colors ${
                  mode === 'split'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>دوتایی</span>
              </button>
            </div>

            {canSave ? (
              <button
                type="button"
                disabled={!isDirty || saving}
                onClick={handleSave}
                className="h-8 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-45 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{saving ? 'در حال ذخیره…' : 'ذخیره در درایو'}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleCopy}
              aria-label="کپی متن فایل"
              className="h-8 w-8 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[var(--emerald)]" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onDownload(file)}
              aria-label="دانلود فایل"
              className="h-8 w-8 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isDirty || window.confirm('تغییرات ذخیره نشده‌اند. پنجره بسته شود؟')) {
                  onClose();
                }
              }}
              aria-label="بستن پنجره"
              className="h-8 w-8 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--rose)] flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--ink-muted)]">
              در حال دریافت متن فایل…
            </div>
          ) : (
            <>
              {mode === 'edit' || mode === 'split' ? (
                <div
                  className={`${
                    mode === 'split' ? 'w-1/2 border-e border-[var(--border-subtle)]' : 'w-full'
                  } h-full flex flex-col`}
                >
                  <label htmlFor="markdown-editor-textarea" className="sr-only">
                    ویرایشگر متن فایل
                  </label>
                  <textarea
                    id="markdown-editor-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    dir="auto"
                    spellCheck={false}
                    className="w-full h-full resize-none bg-[var(--bg-canvas)] text-[var(--ink-primary)] p-5 font-mono-ltr text-[13px] leading-7 focus:outline-none"
                  />
                </div>
              ) : null}

              {mode === 'preview' || mode === 'split' ? (
                <div
                  className={`${
                    mode === 'split' ? 'w-1/2' : 'w-full'
                  } h-full overflow-y-auto p-6 sm:p-8`}
                >
                  <div
                    className="md-prose mx-auto"
                    dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(content) }}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
