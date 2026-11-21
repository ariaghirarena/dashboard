export const AI_BRAIN_IDS = {
  rootFolder: import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID || '1xbgHAgoAoJIWEoERxdXILgC6N861F8h6',
  bootstrapFile: import.meta.env.VITE_BOOTSTRAP_FILE_ID || '1qDVWA6wN55JfrHleKbb9Zd06jFqf8u2x',
  folders: {
    memory: '1Nd4SB-obBGnijzSytZ_-D-q-7dm4VxD6',
    skills: '1rwZFgyu46v--HFPRwZzlNv7LwFpOlNSR',
    registry: '15CagvIWa9CpEWjztTyEE1zM4yDERO2Y4',
    projects: '1RvtV0N66fC0sOvQAo4_c6jKaMKnXXUe0',
    chats: '1dTxfeX1EHqNADiCrlmAuh7X3sK5trjgh',
    assets: '10vwDiHAXB840RPl9t-rQ1_WEMsylR22W',
  },
  files: {
    memoryIndex: '1Hypfi18ymNgfxPPSFNbRRjBFFamb3bkM',
    glossary: '1CAZo_7r3qXQlB9C7ON2Ds79tOJyUihuK',
    profile: '1saqzvv4wjLvOuZGI7LvRKg2PK8O_NEum',
    rules: '18-mT_jVC8y2nAyauyvUkP_WVyc96C5t5',
    lessons: '1xRJm0SVv9AOJynRdWbIza6bNZPFe4cmv',
    skillsIndex: '1Gz_CSc0XhMkYW0vo2_4-IGUPSd4P15OQ',
    projectsRegistry: '1KJ-1CkeXG6diIoqHxHDWG_56d-M0FRk7',
    githubRegistry: '1ooU4EokWue1N6jO-XAl8l3vKYWVegLWY',
    assetsRegistry: '1KmhYBQF1wvQOiB3JF5zwDsREk9Y8-RlB',
    chatsIndex: '1buaWLArcxr9RBfMvZTu-dnB2bqenk1kr',
  },
} as const;

export const STORAGE_KEYS = {
  theme: 'aibrain_theme',
  unlockedUntil: 'aibrain_unlocked_until',
  googleClientId: 'aibrain_google_client_id',
  rootFolderId: 'aibrain_root_folder_id',
  driveToken: 'aibrain_drive_token_v1',
  userEmailHint: 'aibrain_google_email_hint',
  tokenWorkerUrl: 'aibrain_token_worker_url',
} as const;

export const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

export function getEffectiveGoogleClientId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.googleClientId);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore storage errors
  }
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

/**
 * Optional Cloudflare Worker that mints Drive access tokens from a stored refresh token.
 * When set (build-time VITE_TOKEN_WORKER_URL or runtime localStorage override), the app
 * uses it instead of the Google Identity Services popup flow — this is what makes
 * "open the link anywhere -> enter passcode -> Drive already connected" work.
 * Value is the base worker URL without trailing slash, e.g. https://aibrain-drive-token.<you>.workers.dev
 */
export function getEffectiveTokenWorkerUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.tokenWorkerUrl);
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  } catch {
    // ignore storage errors
  }
  return (import.meta.env.VITE_TOKEN_WORKER_URL || '').trim().replace(/\/+$/, '');
}

export function getEffectiveRootFolderId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.rootFolderId);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore storage errors
  }
  return AI_BRAIN_IDS.rootFolder;
}

export function getArenaBootPrompt(): string {
  return `فایل BOOTSTRAP.md با شناسه ${AI_BRAIN_IDS.bootstrapFile} را از گوگل درایو بخوان و طبق پروتکل بوت آماده باش.`;
}
