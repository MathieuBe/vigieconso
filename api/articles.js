// netlify/functions/articles.js
const { supabaseAdmin, ok, err, checkAuth, slugify, cors } = require('./_shared');

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };

  const db = supabaseAdmin();
  const method = event.httpMethod;
  const path = event.path.replace(/^\/api\/articles\/?/, '');
  const slug = path.split('/')[0] || null;

  // ── GET /api/articles ── (public, published only)
  // ── GET /api/articles?all=1 ── (admin, all)
  if (method === 'GET' && !slug) {
    const isAdmin = checkAuth(event);
    const all = event.queryStringParameters?.all === '1';
    if (all && !isAdmin) return err('Non autorisé', 401);

    let query = db.from('articles').select('id,title,slug,category,author,lead,image_url,published,published_at,created_at,updated_at');
    if (!all) query = query.eq('published', true);
    query = query.order('published_at', { ascending: false, nullsFirst: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) return err(error.message, 500);
    return ok(data);
  }

  // ── GET /api/articles/:slug ── (public for published, admin for drafts)
  if (method === 'GET' && slug) {
    const isAdmin = checkAuth(event);
    let query = db.from('articles').select('*').eq('slug', slug).single();
    const { data, error } = await query;
    if (error) return err('Article introuvable', 404);
    if (!data.published && !isAdmin) return err('Article introuvable', 404);
    return ok(data);
  }

  // All write operations require auth
  if (!checkAuth(event)) return err('Non autorisé', 401);

  // ── POST /api/articles ── create
  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    if (!body.title) return err('Titre obligatoire');

    const slug = slugify(body.title);
    const payload = {
      title: body.title,
      slug,
      category: body.category,
      author: body.author || null,
      lead: body.lead || null,
      body: body.body || null,
      image_url: body.image_url || null,
      published: body.published || false,
      published_at: body.published ? new Date().toISOString() : null,
    };

    const { data, error } = await db.from('articles').insert(payload).select().single();
    if (error) return err(error.message, 500);
    return ok(data, 201);
  }

  // ── PUT /api/articles/:slug ── update
  if (method === 'PUT' && slug) {
    const body = JSON.parse(event.body || '{}');
    const { data: existing } = await db.from('articles').select('id,published,published_at').eq('slug', slug).single();
    if (!existing) return err('Article introuvable', 404);

    const newSlug = body.title ? slugify(body.title) : slug;
    const payload = {
      ...(body.title && { title: body.title, slug: newSlug }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.author !== undefined && { author: body.author }),
      ...(body.lead !== undefined && { lead: body.lead }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.image_url !== undefined && { image_url: body.image_url }),
      ...(body.published !== undefined && {
        published: body.published,
        published_at: body.published && !existing.published_at ? new Date().toISOString() : existing.published_at
      }),
    };

    const { data, error } = await db.from('articles').update(payload).eq('id', existing.id).select().single();
    if (error) return err(error.message, 500);
    return ok(data);
  }

  // ── DELETE /api/articles/:slug ──
  if (method === 'DELETE' && slug) {
    const { error } = await db.from('articles').delete().eq('slug', slug);
    if (error) return err(error.message, 500);
    return ok({ deleted: true });
  }

  return err('Méthode non supportée', 405);
};
