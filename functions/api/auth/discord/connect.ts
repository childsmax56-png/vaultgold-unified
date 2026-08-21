// Kick off Discord account linking for the signed-in user.
//
//   GET /api/auth/discord/connect?token=<vg_token>&return_to=<url>
//     → 302 to Discord's OAuth consent screen.
//
// Mirrors the Spotify connect flow: the session token + return_to ride along in
// `state` (Discord doesn't need PKCE since the callback exchanges the code with
// the client secret). Scope is just `identify` — username + avatar, nothing more.
import { options, getSession, CORS_HEADERS } from '../../_auth';

export const onRequestOptions = options;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token') ?? undefined;
  const authRequest = tokenFromQuery
    ? new Request(request.url, { headers: { Authorization: `Bearer ${tokenFromQuery}` } })
    : request;
  const session = await getSession(authRequest, env.DB);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (!env.DISCORD_CLIENT_ID) {
    return new Response(JSON.stringify({ error: 'Discord not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const returnTo = url.searchParams.get('return_to') || '';
  const sessionToken = tokenFromQuery ?? request.headers.get('Authorization')?.slice(7) ?? '';
  const state = btoa(JSON.stringify({ token: sessionToken, r: returnTo }));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.DISCORD_CLIENT_ID,
    scope: 'identify',
    redirect_uri: `${url.origin}/api/auth/discord/callback`,
    state,
    prompt: 'consent',
  });

  return Response.redirect(`https://discord.com/oauth2/authorize?${params}`, 302);
};
