import { STORAGE_KEYS } from './config';

const UNLOCK_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days remembered on trusted browser

const WORKER_KEY_STORAGE = 'aibrain_worker_key';
const WORKER_KEY_SALT = 'aibrain-worker:';

export function getStoredWorkerKey(): string | null {
  try {
    return localStorage.getItem(WORKER_KEY_STORAGE);
  } catch {
    return null;
  }
}

export async function computeWorkerKey(passcode: string): Promise<string> {
  return sha256Hex(WORKER_KEY_SALT + passcode);
}

export function clearWorkerKey(): void {
  try {
    localStorage.removeItem(WORKER_KEY_STORAGE);
  } catch {
    // ignore
  }
}

export function getConfiguredPasscodeHash(): string {
  return (import.meta.env.VITE_PASSCODE_HASH || '').trim().toLowerCase();
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPasscode(rawInput: string): Promise<boolean> {
  const expected = getConfiguredPasscodeHash();
  if (!expected) return false;
  const candidate = await sha256Hex(rawInput);
  const ok = timingSafeEqual(candidate.toLowerCase(), expected);
  if (ok) {
    // Derive the Worker key (SHA-256 of "aibrain-worker:" + passcode) and persist it.
    // This value is NOT in the public bundle; it is what authorizes the token worker.
    try {
      localStorage.setItem(WORKER_KEY_STORAGE, await computeWorkerKey(rawInput));
    } catch {
      // ignore storage errors
    }
  }
  return ok;
}

export function isDashboardUnlocked(): boolean {
  const expected = getConfiguredPasscodeHash();
  if (!expected) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.unlockedUntil);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { until: number; hashPrefix: string };
    return (
      typeof parsed.until === 'number' &&
      parsed.until > Date.now() &&
      parsed.hashPrefix === expected.slice(0, 12)
    );
  } catch {
    return false;
  }
}

export function persistUnlockState(remember: boolean): void {
  const expected = getConfiguredPasscodeHash();
  const payload = JSON.stringify({
    until: Date.now() + (remember ? UNLOCK_DURATION_MS : 1000 * 60 * 60 * 6),
    hashPrefix: expected.slice(0, 12),
  });
  try {
    localStorage.setItem(STORAGE_KEYS.unlockedUntil, payload);
  } catch {
    // ignore
  }
}

export function lockDashboardNow(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.unlockedUntil);
    clearWorkerKey();
  } catch {
    // ignore
  }
}
