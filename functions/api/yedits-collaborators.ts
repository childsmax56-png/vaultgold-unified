import { json, options } from './_auth';
import { checkOwnerOrClaim, ensureCollaboratorsTable, getAuthUser, isYeditsAdmin } from './_yedits-auth';

export const onRequestOptions: PagesFunction<Env> = async () => options();

// GET ?profile=<creatorName> — list of usernames collaborating on a profile.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const profile = url.searchParams.get('profile')?.trim();
  if (!profile || !DB) return json({ collaborators: [] });

  await ensureCollaboratorsTable(DB);
  const rows = await DB.prepare(
    'SELECT username FROM yeditsgold_collaborators WHERE profile_name = ?'
  ).bind(profile).all<{ username: string }>();

  return json({ collaborators: rows.results.map(r => r.username) });
};

// POST — add a collaborator. { token, profileName, username }
// Only someone already authorized to edit the profile (owner, admin, claim
// holder, or existing collaborator) may add another collaborator.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  let body: { token?: string; profileName?: string; username?: string };
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, username } = body;
  const profileName = body.profileName?.trim();
  const newUsername = username?.trim();
  if (!token || !profileName || !newUsername) return json({ error: 'Missing fields' }, 400);

  const requester = await getAuthUser(token);
  if (!requester) return json({ error: 'Unauthorized — sign in first' }, 401);

  const allowed = await checkOwnerOrClaim(token, profileName, context.env);
  if (!allowed) return json({ error: 'Only the project owner can add collaborators' }, 403);

  if (newUsername.toLowerCase() === profileName.toLowerCase()) {
    return json({ error: `${newUsername} is already the owner` }, 409);
  }

  await ensureCollaboratorsTable(DB);
  const existing = await DB.prepare(
    `SELECT id FROM yeditsgold_collaborators WHERE profile_name = ? AND username = ? COLLATE NOCASE`
  ).bind(profileName, newUsername).first();
  if (existing) return json({ error: `${newUsername} is already a collaborator` }, 409);

  await DB.prepare(
    `INSERT INTO yeditsgold_collaborators (id, profile_name, username, added_by, added_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(crypto.randomUUID(), profileName, newUsername, requester.username, new Date().toISOString()).run();

  return json({ ok: true });
};

// DELETE — remove a collaborator. { token, profileName, username }
// Restricted to the original owner (username === profileName) or an admin,
// so collaborators can't remove each other.
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  let body: { token?: string; profileName?: string; username?: string };
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, username } = body;
  const profileName = body.profileName?.trim();
  const targetUsername = username?.trim();
  if (!token || !profileName || !targetUsername) return json({ error: 'Missing fields' }, 400);

  const requester = await getAuthUser(token);
  if (!requester) return json({ error: 'Unauthorized — sign in first' }, 401);

  const isRootOwner = requester.username.toLowerCase() === profileName.toLowerCase();
  const isAdmin = await isYeditsAdmin(DB, requester.id, requester.email);

  if (!isRootOwner && !isAdmin) {
    return json({ error: 'Only the project owner can remove collaborators' }, 403);
  }

  await ensureCollaboratorsTable(DB);
  await DB.prepare(
    `DELETE FROM yeditsgold_collaborators WHERE profile_name = ? AND username = ? COLLATE NOCASE`
  ).bind(profileName, targetUsername).run();

  return json({ ok: true });
};
