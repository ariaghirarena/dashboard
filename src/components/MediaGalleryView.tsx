import React, { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Maximize2, Upload } from 'lucide-react';
import { fetchDriveFileBlob, formatFileSize, formatPersianDate } from '../lib/googleDrive';
import type { DriveFile } from '../types/drive';

interface MediaGalleryViewProps {
  images: DriveFile[];
  accessToken: string | null;
  loading: boolean;
  onOpenImage: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onOpenUpload: () => void;
}

const AuthThumbnail: React.FC<{ file: DriveFile; accessToken: string | null }> = ({
  file,
  accessToken,
}) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    let createdUrl: string | null = null;

    fetchDriveFileBlob(accessToken, file.id)
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setSrc(createdUrl);
      })
      .catch(() => {
        // fallback icon
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [accessToken, file.id]);

  if (!src) {
    return (
      <div className="w-full aspect-[4/3] bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--ink-muted)]">
        <ImageIcon className="w-7 h-7 opacity-60" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={file.name}
      loading="lazy"
      width={400}
      height={300}
      className="w-full aspect-[4/3] object-cover bg-[var(--bg-subtle)]"
    />
  );
};

export const MediaGalleryView: React.FC<MediaGalleryViewProps> = ({
  images,
  accessToken,
  loading,
  onOpenImage,
  onDownload,
  onOpenUpload,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--ink-primary)]">
            گالری تصاویر و دارایی‌های بصری
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            پیش‌نمایش زنده عکس‌های محصولات، لوگوها و تصاویر ذخیره‌شده در گوگل درایو شما
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>آپلود تصویر جدید</span>
        </button>
      </div>

      {!accessToken ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-[var(--ink-primary)]">
            برای مشاهده تصاویر خصوصی، به گوگل درایو وصل شوید
          </p>
          <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            تصاویر شما به‌صورت امن و مستقیم با توکن احراز هویت در مرورگر بارگذاری می‌شوند و هیچ‌جا به صورت عمومی منتشر نمی‌شوند.
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--ink-muted)]">
          در حال بارگذاری گالری تصاویر…
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] text-[var(--ink-muted)] flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--ink-primary)]">
              هنوز تصویری در گوگل درایو یافت نشد
            </p>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              می‌توانید عکس‌های محصولات (مثلاً افزونه سئولیتی) را مستقیم در پوشه 06-Global-Assets آپلود کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenUpload}
            className="h-9 px-4 rounded-xl bg-[var(--accent)] text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>آپلود اولین تصویر</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <article
              key={img.id}
              className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => onOpenImage(img)}
                className="relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <AuthThumbnail file={img} accessToken={accessToken} />
                <span className="absolute top-2.5 end-2.5 h-8 w-8 rounded-lg bg-slate-950/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </button>

              <div className="p-3.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--ink-primary)] truncate">
                    {img.name}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 tabular-nums">
                    {formatFileSize(img.size)} · {formatPersianDate(img.modifiedTime)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDownload(img)}
                  aria-label={`دانلود ${img.name}`}
                  className="h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] flex items-center justify-center shrink-0 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
