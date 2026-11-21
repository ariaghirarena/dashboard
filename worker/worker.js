/**
 * AI-Brain Drive Token Worker (single-user, personal use)
 *
 * Purpose: make "open the dashboard link anywhere -> enter passcode -> Google Drive is already connected" possible.
 * - The Google REFRESH token is stored inside Cloudflare KV, encrypted with AES-GCM (key derived from TOKEN_PEPPER).
 * - The browser NEVER sees the refresh token. It only asks this worker for a short-lived access token.
 * - Callers must present the derived WORKER_KEY (SHA-256 of "aibrain-worker:" + passcode) in the x-worker-key header.
 *   This value is NOT in the public JavaScript bundle. The passcode itself never leaves the user's device.
 *
 * One-time setup flow:
 *   1. Create Cloudflare Worker with this file, a KV namespace binding TOKENS, and the secrets:
 *      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, WORKER_KEY, TOKEN_PEPPER
 *   2. Add https://<worker>/callback as an Authorized redirect URI of the Google OAuth Web client.
 *   3. Visit https://<worker>/auth?key=<WORKER_KEY> once and approve access (the app is in Production mode,
 *      so no 7-day expiry). The refresh token is captured and stored encrypted.
 *
 * Runtime flow (called by the dashboard automatically):
 *   POST https://<worker>/token
 *   Header: x-worker-key: <WORKER_KEY>
 *   Response: { access_token, expires_in }
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
const VAULT_KEY_SALT = 'aibrain-vault:';

const ALLOWED_ORIGINS = new Set([
  'https://ariaghirarena.github.io',
  'http://localhost:5173',
]);

function corsHeaders(origin) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-worker-key, content-type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
  }
  return {};
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Compare two secrets without leaking length/content via early exit. */
async function timingSafeEqualStr(a, b) {
  const [ha, hb] = await Promise.all([sha256Hex(String(a)), sha256Hex(String(b))]);
  let diff = 0;
  for (let i = 0; i < ha.length; i += 1) {
    diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  }
  return diff === 0;
}

async function vaultKey(pepper) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(VAULT_KEY_SALT + pepper));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encryptSecret(plainText, pepper) {
  const key = await vaultKey(pepper);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText)
  );
  const out = new Uint8Array(iv.length + cipherBuffer.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipherBuffer), iv.length);
  return bytesToBase64(out);
}

async function decryptSecret(stored, pepper) {
  const bytes = base64ToBytes(stored);
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const key = await vaultKey(pepper);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(plainBuffer);
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

function htmlPage(title, bodyHtml) {
  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { font-family: Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { max-width: 560px; background: #1e293b; border-radius: 16px; padding: 32px; text-align: center; line-height: 2; }
  a { color: #38bdf8; }
</style>
</head>
<body><div class="card"><h2>${title}</h2><div>${bodyHtml}</div></div></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ---------- one-time authorization (visit once) ----------
    if (url.pathname === '/auth' && request.method === 'GET') {
      const key = url.searchParams.get('key') || '';
      if (!(await timingSafeEqualStr(key, env.WORKER_KEY || ''))) {
        return new Response('Forbidden', { status: 403 });
      }
      const redirectUri = `${url.origin}/callback`;
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('scope', DRIVE_SCOPE);
      authUrl.searchParams.set('state', key);
      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === '/callback' && request.method === 'GET') {
      const error = url.searchParams.get('error');
      if (error) {
        return htmlPage('اتصال لغو شد', `<p>خطا: <code>${error}</code></p><p><a href="/auth?key=ask-the-owner">تلاش دوباره</a></p>`);
      }
      const state = url.searchParams.get('state') || '';
      if (!(await timingSafeEqualStr(state, env.WORKER_KEY || ''))) {
        return new Response('Forbidden', { status: 403 });
      }
      const code = url.searchParams.get('code');
      if (!code) {
        return htmlPage('خطا', '<p>کد مجوز از گوگل دریافت نشد.</p>');
      }
      const redirectUri = `${url.origin}/callback`;
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.refresh_token) {
        return htmlPage(
          'Refresh Token دریافت نشد',
          '<p>احتمالاً قبلاً یک‌بار این اپ را در گوگل مجاز کرده‌اید.</p><p>به <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> بروید، دسترسی «AI-Brain Dashboard» را حذف کنید، و دوباره لینک <code>/auth</code> را باز کنید.</p>'
        );
      }
      const encrypted = await encryptSecret(tokens.refresh_token, env.TOKEN_PEPPER || '');
      await env.TOKENS.put('refresh_token', encrypted);
      return htmlPage(
        '✅ اتصال دائم ثبت شد',
        '<p>Refresh Token به‌صورت رمزنگاری‌شده در خزانه‌ی این سرویس ذخیره شد.</p><p>حالا از هر کامپیوتری، با باز کردن <a href="https://ariaghirarena.github.io/dashboard/">داشبورد</a> و زدن رمز، گوگل درایو <strong>خودکار</strong> وصل می‌شود — بدون هیچ کلیک اضافه.</p><p>این تب را ببندید.</p>'
      );
    }

    // ---------- runtime access-token minting (called by the dashboard) ----------
    if (url.pathname === '/token' && request.method === 'POST') {
      const key = request.headers.get('x-worker-key') || '';
      if (!(await timingSafeEqualStr(key, env.WORKER_KEY || ''))) {
        return json({ error: 'unauthorized' }, 401, origin);
      }
      const encrypted = await env.TOKENS.get('refresh_token');
      if (!encrypted) {
        return json({ error: 'not_authorized', hint: 'open /auth once to authorize' }, 409, origin);
      }
      let refreshToken;
      try {
        refreshToken = await decryptSecret(encrypted, env.TOKEN_PEPPER || '');
      } catch {
        return json({ error: 'vault_decrypt_failed', hint: 'TOKEN_PEPPER changed? re-run /auth' }, 500, origin);
      }
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.access_token) {
        return json(
          { error: 'refresh_failed', google: tokens.error || tokenRes.status },
          502,
          origin
        );
      }
      return json(
        { access_token: tokens.access_token, expires_in: tokens.expires_in || 3500 },
        200,
        origin
      );
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return json({ ok: true, service: 'aibrain-drive-token-worker' }, 200, origin);
    }

    return new Response('Not Found', { status: 404 });
  },
};
