import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LockScreen } from './components/LockScreen';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SessionExpiredBanner } from './components/SessionExpiredBanner';
import { OverviewView } from './components/OverviewView';
import { SkillsView } from './components/SkillsView';
import { ExplorerView } from './components/ExplorerView';
import { MarkdownModal } from './components/MarkdownModal';
import { ImageLightbox } from './components/ImageLightbox';
import { MediaGalleryView } from './components/MediaGalleryView';
import { UploadModal } from './components/UploadModal';
import { SettingsGuideView } from './components/SettingsGuideView';
import { ToastStack } from './components/Toast';
import {
  AI_BRAIN_IDS,
  DRIVE_FOLDER_MIME,
  getEffectiveGoogleClientId,
  getEffectiveRootFolderId,
  getEffectiveTokenWorkerUrl,
  STORAGE_KEYS,
} from './lib/config';
import { isDashboardUnlocked, lockDashboardNow } from './lib/auth';
import { DEMO_CONTENT_BY_ID, DEMO_FILES_BY_PARENT } from './lib/demoData';
import {
  clearStoredDriveToken,
  createDriveFolder,
  DriveAuthExpiredError,
  fetchDriveFileBlob,
  fetchGoogleUserInfo,
  isImageFile,
  isTextEditableFile,
  listAllImages,
  listFolderFiles,
  loadStoredDriveToken,
  readDriveFileText,
  renameDriveFile,
  requestGoogleAccessToken,
  saveStoredDriveToken,
  searchDriveFiles,
  trashDriveFile,
  updateDriveFileText,
  uploadFileToDrive,
} from './lib/googleDrive';
import type {
  BreadcrumbItem,
  DriveFile,
  DriveSessionState,
  NavSection,
  ToastMessage,
} from './types/drive';

function getInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [unlocked, setUnlocked] = useState<boolean>(() => isDashboardUnlocked());
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [clientId, setClientId] = useState<string>(() => getEffectiveGoogleClientId());
  const [rootFolderId, setRootFolderId] = useState<string>(() => getEffectiveRootFolderId());
  const tokenWorkerConfigured = Boolean(getEffectiveTokenWorkerUrl());
  const driveConfigured = Boolean(clientId) || tokenWorkerConfigured;

  const [session, setSession] = useState<DriveSessionState>(() => {
    const stored = loadStoredDriveToken();
    if (stored && stored.expiresAt > Date.now() + 60_000) {
      return {
        status: 'connected',
        accessToken: stored.accessToken,
        expiresAt: stored.expiresAt,
        userEmail: stored.userEmail,
        userName: stored.userName,
        userPhoto: stored.userPhoto,
        lastError: null,
        expiredReason: null,
      };
    }
    if (stored && stored.expiresAt <= Date.now() + 60_000) {
      return {
        status: 'expired',
        accessToken: null,
        expiresAt: null,
        userEmail: stored.userEmail,
        userName: stored.userName,
        userPhoto: stored.userPhoto,
        lastError: null,
        expiredReason: 'نشست قبلی گوگل درایو به پایان رسیده است. روی «اتصال مجدد فوری» کلیک کنید.',
      };
    }
    return {
      status: 'demo',
      accessToken: null,
      expiresAt: null,
      userEmail: null,
      userName: null,
      userPhoto: null,
      lastError: null,
      expiredReason: null,
    };
  });

  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: rootFolderId, name: 'AI-Brain' },
  ]);
  const [files, setFiles] = useState<DriveFile[]>(DEMO_FILES_BY_PARENT[AI_BRAIN_IDS.rootFolder] || []);
  const [galleryImages, setGalleryImages] = useState<DriveFile[]>([]);
  const [memoryPreview, setMemoryPreview] = useState<string>(
    DEMO_CONTENT_BY_ID[AI_BRAIN_IDS.files.memoryIndex] || ''
  );
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Markdown Modal
  const [activeTextFile, setActiveTextFile] = useState<DriveFile | null>(null);
  const [activeTextContent, setActiveTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);

  // Image Lightbox
  const [activeImageFile, setActiveImageFile] = useState<DriveFile | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  // Upload Modal
  const [uploadOpen, setUploadOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const silentRefreshInFlight = useRef(false);

  const pushToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  // Sync theme to documentElement
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0C1017' : '#F6F8FA');
    try {
      localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Mark session expired cleanly
  const markSessionExpired = useCallback(
    (reason?: string) => {
      clearStoredDriveToken();
      setSession((prev) => ({
        ...prev,
        status: 'expired',
        accessToken: null,
        expiresAt: null,
        expiredReason:
          reason || 'نشست گوگل درایو منقضی شده است. با ۱ کلیک دوباره متصل شوید.',
      }));
    },
    []
  );

  // Connect / Reconnect to Google Drive
  const connectToGoogleDrive = useCallback(
    async (options?: { silent?: boolean; forceConsent?: boolean }) => {
      const effectiveClientId = clientId || getEffectiveGoogleClientId();
      if (!effectiveClientId && !tokenWorkerConfigured) {
        setActiveSection('settings');
        pushToast(
          'warning',
          'هیچ روشی برای اتصال به گوگل درایو تنظیم نشده',
          'یا URL سرویس Worker را تنظیم کنید یا در بخش تنظیمات، Client ID پروژه Google Cloud خود را وارد کنید.'
        );
        return;
      }

      if (!options?.silent) {
        setSession((prev) => ({ ...prev, status: 'connecting', lastError: null }));
      }

      try {
        const { accessToken, expiresAt } = await requestGoogleAccessToken({
          clientId: effectiveClientId,
          silent: options?.silent,
          forceConsent: options?.forceConsent,
        });

        const user = await fetchGoogleUserInfo(accessToken);
        saveStoredDriveToken({
          accessToken,
          expiresAt,
          userEmail: user.email,
          userName: user.name,
          userPhoto: user.picture,
        });

        setSession({
          status: 'connected',
          accessToken,
          expiresAt,
          userEmail: user.email,
          userName: user.name,
          userPhoto: user.picture,
          lastError: null,
          expiredReason: null,
        });

        if (!options?.silent) {
          pushToast('success', 'اتصال زنده به گوگل درایو برقرار شد', user.email || undefined);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطا در اتصال به گوگل درایو';
        if (err instanceof DriveAuthExpiredError) {
          markSessionExpired(msg);
        } else {
          setSession((prev) => ({
            ...prev,
            status: 'error',
            lastError: msg,
          }));
        }
        if (!options?.silent) {
          pushToast('error', 'اتصال به گوگل درایو انجام نشد', msg);
        }
      }
    },
    [clientId, tokenWorkerConfigured, markSessionExpired, pushToast]
  );

  // Automatic Silent Token Refresh (keeps session alive seamlessly without logging out!)
  useEffect(() => {
    if (!unlocked) return;

    const tick = () => {
      if (session.status === 'connected' && session.expiresAt) {
        const remainingMs = session.expiresAt - Date.now();
        setMinutesLeft(Math.max(0, Math.round(remainingMs / 60_000)));

        // Auto silent renew 8 minutes before expiry
        if (remainingMs < 8 * 60_000 && !silentRefreshInFlight.current && driveConfigured) {
          silentRefreshInFlight.current = true;
          connectToGoogleDrive({ silent: true }).finally(() => {
            silentRefreshInFlight.current = false;
          });
        }
      } else {
        setMinutesLeft(null);
      }
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [unlocked, session.status, session.expiresAt, driveConfigured, connectToGoogleDrive]);

  // Attempt 1 silent recovery on boot if previous session expired and clientId exists
  useEffect(() => {
    if (!unlocked || session.status !== 'expired' || !driveConfigured || silentRefreshInFlight.current) {
      return;
    }
    silentRefreshInFlight.current = true;
    connectToGoogleDrive({ silent: true }).finally(() => {
      silentRefreshInFlight.current = false;
    });
  }, [unlocked, session.status, driveConfigured, connectToGoogleDrive]);

  const currentFolder = breadcrumbs[breadcrumbs.length - 1] || {
    id: rootFolderId,
    name: 'AI-Brain',
  };

  // Load folder contents
  const loadFolder = useCallback(
    async (folderId: string) => {
      if (session.status !== 'connected' || !session.accessToken) {
        setFiles(DEMO_FILES_BY_PARENT[folderId] || []);
        return;
      }
      setLoadingFiles(true);
      try {
        const list = await listFolderFiles(session.accessToken, folderId);
        setFiles(list);
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) {
          markSessionExpired();
        } else {
          pushToast('error', 'خطا در خواندن پوشه', err instanceof Error ? err.message : undefined);
        }
      } finally {
        setLoadingFiles(false);
      }
    },
    [session.status, session.accessToken, markSessionExpired, pushToast]
  );

  // Load live MEMORY.md when connected
  useEffect(() => {
    if (!unlocked) return;
    if (session.status !== 'connected' || !session.accessToken) {
      setMemoryPreview(DEMO_CONTENT_BY_ID[AI_BRAIN_IDS.files.memoryIndex] || '');
      return;
    }
    readDriveFileText(session.accessToken, AI_BRAIN_IDS.files.memoryIndex, 'text/markdown')
      .then((text) => setMemoryPreview(text))
      .catch((err) => {
        if (err instanceof DriveAuthExpiredError) markSessionExpired();
      });
  }, [unlocked, session.status, session.accessToken, markSessionExpired]);

  // Switch section -> jump breadcrumbs to right AI-Brain folder
  const handleSelectSection = useCallback(
    (section: NavSection) => {
      setActiveSection(section);
      setSearchQuery('');

      if (section === 'explorer') {
        const target = [{ id: rootFolderId, name: 'AI-Brain' }];
        setBreadcrumbs(target);
        loadFolder(rootFolderId);
      } else if (section === 'projects') {
        const target = [
          { id: rootFolderId, name: 'AI-Brain' },
          { id: AI_BRAIN_IDS.folders.projects, name: '04-Projects' },
        ];
        setBreadcrumbs(target);
        loadFolder(AI_BRAIN_IDS.folders.projects);
      } else if (section === 'chats') {
        const target = [
          { id: rootFolderId, name: 'AI-Brain' },
          { id: AI_BRAIN_IDS.folders.chats, name: '05-Chats' },
        ];
        setBreadcrumbs(target);
        loadFolder(AI_BRAIN_IDS.folders.chats);
      } else if (section === 'memory') {
        const target = [
          { id: rootFolderId, name: 'AI-Brain' },
          { id: AI_BRAIN_IDS.folders.memory, name: '01-Memory' },
        ];
        setBreadcrumbs(target);
        loadFolder(AI_BRAIN_IDS.folders.memory);
      } else if (section === 'github') {
        const target = [
          { id: rootFolderId, name: 'AI-Brain' },
          { id: AI_BRAIN_IDS.folders.registry, name: '03-Registry' },
        ];
        setBreadcrumbs(target);
        loadFolder(AI_BRAIN_IDS.folders.registry);
      } else if (section === 'gallery') {
        if (session.status === 'connected' && session.accessToken) {
          setLoadingFiles(true);
          listAllImages(session.accessToken)
            .then((imgs) => setGalleryImages(imgs))
            .catch((err) => {
              if (err instanceof DriveAuthExpiredError) markSessionExpired();
            })
            .finally(() => setLoadingFiles(false));
        }
      } else if (section === 'overview') {
        loadFolder(rootFolderId);
      }
    },
    [rootFolderId, loadFolder, session.status, session.accessToken, markSessionExpired]
  );

  // Refresh active view when connection becomes live
  useEffect(() => {
    if (unlocked && session.status === 'connected') {
      loadFolder(currentFolder.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, unlocked]);

  // Search handler
  const handleSearchSubmit = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      loadFolder(currentFolder.id);
      return;
    }
    setActiveSection('explorer');
    if (session.status !== 'connected' || !session.accessToken) {
      const allDemo = Object.values(DEMO_FILES_BY_PARENT).flat();
      setFiles(allDemo.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())));
      return;
    }
    setLoadingFiles(true);
    try {
      const results = await searchDriveFiles(session.accessToken, q);
      setFiles(results);
      setBreadcrumbs([{ id: rootFolderId, name: `نتایج جستجو: «${q}»` }]);
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) markSessionExpired();
      else pushToast('error', 'خطا در جستجو', err instanceof Error ? err.message : undefined);
    } finally {
      setLoadingFiles(false);
    }
  }, [searchQuery, session.status, session.accessToken, currentFolder.id, rootFolderId, loadFolder, markSessionExpired, pushToast]);

  // Open file (Markdown/Text OR Image OR Download)
  const handleOpenFile = useCallback(
    async (file: DriveFile) => {
      if (file.mimeType === DRIVE_FOLDER_MIME) {
        setBreadcrumbs((prev) => [...prev, { id: file.id, name: file.name }]);
        loadFolder(file.id);
        return;
      }

      if (isImageFile(file)) {
        setActiveImageFile(file);
        setActiveImageUrl(null);
        if (session.status !== 'connected' || !session.accessToken) {
          pushToast('info', 'برای مشاهده تصویر خصوصی به گوگل درایو متصل شوید');
          return;
        }
        setLoadingImage(true);
        try {
          const blob = await fetchDriveFileBlob(session.accessToken, file.id);
          setActiveImageUrl(URL.createObjectURL(blob));
        } catch (err) {
          if (err instanceof DriveAuthExpiredError) markSessionExpired();
          else pushToast('error', 'خطا در بارگذاری تصویر');
        } finally {
          setLoadingImage(false);
        }
        return;
      }

      if (isTextEditableFile(file)) {
        setActiveTextFile(file);
        if (session.status !== 'connected' || !session.accessToken) {
          setActiveTextContent(
            DEMO_CONTENT_BY_ID[file.id] ||
              `# ${file.name}\n\nاین پیش‌نمایش آزمایشی است. برای خواندن و ویرایش زنده فایل واقعی، دکمه **«اتصال به گوگل درایو»** را بزنید.`
          );
          return;
        }
        setLoadingText(true);
        try {
          const text = await readDriveFileText(session.accessToken, file.id, file.mimeType);
          setActiveTextContent(text);
        } catch (err) {
          if (err instanceof DriveAuthExpiredError) markSessionExpired();
          else pushToast('error', 'خطا در خواندن فایل', err instanceof Error ? err.message : undefined);
        } finally {
          setLoadingText(false);
        }
        return;
      }

      // Binary / ZIP / PDF -> direct download
      await handleDownloadFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.status, session.accessToken, loadFolder, markSessionExpired, pushToast]
  );

  // Download file safely with Bearer token
  const handleDownloadFile = useCallback(
    async (file: DriveFile) => {
      if (session.status !== 'connected' || !session.accessToken) {
        const text = DEMO_CONTENT_BY_ID[file.id];
        if (text) {
          const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
        pushToast('warning', 'برای دانلود فایل واقعی، ابتدا به گوگل درایو متصل شوید.');
        return;
      }

      pushToast('info', `در حال آماده‌سازی دانلود ${file.name}…`);
      try {
        const blob = await fetchDriveFileBlob(session.accessToken, file.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        pushToast('success', 'دانلود آغاز شد', file.name);
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) markSessionExpired();
        else pushToast('error', 'خطا در دانلود فایل', err instanceof Error ? err.message : undefined);
      }
    },
    [session.status, session.accessToken, markSessionExpired, pushToast]
  );

  // Save edited Markdown directly back to Google Drive
  const handleSaveTextFile = useCallback(
    async (file: DriveFile, newContent: string) => {
      if (session.status !== 'connected' || !session.accessToken) return;
      try {
        await updateDriveFileText(session.accessToken, file.id, newContent, 'text/markdown');
        setActiveTextContent(newContent);
        if (file.id === AI_BRAIN_IDS.files.memoryIndex) {
          setMemoryPreview(newContent);
        }
        pushToast('success', 'تغییرات مستقیم در گوگل درایو ذخیره شد', file.name);
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) markSessionExpired();
        else pushToast('error', 'خطا در ذخیره فایل', err instanceof Error ? err.message : undefined);
      }
    },
    [session.status, session.accessToken, markSessionExpired, pushToast]
  );

  // Upload multiple files
  const handleUploadFiles = useCallback(
    async (
      uploadList: File[],
      targetFolderId: string,
      onProgress: (index: number, pct: number) => void
    ) => {
      if (session.status !== 'connected' || !session.accessToken) {
        pushToast('warning', 'ابتدا به گوگل درایو متصل شوید.');
        return;
      }
      for (let i = 0; i < uploadList.length; i += 1) {
        try {
          await uploadFileToDrive(session.accessToken, uploadList[i], targetFolderId, (pct) =>
            onProgress(i, pct)
          );
        } catch (err) {
          if (err instanceof DriveAuthExpiredError) {
            markSessionExpired();
            return;
          }
          pushToast(
            'error',
            `خطا در آپلود ${uploadList[i].name}`,
            err instanceof Error ? err.message : undefined
          );
          return;
        }
      }
      pushToast('success', `${uploadList.length} فایل با موفقیت در گوگل درایو آپلود شد`);
      loadFolder(currentFolder.id);
      if (activeSection === 'gallery') {
        listAllImages(session.accessToken).then(setGalleryImages).catch(() => {});
      }
    },
    [session.status, session.accessToken, currentFolder.id, activeSection, loadFolder, markSessionExpired, pushToast]
  );

  const sectionMeta = useMemo(() => {
    switch (activeSection) {
      case 'projects':
        return {
          title: 'پروژه‌ها و آخرین فایل‌های نهایی',
          subtitle: 'پوشه 04-Projects — فقط آخرین نسخه نهایی در درایو و لینک نسخه‌های قبلی در گیت‌هاب',
        };
      case 'chats':
        return {
          title: 'چت‌های آرشیوشده آرنا',
          subtitle: 'پوشه 05-Chats — خلاصه گفتگوها، تصمیم‌ها، قرارداد تحویل و لینک مستقیم گیت‌هاب',
        };
      case 'memory':
        return {
          title: 'حافظه بلندمدت، قوانین و اسکیل‌ها',
          subtitle: 'پوشه 01-Memory — کلیک روی هر فایل برای خواندن یا ویرایش زنده مستقیم در درایو',
        };
      case 'skills':
        return {
          title: 'اسکیل‌های نصب‌شده (AI-Brain)',
          subtitle: 'پوشه 02-Skills — کلیک روی هر اسکیل برای خواندن SKILL.md و کپی متن یا پرامپت فعال‌سازی',
        };
      case 'github':
        return {
          title: 'رجیستری گیت‌هاب و صفحات .github.io',
          subtitle: 'پوشه 03-Registry — دفترکل کامل ریپوها، صفحات زنده و آرشیو نسخه‌های جایگزین‌شده',
        };
      default:
        return {
          title: 'مرورگر زنده گوگل درایو (AI-Brain)',
          subtitle: 'مرور، جستجو، ویرایش، دانلود و آپلود مستقیم فایل‌ها و پوشه‌ها',
        };
    }
  }, [activeSection]);

  if (!unlocked) {
    return (
      <LockScreen
        isDark={isDark}
        onToggleTheme={() => setIsDark((v) => !v)}
        onUnlocked={() => setUnlocked(true)}
      />
    );
  }

  return (
    <div className="min-h-dvh flex bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <Sidebar
        active={activeSection}
        onSelect={handleSelectSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        connectionBadge={session.status}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          session={session}
          minutesLeft={minutesLeft}
          onConnectDrive={() => connectToGoogleDrive({ forceConsent: false })}
          onRefreshCurrent={() => {
            if (activeSection === 'gallery' && session.accessToken) {
              setLoadingFiles(true);
              listAllImages(session.accessToken)
                .then(setGalleryImages)
                .finally(() => setLoadingFiles(false));
            } else {
              loadFolder(currentFolder.id);
            }
          }}
          onOpenUpload={() => setUploadOpen(true)}
          isDark={isDark}
          onToggleTheme={() => setIsDark((v) => !v)}
          onLock={() => {
            lockDashboardNow();
            setUnlocked(false);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isRefreshing={loadingFiles}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SessionExpiredBanner
            session={session}
            hasClientId={Boolean(clientId)}
            onReconnect={(force) => connectToGoogleDrive({ forceConsent: force })}
            onOpenSettings={() => setActiveSection('settings')}
          />

          {activeSection === 'overview' ? (
            <OverviewView
              session={session}
              memoryPreview={memoryPreview}
              rootItemsCount={files.length}
              onNavigate={handleSelectSection}
              onOpenFileById={handleOpenFile}
              onConnectDrive={() => connectToGoogleDrive({ forceConsent: false })}
              onOpenUpload={() => setUploadOpen(true)}
            />
          ) : activeSection === 'skills' ? (
            <SkillsView
              accessToken={session.accessToken}
              isConnected={session.status === 'connected'}
              onConnectDrive={() => connectToGoogleDrive({ forceConsent: false })}
            />
          ) : activeSection === 'gallery' ? (
            <MediaGalleryView
              images={galleryImages}
              accessToken={session.accessToken}
              loading={loadingFiles}
              onOpenImage={handleOpenFile}
              onDownload={handleDownloadFile}
              onOpenUpload={() => setUploadOpen(true)}
            />
          ) : activeSection === 'settings' ? (
            <SettingsGuideView
              session={session}
              minutesLeft={minutesLeft}
              onSaveConfig={(newClient, newRoot) => {
                setClientId(newClient);
                setRootFolderId(newRoot || AI_BRAIN_IDS.rootFolder);
                pushToast('success', 'تنظیمات ذخیره شد', 'حالا می‌توانید به گوگل درایو متصل شوید.');
              }}
              onConnectDrive={(force) => connectToGoogleDrive({ forceConsent: force })}
              onSilentRefresh={() => connectToGoogleDrive({ silent: true })}
              onDisconnectDrive={() => {
                clearStoredDriveToken();
                setSession({
                  status: 'demo',
                  accessToken: null,
                  expiresAt: null,
                  userEmail: null,
                  userName: null,
                  userPhoto: null,
                  lastError: null,
                  expiredReason: null,
                });
                pushToast('info', 'اتصال گوگل درایو قطع شد');
              }}
            />
          ) : (
            <ExplorerView
              title={sectionMeta.title}
              subtitle={sectionMeta.subtitle}
              files={files}
              breadcrumbs={breadcrumbs}
              loading={loadingFiles}
              isLiveConnected={session.status === 'connected'}
              onOpenFolder={(folder) => {
                setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
                loadFolder(folder.id);
              }}
              onBreadcrumbClick={(index) => {
                const next = breadcrumbs.slice(0, index + 1);
                setBreadcrumbs(next);
                loadFolder(next[next.length - 1].id);
              }}
              onOpenFile={handleOpenFile}
              onDownloadFile={handleDownloadFile}
              onCreateFolder={async (name) => {
                if (!session.accessToken) return;
                try {
                  await createDriveFolder(session.accessToken, name, currentFolder.id);
                  pushToast('success', `پوشه «${name}» ساخته شد`);
                  loadFolder(currentFolder.id);
                } catch (err) {
                  if (err instanceof DriveAuthExpiredError) markSessionExpired();
                  else pushToast('error', 'خطا در ساخت پوشه');
                }
              }}
              onRenameFile={async (file, newName) => {
                if (!session.accessToken) return;
                try {
                  await renameDriveFile(session.accessToken, file.id, newName);
                  pushToast('success', 'نام تغییر یافت', newName);
                  loadFolder(currentFolder.id);
                } catch (err) {
                  if (err instanceof DriveAuthExpiredError) markSessionExpired();
                  else pushToast('error', 'خطا در تغییر نام');
                }
              }}
              onTrashFile={async (file) => {
                if (!session.accessToken) return;
                try {
                  await trashDriveFile(session.accessToken, file.id);
                  pushToast('success', `«${file.name}» به زباله‌دان منتقل شد`);
                  loadFolder(currentFolder.id);
                } catch (err) {
                  if (err instanceof DriveAuthExpiredError) markSessionExpired();
                  else pushToast('error', 'خطا در حذف فایل');
                }
              }}
              onDropFiles={(list) => {
                if (session.status !== 'connected') {
                  pushToast('warning', 'برای آپلود مستقیم، ابتدا به گوگل درایو متصل شوید.');
                  return;
                }
                handleUploadFiles(Array.from(list), currentFolder.id, () => {});
              }}
              onOpenUploadModal={() => setUploadOpen(true)}
            />
          )}
        </main>
      </div>

      <MarkdownModal
        file={activeTextFile}
        initialContent={activeTextContent}
        loading={loadingText}
        canSave={session.status === 'connected'}
        onSave={handleSaveTextFile}
        onDownload={handleDownloadFile}
        onClose={() => setActiveTextFile(null)}
      />

      <ImageLightbox
        file={activeImageFile}
        blobUrl={activeImageUrl}
        loading={loadingImage}
        onDownload={handleDownloadFile}
        onClose={() => {
          if (activeImageUrl) URL.revokeObjectURL(activeImageUrl);
          setActiveImageUrl(null);
          setActiveImageFile(null);
        }}
      />

      <UploadModal
        open={uploadOpen}
        isConnected={session.status === 'connected'}
        defaultFolderId={currentFolder.id}
        defaultFolderName={currentFolder.name}
        onUploadFiles={handleUploadFiles}
        onConnectDrive={() => connectToGoogleDrive({ forceConsent: false })}
        onClose={() => setUploadOpen(false)}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};

export default App;
