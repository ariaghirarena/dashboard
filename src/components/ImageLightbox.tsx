import React, { useEffect } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import { formatFileSize, formatPersianDate } from '../lib/googleDrive';
import type { DriveFile } from '../types/drive';

interface ImageLightboxProps {
  file: DriveFile | null;
  blobUrl: string | null;
  loading: boolean;
  onDownload: (file: DriveFile) => void;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  file,
  blobUrl,
  loading,
  onDownload,
  onClose,
}) => {
  useEffect(() => {
    if (!file) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
    >
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 text-white shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{file.name}</p>
          <p className="text-xs text-slate-400">
            {formatFileSize(file.size)} · {formatPersianDate(file.modifiedTime)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onDownload(file)}
            className="h-9 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>دانلود تصویر</span>
          </button>

          {file.webViewLink ? (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noreferrer"
              aria-label="باز کردن در گوگل درایو"
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن نمایشگر تصویر"
            className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {loading ? (
          <p className="text-sm text-slate-300">در حال بارگذاری با کیفیت اصلی…</p>
        ) : blobUrl ? (
          <img
            src={blobUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        ) : (
          <p className="text-sm text-rose-300">نمایش تصویر ممکن نشد. از دکمه دانلود استفاده کنید.</p>
        )}
      </div>
    </div>
  );
};
