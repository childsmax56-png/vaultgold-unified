// Shared helpers for third-party account links (Discord, Reddit, …).
//
// A link lives in the `linked_services` row keyed by (user_id, service) and
// carries the service handle + that service's avatar. When a user links an
// account and hasn't set a profile picture of their own, we "inherit" the
// service avatar so their comments light up immediately — but we never
// overwrite an avatar they uploaded or already inherited.
import { ensureProfileColumns } from './_profile-schema';

export interface LinkFields {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  username?: string | null;
  avatarUrl?: string | null;
}

export async function upsertLinkedService(
  db: D1Database, userId: string, service: string, f: LinkFields,
): Promise<void> {
  await ensureProfileColumns(db);
  const now = Date.now();
  await db.prepare(
    `INSERT INTO linked_services
       (user_id, service, access_token, refresh_token, expires_at, service_username, avatar_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, service) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       service_username = excluded.service_username,
       avatar_url = excluded.avatar_url,
       updated_at = excluded.updated_at`
  ).bind(
    userId, service,
    f.accessToken ?? null, f.refreshToken ?? null, f.expiresAt ?? null,
    f.username ?? null, f.avatarUrl ?? null, now,
  ).run();
}

// Adopt `avatarUrl` as the account's profile picture only if none is set yet.
export async function maybeInheritAvatar(
  db: D1Database, userId: string, avatarUrl: string | null,
): Promise<void> {
  if (!avatarUrl) return;
  await db.prepare(
    'UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ? AND (avatar_url IS NULL OR avatar_url = "")'
  ).bind(avatarUrl, Date.now(), userId).run();
}
