// Link a Reddit account by username — no OAuth.
//
//   POST /api/auth/reddit-link   body { username }  (Bearer vg_token)
//     → validates the handle, fetches the user's PUBLIC avatar from Reddit's
//       about.json, and stores it as an (unverified) link.
//
// Reddit closed self-service OAuth app registration in late 2025 (the
// "Responsible Builder Policy" gates every new token behind manual approval),
// so real verification isn't practical for a small site. Instead the user just
// tells us their handle; we pull their public snoovatar/avatar to make the link
// look right, clearly marked unverified in the UI. Avatar fetch is best-effort:
// if Reddit blocks or rate-limits the request we still save the username.
import { json, options, getSession } from '../_auth';
import { upsertLinkedService, maybeInheritAvatar } from './_linked';

export const onRequestOptions = options;

// Reddit handles: 3–20 chars, letters/digits/underscore/hyphen.
const USERNAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
// A descriptive UA is required or Reddit 429/403s the request.
const UA = 'web:cc.unvaulted.profile-link:v1.0 (by /u/unvaulted)';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  let body: { username?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const username = (body.username || '').trim().replace(/^\/?u\//i, '').replace(/^@/, '');
  if (!USERNAME_RE.test(username)) {
    return json({ error: 'Enter a valid Reddit username (3–20 letters, numbers, _ or -)' }, 400);
  }

  let avatarUrl: string | null = null;
  let warning: string | undefined;
  try {
    const res = await fetch(`https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (res.status === 404) return json({ error: 'That Reddit user doesn’t exist' }, 404);
    if (res.ok) {
      const data: { data?: { snoovatar_img?: string; icon_img?: string } } = await res.json();
      const raw = data.data?.snoovatar_img || data.data?.icon_img || '';
      // about.json HTML-encodes the query string (&amp;) and appends a size query.
      avatarUrl = raw ? raw.replace(/&amp;/g, '&').split('?')[0] || raw.replace(/&amp;/g, '&') : null;
    } else {
      warning = 'Saved your username, but Reddit blocked the avatar fetch — you can upload a picture instead.';
    }
  } catch {
    warning = 'Saved your username, but the avatar couldn’t be fetched right now.';
  }

  await upsertLinkedService(env.DB, session.user_id, 'reddit', { username, avatarUrl });
  await maybeInheritAvatar(env.DB, session.user_id, avatarUrl);

  return json({ ok: true, username, avatarUrl, warning });
};
