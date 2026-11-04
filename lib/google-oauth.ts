import { getCloudflareContext } from "@opennextjs/cloudflare";

const TOKEN_KV_KEY = "google_tokens";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

type StoredTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
};

function oauthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!clientId || !clientSecret || !appUrl) {
    throw new Error(
      "Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / APP_URL)"
    );
  }
  const redirectUri = `${appUrl}/api/auth/callback/google`;
  return { clientId, clientSecret, redirectUri };
}

export function getGoogleAuthUrl(): string {
  const { clientId, redirectUri } = oauthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const { clientId, clientSecret, redirectUri } = oauthConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Google token exchange failed: ${data.error ?? res.status} ${data.error_description ?? ""}`
    );
  }
  if (!data.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Revoke app access at https://myaccount.google.com/permissions and reconnect."
    );
  }
  await storeTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
}

async function refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
  const { clientId, clientSecret } = oauthConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token refresh failed: ${data.error ?? res.status}`);
  }
  const tokens: StoredTokens = {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await storeTokens(tokens);
  return tokens;
}

async function getKv(): Promise<KVNamespace> {
  const { env } = await getCloudflareContext({ async: true });
  const kv = (env as unknown as Env).GTM_TOKENS;
  if (!kv) throw new Error("GTM_TOKENS KV namespace is not bound");
  return kv;
}

async function storeTokens(tokens: StoredTokens): Promise<void> {
  const kv = await getKv();
  await kv.put(TOKEN_KV_KEY, JSON.stringify(tokens));
}

async function readTokens(): Promise<StoredTokens | null> {
  const kv = await getKv();
  const raw = await kv.get(TOKEN_KV_KEY);
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

export async function isGmailConnected(): Promise<boolean> {
  return (await readTokens()) !== null;
}

export async function disconnectGmail(): Promise<void> {
  const kv = await getKv();
  await kv.delete(TOKEN_KV_KEY);
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await readTokens();
  if (!tokens) {
    throw new Error("Gmail is not connected");
  }
  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token;
  }
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  return refreshed.access_token;
}
