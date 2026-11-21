import React, { useRef, useState } from 'react';
import { CheckCircle2, CloudUpload, FileUp, Folder, X } from 'lucide-react';
import { AI_BRAIN_IDS } from '../lib/config';

interface UploadModalProps {
  open: boolean;
  isConnected: boolean;
  defaultFolderId: string;
  defaultFolderName: string;
  onUploadFiles: (
    files: File[],
    targetFolderId: string,
    onProgress: (index: number, pct: number) => void
  ) => Promise<void>;
  onConnectDrive: () => void;
  onClose: () => void;
}

const QUICK_DESTINATIONS = [
  { id: AI_BRAIN_IDS.folders.assets, label: '06-Global-Assets (تصاویر و برند)' },
  { id: AI_BRAIN_IDS.folders.projects, label: '04-Projects (فایل‌های پروژه)' },
  { id: AI_BRAIN_IDS.folders.chats, label: '05-Chats (آرشیو چت‌ها)' },
  { id: AI_BRAIN_IDS.folders.skills, label: '02-Skills (اسکیل‌ها)' },
  { id: AI_BRAIN_IDS.rootFolder, label: 'AI-Brain (ریشه اصلی)' },
];

export const UploadModal: React.FC<UploadModalProps> = ({
  open,
  isConnected,
  defaultFolderId,
  defaultFolderName,
  onUploadFiles,
  onConnectDrive,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFolderId, setTargetFolderId] = useState(defaultFolderId);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [dragging, setDragging] = useState(false);

  React.useEffect(() => {
    setTargetFolderId(defaultFolderId);
  }, [defaultFolderId, open]);

  if (!open) return null;

  function addFiles(list: FileList | null) {
    if (!list) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function handleStartUpload() {
    if (!selectedFiles.length || !isConnected) return;
    setUploading(true);
    setProgressMap({});
    try {
      await onUploadFiles(selectedFiles, targetFolderId, (index, pct) => {
        setProgressMap((prev) => ({ ...prev, [index]: pct }));
      });
      setSelectedFiles([]);
      onClose();
    } finally {
      setUploading(false);
    }
  }

  const folderOptions = QUICK_DESTINATIONS.some((d) => d.id === defaultFolderId)
    ? QUICK_DESTINATIONS
    : [{ id: defaultFolderId, label: `پوشه فعلی (${defaultFolderName})` }, ...QUICK_DESTINATIONS];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="آپلود مستقیم به گوگل درایو"
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden overscroll-contain"
      >
        <header className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CloudUpload className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-sm font-black">آپلود مستقیم فایل به گوگل درایو</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="h-8 w-8 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {!isConnected ? (
            <div className="rounded-xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] p-4 space-y-3 text-xs">
              <p className="font-bold text-[var(--ink-primary)]">
                برای آپلود واقعی فایل، ابتدا به گوگل درایو متصل شوید.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConnectDrive();
                }}
                className="h-9 px-4 rounded-xl bg-[var(--accent)] text-white font-bold"
              >
                اتصال به گوگل درایو
              </button>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="upload-target-folder"
                  className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5"
                >
                  پوشه مقصد در گوگل درایو
                </label>
                <div className="relative">
                  <Folder
                    className="w-4 h-4 text-[var(--ink-muted)] pointer-events-none absolute inset-y-0 my-auto start-3"
                    aria-hidden="true"
                  />
                  <select
                    id="upload-target-folder"
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] ps-9 pe-3 text-xs font-medium text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    {folderOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`rounded-2xl border-2 border-dashed p-7 text-center transition-colors ${
                  dragging
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-strong)] bg-[var(--bg-canvas)]'
                }`}
              >
                <FileUp className="w-8 h-8 text-[var(--accent)] mx-auto mb-2.5" aria-hidden="true" />
                <p className="text-sm font-bold text-[var(--ink-primary)]">
                  فایل‌ها را بکشید و اینجا رها کنید
                </p>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  پشتیبانی از عکس، ZIP، PDF، Markdown و هر نوع فایل
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-4 h-9 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--ink-primary)] transition-colors"
                >
                  انتخاب فایل از دستگاه
                </button>
              </div>

              {selectedFiles.length > 0 ? (
                <ul className="max-h-44 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, idx) => {
                    const pct = progressMap[idx] ?? 0;
                    return (
                      <li
                        key={`${file.name}-${idx}`}
                        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate">{file.name}</span>
                          {pct === 100 ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--emerald)] shrink-0" />
                          ) : !uploading ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                              aria-label={`حذف ${file.name} از صف`}
                              className="text-[var(--ink-muted)] hover:text-[var(--rose)]"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          ) : (
                            <span className="tabular-nums text-[var(--accent)] font-bold">
                              {pct}%
                            </span>
                          )}
                        </div>
                        {uploading ? (
                          <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </>
          )}
        </div>

        <footer className="px-5 py-3.5 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="h-9 px-4 rounded-xl border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-secondary)]"
          >
            بستن
          </button>
          {isConnected ? (
            <button
              type="button"
              disabled={selectedFiles.length === 0 || uploading}
              onClick={handleStartUpload}
              className="h-9 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-45 text-white text-xs font-bold transition-colors"
            >
              {uploading ? 'در حال آپلود…' : `شروع آپلود (${selectedFiles.length} فایل)`}
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
};
