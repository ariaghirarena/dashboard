import React, { useState } from 'react';
import {
  ChevronLeft,
  Download,
  ExternalLink,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { DRIVE_FOLDER_MIME } from '../lib/config';
import {
  formatFileSize,
  formatPersianDate,
  isImageFile,
  isTextEditableFile,
} from '../lib/googleDrive';
import type { BreadcrumbItem, DriveFile } from '../types/drive';

interface ExplorerViewProps {
  title: string;
  subtitle: string;
  files: DriveFile[];
  breadcrumbs: BreadcrumbItem[];
  loading: boolean;
  isLiveConnected: boolean;
  onOpenFolder: (folder: DriveFile) => void;
  onBreadcrumbClick: (index: number) => void;
  onOpenFile: (file: DriveFile) => void;
  onDownloadFile: (file: DriveFile) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFile: (file: DriveFile, newName: string) => Promise<void>;
  onTrashFile: (file: DriveFile) => Promise<void>;
  onDropFiles: (fileList: FileList) => void;
  onOpenUploadModal: () => void;
}

function getFileIcon(file: DriveFile) {
  if (file.mimeType === DRIVE_FOLDER_MIME) {
    return { Icon: Folder, color: 'text-[var(--accent)] bg-[var(--accent-soft)]' };
  }
  if (isImageFile(file)) {
    return { Icon: FileImage, color: 'text-[var(--emerald)] bg-[var(--emerald-soft)]' };
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.tar.gz')) {
    return { Icon: FileArchive, color: 'text-[var(--amber)] bg-[var(--amber-soft)]' };
  }
  if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || file.mimeType.includes('spreadsheet')) {
    return { Icon: FileSpreadsheet, color: 'text-[var(--emerald)] bg-[var(--emerald-soft)]' };
  }
  if (
    lower.endsWith('.md') ||
    lower.endsWith('.json') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.tsx') ||
    lower.endsWith('.js') ||
    lower.endsWith('.php')
  ) {
    return { Icon: FileCode2, color: 'text-[var(--accent)] bg-[var(--accent-soft)]' };
  }
  return { Icon: FileText, color: 'text-[var(--ink-secondary)] bg-[var(--bg-subtle)]' };
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  title,
  subtitle,
  files,
  breadcrumbs,
  loading,
  isLiveConnected,
  onOpenFolder,
  onBreadcrumbClick,
  onOpenFile,
  onDownloadFile,
  onCreateFolder,
  onRenameFile,
  onTrashFile,
  onDropFiles,
  onOpenUploadModal,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmTrashFile, setConfirmTrashFile] = useState<DriveFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleCreateFolderSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    await onCreateFolder(trimmed);
    setNewFolderName('');
    setCreatingFolder(false);
  }

  async function handleRenameSubmit(file: DriveFile) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === file.name) {
      setRenamingId(null);
      return;
    }
    await onRenameFile(file, trimmed);
    setRenamingId(null);
  }

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onDropFiles(e.dataTransfer.files);
        }
      }}
    >
      {/* Header + Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--ink-primary)]">{title}</h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCreatingFolder((v) => !v)}
            disabled={!isLiveConnected}
            title={isLiveConnected ? 'ساخت پوشه جدید در این مسیر' : 'ابتدا به گوگل درایو وصل شوید'}
            className="h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] disabled:opacity-45 text-xs font-bold text-[var(--ink-primary)] inline-flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>پوشه جدید</span>
          </button>

          <button
            type="button"
            onClick={onOpenUploadModal}
            className="h-9 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>آپلود در این پوشه</span>
          </button>

          <div
            role="group"
            aria-label="نحوه نمایش"
            className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5"
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="نمایش لیستی"
              aria-pressed={viewMode === 'list'}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="نمایش کارتی"
              aria-pressed={viewMode === 'grid'}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 ? (
        <nav
          aria-label="مسیر پوشه فعلی"
          className="flex flex-wrap items-center gap-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.id}-${idx}`}>
                {idx > 0 ? (
                  <ChevronLeft className="w-3.5 h-3.5 text-[var(--ink-muted)]" aria-hidden="true" />
                ) : null}
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => onBreadcrumbClick(idx)}
                  className={`px-1.5 py-0.5 rounded-md transition-colors ${
                    isLast
                      ? 'font-bold text-[var(--ink-primary)] cursor-default'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      ) : null}

      {/* Inline Create Folder Bar */}
      {creatingFolder ? (
        <form
          onSubmit={handleCreateFolderSubmit}
          className="rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-surface)] p-3 flex flex-wrap items-center gap-2.5"
        >
          <FolderPlus className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
          <label htmlFor="new-folder-input" className="sr-only">
            نام پوشه جدید
          </label>
          <input
            id="new-folder-input"
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="نام پوشه جدید (مثلاً seolity-v2)…"
            className="flex-1 min-w-[200px] h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          />
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-colors"
          >
            ساخت پوشه
          </button>
          <button
            type="button"
            onClick={() => setCreatingFolder(false)}
            className="h-9 px-3 rounded-lg border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
          >
            انصراف
          </button>
        </form>
      ) : null}

      {/* Drop Zone Highlight */}
      {isDragging ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)] p-8 text-center">
          <Upload className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-bold text-[var(--accent)]">
            فایل‌ها را اینجا رها کنید تا مستقیم در همین پوشه گوگل درایو آپلود شوند
          </p>
        </div>
      ) : null}

      {/* Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--ink-muted)]">
          در حال دریافت زنده فایل‌ها از گوگل درایو…
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] text-[var(--ink-muted)] flex items-center justify-center mx-auto">
            <Folder className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--ink-primary)]">این پوشه در حال حاضر خالی است</p>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              می‌توانید فایل‌ها را اینجا بکشید و رها کنید یا پوشه جدید بسازید.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>آپلود اولین فایل</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {files.map((file) => {
              const isFolder = file.mimeType === DRIVE_FOLDER_MIME;
              const { Icon, color } = getFileIcon(file);
              const isRenaming = renamingId === file.id;

              return (
                <div
                  key={file.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-subtle)]/65 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>

                    {isRenaming ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenameSubmit(file);
                        }}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8 flex-1 min-w-0 rounded-lg border border-[var(--accent)] bg-[var(--bg-canvas)] px-2.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="h-8 px-2.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold"
                        >
                          ذخیره
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="h-8 px-2 rounded-lg text-xs text-[var(--ink-secondary)]"
                        >
                          لغو
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (isFolder ? onOpenFolder(file) : onOpenFile(file))}
                        className="min-w-0 flex-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-md"
                      >
                        <p className="text-sm font-bold text-[var(--ink-primary)] truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 truncate">
                          {isFolder
                            ? file.description || 'پوشه'
                            : `${formatFileSize(file.size)} · ${formatPersianDate(file.modifiedTime)}`}
                        </p>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isFolder ? (
                      <button
                        type="button"
                        onClick={() => onDownloadFile(file)}
                        aria-label={`دانلود ${file.name}`}
                        title="دانلود فایل"
                        className="h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] flex items-center justify-center transition-colors"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" />
                      </button>
                    ) : null}

                    {file.webViewLink ? (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`باز کردن ${file.name} در گوگل درایو`}
                        title="باز کردن در گوگل درایو"
                        className="h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    ) : null}

                    {isLiveConnected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingId(file.id);
                            setRenameValue(file.name);
                          }}
                          aria-label={`تغییر نام ${file.name}`}
                          title="تغییر نام"
                          className="h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmTrashFile(file)}
                          aria-label={`انتقال ${file.name} به زباله‌دان`}
                          title="انتقال به زباله‌دان"
                          className="h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--rose)] hover:bg-[var(--rose-soft)] flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {files.map((file) => {
            const isFolder = file.mimeType === DRIVE_FOLDER_MIME;
            const { Icon, color } = getFileIcon(file);
            return (
              <div
                key={file.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50 p-4 flex flex-col justify-between gap-3 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => (isFolder ? onOpenFolder(file) : onOpenFile(file))}
                  className="text-start space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-xl"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--ink-primary)] truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-1 truncate">
                      {isFolder
                        ? 'پوشه'
                        : isTextEditableFile(file)
                          ? 'فایل متنی / Markdown'
                          : formatFileSize(file.size)}
                    </p>
                  </div>
                </button>

                <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-subtle)]">
                  <span className="text-[11px] text-[var(--ink-muted)] tabular-nums">
                    {formatPersianDate(file.modifiedTime)}
                  </span>
                  <div className="flex items-center gap-1">
                    {!isFolder ? (
                      <button
                        type="button"
                        onClick={() => onDownloadFile(file)}
                        aria-label={`دانلود ${file.name}`}
                        className="h-7 w-7 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] flex items-center justify-center"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                    {isLiveConnected ? (
                      <button
                        type="button"
                        onClick={() => setConfirmTrashFile(file)}
                        aria-label={`حذف ${file.name}`}
                        className="h-7 w-7 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--rose)] hover:bg-[var(--rose-soft)] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safe Trash Confirmation Dialog */}
      {confirmTrashFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xl space-y-4 overscroll-contain"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--rose-soft)] text-[var(--rose)] flex items-center justify-center">
              <Trash2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--ink-primary)]">
                انتقال به زباله‌دان گوگل درایو؟
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
                فایل <strong className="text-[var(--ink-primary)]">{confirmTrashFile.name}</strong> به سطل زباله گوگل درایو منتقل می‌شود و تا ۳۰ روز قابل بازیابی است.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmTrashFile(null)}
                className="h-9 px-4 rounded-xl border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmTrashFile;
                  setConfirmTrashFile(null);
                  await onTrashFile(target);
                }}
                className="h-9 px-4 rounded-xl bg-[var(--rose)] hover:opacity-90 text-white text-xs font-bold transition-opacity"
              >
                انتقال به زباله‌دان
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
