import { ensureCommunityTables, isSlugAvailable, json } from './_db';

// GET /api/community/check-slug?slug=foo — live availability check for the builder.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const slug = (new URL(request.url).searchParams.get('slug') || '').trim().toLowerCase();
  await ensureCommunityTables(env.DB);
  const avail = await isSlugAvailable(env.DB, slug);
  return json({ slug, available: avail.ok, reason: avail.reason ?? null });
};
