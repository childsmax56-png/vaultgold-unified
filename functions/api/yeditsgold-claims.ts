import { json } from './_auth';

async function ensureTable(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS yeditsgold_claims (
      id TEXT PRIMARY KEY,
      profile_name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      claimed_at TEXT NOT NULL,
      reviewed_at TEXT,
      UNIQUE(profile_name)
    )
  `);
}

// GET — returns all approved claims as { profileName: userId }
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({});

  await ensureTable(DB);

  const rows = await DB.prepare(
    `SELECT profile_name, user_id, username FROM yeditsgold_claims WHERE status = 'approved'`
  ).all<{ profile_name: string; user_id: string; username: string }>();

  const claims: Record<string, { userId: string; username: string }> = {};
  for (const row of rows.results) {
    claims[row.profile_name] = { userId: row.user_id, username: row.username };
  }

  return new Response(JSON.stringify(claims), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
