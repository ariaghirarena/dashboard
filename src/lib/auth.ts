import { STORAGE_KEYS } from './config';

const UNLOCK_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days remembered on trusted browser

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
  return timingSafeEqual(candidate.toLowerCase(), expected);
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
  } catch {
    // ignore
  }
}
