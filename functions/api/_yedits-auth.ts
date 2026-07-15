// Site owner accounts — always admins, never removable via the DB revoke flow.
export const OWNER_EMAILS = ['vaultgold671@gmail.com', 'childsmax56@gmail.com'];

// Kept for backwards compatibility; prefer isOwnerEmail() for owner checks.
export const OWNER_EMAIL = OWNER_EMAILS[0];

export function isOwnerEmail(email: string | undefined | null): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}

export interface VGAuthUser {
  id: string;
  username: string;
  email: string;
}

export async function getAuthUser(token: string): Promise<VGAuthUser | null> {
  const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) return null;
  const authData = await authRes.json() as { user?: VGAuthUser };
  return authData.user ?? null;
}

export async function ensureCollaboratorsTable(db: D1Database) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS yeditsgold_collaborators (id TEXT PRIMARY KEY, profile_name TEXT NOT NULL, username TEXT NOT NULL, added_by TEXT NOT NULL, added_at TEXT NOT NULL, UNIQUE(profile_name, username COLLATE NOCASE))`
  ).run();
}

export async function isYeditsAdmin(db: D1Database, userId: string, email: string): Promise<boolean> {
  if (isOwnerEmail(email)) return true;
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS yeditsgold_admins (user_id TEXT PRIMARY KEY, username TEXT NOT NULL, email TEXT NOT NULL, granted_at TEXT NOT NULL)`
  ).run();
  const row = await db.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(userId).first();
  return !!row;
}

async function isCollaborator(db: D1Database, profileName: string, username: string): Promise<boolean> {
  await ensureCollaboratorsTable(db);
  const row = await db.prepare(
    `SELECT id FROM yeditsgold_collaborators WHERE profile_name = ? AND username = ? COLLATE NOCASE`
  ).bind(profileName, username).first();
  return !!row;
}

// True if `user` may edit/delete content under `creatorName`: the site owner,
// a yeditsgold admin, the original creator (username match), anyone with an
// approved claim on the profile, or a collaborator added by the owner/admin.
export async function checkOwnerOrClaim(token: string, creatorName: string, env: Env): Promise<boolean> {
  const user = await getAuthUser(token);
  if (!user) return false;

  if (isOwnerEmail(user.email)) return true;
  if (user.username.toLowerCase() === creatorName.toLowerCase()) return true;

  if (await isYeditsAdmin(env.DB, user.id, user.email)) return true;

  const claim = await env.DB.prepare(
    `SELECT user_id FROM yeditsgold_claims WHERE profile_name = ? AND status = 'approved' AND user_id = ?`
  ).bind(creatorName, user.id).first();
  if (claim) return true;

  return isCollaborator(env.DB, creatorName, user.username);
}
