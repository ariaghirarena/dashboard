import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import type { ToastMessage } from '../types/drive';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastStack: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 start-5 z-50 flex flex-col gap-2.5 w-[min(360px,calc(100vw-2.5rem))]"
    >
      {toasts.map((t) => {
        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
              ? AlertCircle
              : t.type === 'warning'
                ? TriangleAlert
                : Info;
        const tone =
          t.type === 'success'
            ? 'text-[var(--emerald)]'
            : t.type === 'error'
              ? 'text-[var(--rose)]'
              : t.type === 'warning'
                ? 'text-[var(--amber)]'
                : 'text-[var(--accent)]';

        return (
          <div
            key={t.id}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shadow-lg flex items-start gap-3"
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${tone}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--ink-primary)]">{t.title}</p>
              {t.description ? (
                <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5 leading-relaxed">
                  {t.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="بستن اعلان"
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-0.5"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
