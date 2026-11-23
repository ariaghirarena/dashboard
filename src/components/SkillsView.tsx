import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  Check,
  Cloud,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { AI_BRAIN_IDS, DRIVE_FOLDER_MIME } from '../lib/config';
import {
  ADD_SKILL_PROMPT_EXAMPLE,
  SKILLS_CATALOG,
  skillActivationPrompt,
  type SkillEntry,
} from '../lib/skills';
import { DriveAuthExpiredError, listFolderFiles, readDriveFileText } from '../lib/googleDrive';
import { renderSafeMarkdown } from '../lib/markdown';

interface SkillsViewProps {
  accessToken: string | null;
  isConnected: boolean;
  onConnectDrive: () => void;
}

function buildSummaryText(skill: SkillEntry): string {
  const lines = [
    `# ${skill.slug}`,
    '',
    `## ${skill.titleFa}`,
    skill.purposeFa,
    '',
    `منبع: ${skill.source}`,
    `ترگرها: ${skill.triggersFa}`,
    '',
    `SKILL.md: https://drive.google.com/file/d/${skill.fileId}/view`,
    `شناسه فایل: ${skill.fileId}`,
  ];
  return lines.join('\n');
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  accessToken,
  isConnected,
  onConnectDrive,
}) => {
  const [query, setQuery] = useState('');
  const [extraSkills, setExtraSkills] = useState<SkillEntry[]>([]);
  const [discovering, setDiscovering] = useState(false);

  const [selected, setSelected] = useState<SkillEntry | null>(null);
  const [skillText, setSkillText] = useState<string | null>(null);
  const [resolvedFileId, setResolvedFileId] = useState<string | null>(null);
  const [loadingSkill, setLoadingSkill] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);

  const [copiedText, setCopiedText] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAddPrompt, setCopiedAddPrompt] = useState(false);

  // In connected mode: discover folders inside 02-Skills that are not part of the
  // committed catalog (freshly installed skills show up automatically).
  useEffect(() => {
    if (!isConnected || !accessToken) {
      setExtraSkills([]);
      return;
    }
    let cancelled = false;
    setDiscovering(true);
    listFolderFiles(accessToken, AI_BRAIN_IDS.folders.skills)
      .then((children) => {
        if (cancelled) return;
        const discovered = children
          .filter((f) => f.mimeType === DRIVE_FOLDER_MIME)
          .filter(
            (f) =>
              !SKILLS_CATALOG.some((s) => s.slug === f.name || s.folderId === f.id)
          )
          .map<SkillEntry>((f) => ({
            slug: f.name,
            folderId: f.id,
            fileId: '',
            titleFa: f.name,
            purposeFa:
              'اسکیل تازه نصب‌شده در درایو — متن کامل SKILL.md را با کلیک روی کارت بخوانید.',
            source: 'Google Drive (جدید)',
            triggersFa: '—',
          }));
        setExtraSkills(discovered);
      })
      .catch(() => {
        if (!cancelled) setExtraSkills([]);
      })
      .finally(() => {
        if (!cancelled) setDiscovering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isConnected, accessToken]);

  const allSkills = useMemo(
    () => [...SKILLS_CATALOG, ...extraSkills],
    [extraSkills]
  );

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSkills;
    return allSkills.filter((s) =>
      [s.slug, s.titleFa, s.purposeFa, s.source, s.triggersFa]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [allSkills, query]);

  const openSkill = useCallback(
    async (skill: SkillEntry) => {
      setSelected(skill);
      setSkillText(null);
      setSkillError(null);
      setCopiedText(false);
      setCopiedPrompt(false);
      setResolvedFileId(skill.fileId || null);

      if (!isConnected || !accessToken) {
        return;
      }
      setLoadingSkill(true);
      try {
        let fileId = skill.fileId || null;
        try {
          const children = await listFolderFiles(accessToken, skill.folderId);
          const skillMd = children.find(
            (c) => c.name.trim().toLowerCase() === 'skill.md'
          );
          if (skillMd) fileId = skillMd.id;
        } catch {
          // fall back to the catalog file id
        }
        setResolvedFileId(fileId);
        if (!fileId) {
          setSkillError('فایل SKILL.md داخل پوشه این اسکیل پیدا نشد.');
          return;
        }
        const text = await readDriveFileText(accessToken, fileId, 'text/markdown');
        setSkillText(text);
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) {
          setSkillError('نشست گوگل درایو منقضی شده است. دوباره متصل شوید.');
        } else {
          setSkillError('خواندن SKILL.md از درایو با خطا مواجه شد.');
        }
      } finally {
        setLoadingSkill(false);
      }
    },
    [isConnected, accessToken]
  );

  const closeSkill = useCallback(() => {
    setSelected(null);
    setSkillText(null);
    setSkillError(null);
  }, []);

  // Escape key + body scroll lock while the skill panel is open
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSkill();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [selected, closeSkill]);

  const handleCopyText = useCallback(async () => {
    if (!selected) return;
    const text = skillText ?? buildSummaryText(selected);
    const ok = await copyText(text);
    if (ok) {
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 2200);
    }
  }, [selected, skillText]);

  const handleCopyPrompt = useCallback(async () => {
    if (!selected) return;
    const prompt = skillActivationPrompt({
      slug: selected.slug,
      fileId: resolvedFileId || selected.fileId || null,
      folderId: selected.folderId,
    });
    const ok = await copyText(prompt);
    if (ok) {
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 2200);
    }
  }, [selected, resolvedFileId]);

  const handleCopyAddPrompt = useCallback(async () => {
    const ok = await copyText(ADD_SKILL_PROMPT_EXAMPLE);
    if (ok) {
      setCopiedAddPrompt(true);
      window.setTimeout(() => setCopiedAddPrompt(false), 2200);
    }
  }, []);

  const indexOpenUrl = `https://drive.google.com/file/d/${AI_BRAIN_IDS.files.skillsIndex}/view`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Wand2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--ink-primary)]">
                اسکیل‌ها <span className="font-mono-ltr">(Skills)</span>
              </h1>
              <p className="text-xs sm:text-[13px] text-[var(--ink-secondary)] mt-1 leading-6">
                {allSkills.length} اسکیل نصب‌شده در <span translate="no">AI-Brain/02-Skills</span> — با کلیک روی هرکدام، متن{' '}
                <span className="font-mono-ltr">SKILL.md</span> نمایش داده می‌شود؛ می‌توانید متن را کپی کنید یا پرامپت فعال‌سازی را در هر چتی پیست کنید تا خودش از درایو بخوانَد.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.open(indexOpenUrl, '_blank', 'noopener')}
              className="h-9 px-3.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--ink-primary)] inline-flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <span>INDEX.md در درایو</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAddPrompt}
              className="h-9 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              {copiedAddPrompt ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>کپی شد</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  <span>کپی پرامپت «نصب اسکیل جدید»</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!isConnected ? (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
            <div className="flex items-start gap-2 text-xs text-[var(--ink-secondary)] leading-6">
              <Cloud className="w-4 h-4 mt-0.5 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
              <span>
                حالت پیش‌نمایش فعال است. متن کامل اسکیل‌ها و اسکیل‌های تازه نصب‌شده فقط با اتصال زنده خوانده می‌شود؛ پرامپت فعال‌سازی در همین حالت هم کار می‌کند.
              </span>
            </div>
            <button
              type="button"
              onClick={onConnectDrive}
              className="h-8 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
              <span>اتصال به گوگل درایو</span>
            </button>
          </div>
        ) : discovering ? (
          <p className="mt-3 text-[11px] text-[var(--ink-muted)] inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            <span>در حال بررسی پوشه‌ی 02-Skills برای اسکیل‌های تازه نصب‌شده…</span>
          </p>
        ) : null}

        {/* Search */}
        <div className="mt-4 relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-[var(--ink-muted)] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در اسکیل‌ها (نام، کاربرد، منبع، ترگر)…"
            aria-label="جستجو در اسکیل‌ها"
            className="w-full h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pe-4 ps-10 text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </section>

      {/* Skills grid */}
      {filteredSkills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] py-14 text-center">
          <Sparkles className="w-8 h-8 text-[var(--ink-muted)] mx-auto" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-[var(--ink-primary)]">نتیجه‌ای پیدا نشد</p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">عبارت دیگری جستجو کنید یا جستجو را پاک کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredSkills.map((skill) => (
            <button
              key={skill.folderId}
              type="button"
              onClick={() => openSkill(skill)}
              className="group text-start rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/60 p-4 flex flex-col gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <div className="flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono-ltr px-2 py-1 rounded-md bg-[var(--bg-subtle)] text-[var(--accent)] border border-[var(--border-subtle)] truncate">
                  {skill.slug}
                </code>
                <span className="text-[10px] text-[var(--ink-muted)] truncate max-w-[45%]" title={skill.source}>
                  {skill.source}
                </span>
              </div>
              <h2 className="text-sm font-bold text-[var(--ink-primary)] group-hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4 shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition-colors" aria-hidden="true" />
                <span className="truncate">{skill.titleFa}</span>
              </h2>
              <p className="text-[11px] leading-6 text-[var(--ink-secondary)]">{skill.purposeFa}</p>
            </button>
          ))}
        </div>
      )}

      {/* How to add a new skill */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h2 className="text-sm font-black text-[var(--ink-primary)] inline-flex items-center gap-2">
          <BookOpenCheck className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          <span>افزودن اسکیل جدید به داشبورد (پروتکل هر چت)</span>
        </h2>
        <ol className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-6 text-[var(--ink-secondary)] list-none">
          <li className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2"><b>۱.</b> اول <b>README / SKILL.md</b> خودِ اسکیل را بخوان و سیستم نصب آن را دقیق بفهم (مثلاً <span className="font-mono-ltr">npx skills</span> یا کپی دستی).</li>
          <li className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2"><b>۲.</b> همان سیستم نصبِ خودِ اسکیل را اجرا کن؛ محتوای <span className="font-mono-ltr">SKILL.md</span> را هرگز حدس نزن.</li>
          <li className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2"><b>۳.</b> در درایو یک پوشه با <b>همان slug</b> داخل <span className="font-mono-ltr">02-Skills/</span> بساز و <span className="font-mono-ltr">SKILL.md</span> را داخلش قرار بده.</li>
          <li className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2"><b>۴.</b> در <span className="font-mono-ltr">02-Skills/INDEX.md</span> یک ردیف با <b>slug، source، purpose، triggers و File ID دقیق SKILL.md</b> ثبت کن.</li>
          <li className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2"><b>۵.</b> در <span className="font-mono-ltr">src/lib/skills.ts</span> (آرایه <span className="font-mono-ltr">SKILLS_CATALOG</span>) یک ورودی جدید اضافه کن، <span className="font-mono-ltr">npm run build</span> بزن و <span className="font-mono-ltr">/docs</span> را روی همان شاخه‌ی PR پوش کن.</li>
          <li className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2"><b>۶.</b> حتی بدون مرحله‌ی ۵ هم، در حالت متصل به درایو اسکیل جدید <b>خودکار</b> در همین صفحه ظاهر می‌شود (کشف زنده از پوشه 02-Skills).</li>
        </ol>
      </section>

      {/* Skill reader modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`اسکیل ${selected.slug}`}
        >
          <button
            type="button"
            aria-label="بستن"
            onClick={closeSkill}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px] cursor-default"
          />
          <div className="relative w-full sm:max-w-3xl max-h-[92dvh] sm:m-6 rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <code className="text-[11px] font-mono-ltr text-[var(--accent)]">{selected.slug}</code>
                <h2 className="text-sm sm:text-base font-black text-[var(--ink-primary)] truncate">
                  {selected.titleFa}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSkill}
                aria-label="بستن پنل اسکیل"
                className="h-9 w-9 rounded-xl text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs leading-6 text-[var(--ink-secondary)]">{selected.purposeFa}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--ink-muted)]">
                <span>منبع: <b className="text-[var(--ink-secondary)]">{selected.source}</b></span>
                <span>ترگرها: <b className="text-[var(--ink-secondary)]">{selected.triggersFa}</b></span>
              </div>

              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                {loadingSkill ? (
                  <div className="py-10 flex flex-col items-center justify-center gap-3 text-[var(--ink-muted)]">
                    <Loader2 className="w-7 h-7 animate-spin text-[var(--accent)]" aria-hidden="true" />
                    <p className="text-xs">در حال خواندن SKILL.md از گوگل درایو…</p>
                  </div>
                ) : skillText ? (
                  <div
                    className="md-prose"
                    dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(skillText) }}
                  />
                ) : (
                  <div className="space-y-3">
                    {skillError ? (
                      <p className="text-xs text-[var(--red,#e5484d)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 leading-6">
                        {skillError}
                      </p>
                    ) : null}
                    <pre className="whitespace-pre-wrap text-[11px] leading-6 font-mono-ltr bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl p-4 overflow-x-auto">
                      {buildSummaryText(selected)}
                    </pre>
                    {!isConnected ? (
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        برای نمایش متن کامل SKILL.md، دکمه «اتصال زنده به گوگل درایو» را بزنید.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer actions */}
            <div className="px-5 py-3.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 shrink-0 bg-[var(--bg-subtle)]">
              <button
                type="button"
                onClick={handleCopyText}
                className="h-9 px-3.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] text-xs font-bold text-[var(--ink-primary)] inline-flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-[var(--emerald)]" aria-hidden="true" />
                    <span>کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                    <span>کپی متن اسکیل</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="h-9 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>پرامپت کپی شد</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" aria-hidden="true" />
                    <span>کپی پرامپت فعال‌سازی</span>
                  </>
                )}
              </button>
              {(resolvedFileId || selected.fileId) ? (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://drive.google.com/file/d/${resolvedFileId || selected.fileId}/view`,
                      '_blank',
                      'noopener'
                    )
                  }
                  className="h-9 px-3.5 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--bg-canvas)] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>باز کردن در درایو</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
