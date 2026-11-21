import { DRIVE_FOLDER_MIME, STORAGE_KEYS, getEffectiveTokenWorkerUrl } from './config';
import { getStoredWorkerKey } from './auth';
import type { DriveFile } from '../types/drive';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            hint?: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
          };
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export class DriveAuthExpiredError extends Error {
  constructor(message = 'نشست گوگل درایو منقضی شده است.') {
    super(message);
    this.name = 'DriveAuthExpiredError';
  }
}

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
}

export function loadStoredDriveToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.driveToken);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (!parsed.accessToken || typeof parsed.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredDriveToken(token: StoredToken): void {
  try {
    localStorage.setItem(STORAGE_KEYS.driveToken, JSON.stringify(token));
    if (token.userEmail) {
      localStorage.setItem(STORAGE_KEYS.userEmailHint, token.userEmail);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function clearStoredDriveToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.driveToken);
  } catch {
    // ignore
  }
}

export function getSavedEmailHint(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEYS.userEmailHint) || undefined;
  } catch {
    return undefined;
  }
}

export function waitForGoogleGsi(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const start = Date.now();
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(timer);
        reject(new Error('اسکریپت Google Identity Services بارگذاری نشد. اتصال اینترنت یا مسدودکننده تبلیغات را بررسی کنید.'));
      }
    }, 150);
  });
}

/**
 * Worker mode: fetch a short-lived Drive access token from the token worker.
 * The refresh token lives only inside the worker's encrypted KV vault.
 */
async function requestWorkerAccessToken(
  workerUrl: string,
  forceConsent: boolean
): Promise<{ accessToken: string; expiresAt: number }> {
  const workerKey = getStoredWorkerKey();
  if (!workerKey) {
    throw new DriveAuthExpiredError(
      'کلید اتصال Worker در این مرورگر پیدا نشد. یک‌بار توسط رمز وارد شوید تا ساخته شود.'
    );
  }

  if (forceConsent) {
    // Re-authorize (e.g. Drive scope revoked): send the user through the consent flow once.
    window.location.assign(`${workerUrl}/auth?key=${encodeURIComponent(workerKey)}`);
    return new Promise(() => undefined);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${workerUrl}/token`, {
      method: 'POST',
      headers: { 'x-worker-key': workerKey },
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };
    if (res.status === 401) {
      throw new DriveAuthExpiredError(
        'کلید Worker نامعتبر است. مقدار WORKER_KEY باید برابر SHA-256 از «aibrain-worker:» + رمز ورود باشد.'
      );
    }
    if (res.status === 409) {
      throw new DriveAuthExpiredError(
        'هنوز «مجوز اتصال دائم» روی Worker ثبت نشده است. یک‌بار آدرس /auth سرویس Worker را باز کنید.'
      );
    }
    if (!res.ok || !data.access_token) {
      throw new DriveAuthExpiredError(data.error || `Worker خطا داد (${res.status}).`);
    }
    const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 3500;
    return { accessToken: data.access_token, expiresAt: Date.now() + expiresInSec * 1000 };
  } catch (err) {
    if (err instanceof DriveAuthExpiredError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new DriveAuthExpiredError('پاسخ Worker دریافت نشد (زمان انتظار تمام شد). اتصال اینترنت را بررسی کنید.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function requestGoogleAccessToken(options: {
  clientId: string;
  silent?: boolean;
  forceConsent?: boolean;
}): Promise<{ accessToken: string; expiresAt: number }> {
  const { clientId, silent = false, forceConsent = false } = options;

  // Worker mode takes precedence — no GIS script or popup is needed at all.
  const workerUrl = getEffectiveTokenWorkerUrl();
  if (workerUrl) {
    return requestWorkerAccessToken(workerUrl, forceConsent);
  }

  if (!clientId.trim()) {
    throw new Error('شناسه Google Client ID تنظیم نشده است.');
  }

  await waitForGoogleGsi();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('سرویس احراز هویت گوگل در دسترس نیست.');
  }

  const emailHint = getSavedEmailHint();

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new DriveAuthExpiredError(
            silent
              ? 'تمدید خودکار نشست گوگل پاسخ نداد. لطفاً یک‌بار اتصال مجدد بزنید.'
              : 'پنجره ورود گوگل بسته شد یا زمان آن به پایان رسید.'
          )
        );
      }
    }, silent ? 9000 : 120000);

    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      hint: emailHint,
      callback: (response) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (response.error || !response.access_token) {
          const msg = response.error_description || response.error || 'خطا در دریافت توکن گوگل';
          reject(new DriveAuthExpiredError(msg));
          return;
        }
        const expiresInSec = typeof response.expires_in === 'number' ? response.expires_in : 3500;
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresInSec * 1000,
        });
      },
      error_callback: (err) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        reject(new DriveAuthExpiredError(err.message || err.type || 'پنجره ورود گوگل مسدود یا بسته شد.'));
      },
    });

    const promptMode = silent ? '' : forceConsent ? 'consent select_account' : emailHint ? '' : 'select_account';
    client.requestAccessToken({ prompt: promptMode, hint: emailHint });
  });
}

async function driveFetch(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (res.status === 401) {
    throw new DriveAuthExpiredError('توکن گوگل درایو منقضی شده یا باطل شده است.');
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`خطای Google Drive (${res.status}): ${errText.slice(0, 220)}`);
  }
  return res;
}

export async function fetchGoogleUserInfo(token: string): Promise<{
  email: string | null;
  name: string | null;
  picture: string | null;
}> {
  try {
    const res = await driveFetch(token, 'https://www.googleapis.com/oauth2/v3/userinfo');
    const data = (await res.json()) as { email?: string; name?: string; picture?: string };
    return {
      email: data.email || null,
      name: data.name || null,
      picture: data.picture || null,
    };
  } catch {
    return { email: null, name: null, picture: null };
  }
}

const FILE_FIELDS = 'files(id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,webContentLink,thumbnailLink,description,starred)';

export async function listFolderFiles(token: string, folderId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const orderBy = encodeURIComponent('folder,name_natural');
  const url = `${DRIVE_API}/files?q=${q}&orderBy=${orderBy}&pageSize=200&fields=${encodeURIComponent(FILE_FIELDS)}&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const res = await driveFetch(token, url);
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files || [];
}

export async function searchDriveFiles(token: string, term: string): Promise<DriveFile[]> {
  const safe = term.replace(/'/g, "\\'");
  const q = encodeURIComponent(`(name contains '${safe}' or fullText contains '${safe}') and trashed = false`);
  const url = `${DRIVE_API}/files?q=${q}&pageSize=60&fields=${encodeURIComponent(FILE_FIELDS)}&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const res = await driveFetch(token, url);
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files || [];
}

export async function listAllImages(token: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`mimeType contains 'image/' and trashed = false`);
  const orderBy = encodeURIComponent('modifiedTime desc');
  const url = `${DRIVE_API}/files?q=${q}&orderBy=${orderBy}&pageSize=60&fields=${encodeURIComponent(FILE_FIELDS)}&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const res = await driveFetch(token, url);
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files || [];
}

export async function readDriveFileText(token: string, fileId: string, mimeType: string): Promise<string> {
  if (mimeType.startsWith('application/vnd.google-apps.')) {
    const exportMime = mimeType.includes('spreadsheet') ? 'text/csv' : 'text/plain';
    const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    const res = await driveFetch(token, url);
    return res.text();
  }
  const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const res = await driveFetch(token, url);
  return res.text();
}

export async function updateDriveFileText(
  token: string,
  fileId: string,
  content: string,
  mimeType = 'text/markdown'
): Promise<DriveFile> {
  const url = `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=media&supportsAllDrives=true&fields=id,name,mimeType,size,modifiedTime`;
  const res = await driveFetch(token, url, {
    method: 'PATCH',
    headers: { 'Content-Type': `${mimeType}; charset=UTF-8` },
    body: content,
  });
  return (await res.json()) as DriveFile;
}

export async function fetchDriveFileBlob(token: string, fileId: string): Promise<Blob> {
  const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const res = await driveFetch(token, url);
  return res.blob();
}

export async function createDriveFolder(token: string, name: string, parentId: string): Promise<DriveFile> {
  const url = `${DRIVE_API}/files?supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,parents`;
  const res = await driveFetch(token, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: DRIVE_FOLDER_MIME,
      parents: [parentId],
    }),
  });
  return (await res.json()) as DriveFile;
}

export async function renameDriveFile(token: string, fileId: string, newName: string): Promise<DriveFile> {
  const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,modifiedTime`;
  const res = await driveFetch(token, url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
  return (await res.json()) as DriveFile;
}

export async function trashDriveFile(token: string, fileId: string): Promise<void> {
  const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`;
  await driveFetch(token, url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  });
}

export function uploadFileToDrive(
  token: string,
  file: File,
  parentId: string,
  onProgress?: (percent: number) => void
): Promise<DriveFile> {
  return new Promise((resolve, reject) => {
    const metadata = {
      name: file.name,
      parents: [parentId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,modifiedTime,parents,webViewLink`
    );
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        reject(new DriveAuthExpiredError());
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as DriveFile);
        } catch {
          reject(new Error('پاسخ نامعتبر از گوگل درایو دریافت شد.'));
        }
      } else {
        reject(new Error(`خطا در آپلود (${xhr.status}): ${xhr.responseText.slice(0, 180)}`));
      }
    };

    xhr.onerror = () => reject(new Error('خطای شبکه هنگام آپلود فایل به گوگل درایو.'));
    xhr.send(form);
  });
}

export function formatFileSize(sizeStr?: string): string {
  if (!sizeStr) return '—';
  const bytes = Number(sizeStr);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} گیگابایت`;
}

export function formatPersianDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function isTextEditableFile(file: DriveFile): boolean {
  const name = file.name.toLowerCase();
  const mime = file.mimeType.toLowerCase();
  return (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/vnd.google-apps.document' ||
    name.endsWith('.md') ||
    name.endsWith('.txt') ||
    name.endsWith('.json') ||
    name.endsWith('.yml') ||
    name.endsWith('.yaml') ||
    name.endsWith('.html') ||
    name.endsWith('.css') ||
    name.endsWith('.js') ||
    name.endsWith('.ts') ||
    name.endsWith('.php')
  );
}

export function isImageFile(file: DriveFile): boolean {
  return file.mimeType.startsWith('image/');
}
