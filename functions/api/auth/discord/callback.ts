// Complete Discord linking: exchange the code, read the profile, store the link.
//
// Mirrors spotify/callback.ts. On success we store the Discord handle + CDN
// avatar into linked_services and — if the account has no picture yet — inherit
// the Discord avatar as the profile picture so it shows on comments right away.
import { getSession, CORS_HEADERS } from '../../_auth';
import { upsertLinkedService, maybeInheritAvatar } from '../_linked';

const ALLOWED_RETURN = [
  'https://unvaulted.cc',
  'https://yzyarchives.org',
  'https://vampgold.pages.dev',
  'https://kdotgold.pages.dev',
  'https://drizzygold.pages.dev',
  'https://wolfgold.pages.dev',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
];

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  if (!code || !stateRaw) return errorPage('Missing code or state');

  let state: { token?: string; r?: string };
  try { state = JSON.parse(atob(stateRaw)); } catch { return errorPage('Invalid state'); }

  const { token, r: returnTo } = state;
  if (!token) return errorPage('Invalid state data');

  const session = await getSession(
    new Request(request.url, { headers: { Authorization: `Bearer ${token}` } }),
    env.DB,
  );
  if (!session) return errorPage('Session expired — please sign in again');

  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) return errorPage('Discord not configured');

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${url.origin}/api/auth/discord/callback`,
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
    }),
  });
  if (!tokenRes.ok) return errorPage('Discord token exchange failed');
  const tokenData: { access_token: string; refresh_token?: string; expires_in?: number } = await tokenRes.json();

  const profileRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) return errorPage('Could not read Discord profile');
  const p: { id: string; username: string; global_name?: string | null; avatar?: string | null } = await profileRes.json();

  const displayName = p.global_name || p.username;
  const avatarUrl = discordAvatarUrl(p.id, p.avatar);

  await upsertLinkedService(env.DB, session.user_id, 'discord', {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? null,
    expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
    username: displayName,
    avatarUrl,
  });
  await maybeInheritAvatar(env.DB, session.user_id, avatarUrl);

  if (returnTo && ALLOWED_RETURN.some(a => returnTo.startsWith(a))) {
    return Response.redirect(`${returnTo}?vg_discord_linked=1`, 302);
  }
  return new Response(successPage('Discord'), {
    headers: { 'Content-Type': 'text/html', ...CORS_HEADERS },
  });
};

// Full-size CDN avatar. Animated avatars (hash prefixed `a_`) are served as GIF;
// users with no custom avatar return null (they can upload one instead).
function discordAvatarUrl(id: string, hash: string | null | undefined): string | null {
  if (!hash) return null;
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=256`;
}

function errorPage(msg: string) {
  return new Response(`<!doctype html><html><body style="font-family:sans-serif;padding:2rem;background:#050505;color:#fff">
    <h2 style="color:#e55">Error</h2><p>${msg}</p>
    <p><a href="https://unvaulted.cc" style="color:#C9A224">Back to UNVAULTED</a></p>
  </body></html>`, { status: 400, headers: { 'Content-Type': 'text/html' } });
}

function successPage(service: string) {
  return `<!doctype html><html><head><script>
    try { localStorage.setItem('vg_linked', JSON.stringify({ service: '${service}', t: Date.now() })); } catch(e) {}
    if (window.opener) { window.opener.postMessage({ vaultgold: '${service}_linked' }, '*'); window.close(); }
    else { setTimeout(() => { window.location.href = 'https://unvaulted.cc/account'; }, 1500); }
  </script></head><body style="font-family:sans-serif;padding:2rem;background:#050505;color:#fff">
    <p style="color:#C9A224">${service} connected! You can close this window.</p>
  </body></html>`;
}
