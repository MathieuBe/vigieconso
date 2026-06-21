// netlify/functions/social.js
const { supabaseAdmin, ok, err, checkAuth, cors } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };

  const db = supabaseAdmin();
  const method = event.httpMethod;
  const id = event.path.replace(/^\/api\/social\/?/, '').split('/')[0] || null;

  // GET — public
  if (method === 'GET') {
    const { data, error } = await db.from('social_posts')
      .select('*').order('position').order('created_at', { ascending: false });
    if (error) return err(error.message, 500);
    return ok(data);
  }

  if (!checkAuth(event)) return err('Non autorisé', 401);

  // POST — create
  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    if (!body.platform || !body.embed_code) return err('Plateforme et code embed obligatoires');
    const { data, error } = await db.from('social_posts').insert({
      platform: body.platform,
      username: body.username || null,
      post_date: body.post_date || null,
      embed_code: body.embed_code,
      position: body.position || 0,
    }).select().single();
    if (error) return err(error.message, 500);
    return ok(data, 201);
  }

  // DELETE
  if (method === 'DELETE' && id) {
    const { error } = await db.from('social_posts').delete().eq('id', id);
    if (error) return err(error.message, 500);
    return ok({ deleted: true });
  }

  return err('Méthode non supportée', 405);
};
