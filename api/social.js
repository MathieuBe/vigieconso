const { createClient } = require('@supabase/supabase-js');

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}
function checkAuth(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  return token === (process.env.ADMIN_PASSWORD||'') || token === (process.env.WEBHOOK_SECRET||'');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = supabaseAdmin();
  const id = req.query.id || null;

  if (req.method === 'GET') {
    const { data, error } = await db.from('social_posts').select('*').order('position').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (!checkAuth(req)) return res.status(401).json({ error: 'Non autorise' });

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.platform || !body.embed_code) return res.status(400).json({ error: 'Plateforme et embed obligatoires' });
    const { data, error } = await db.from('social_posts').insert({
      platform: body.platform, username: body.username || null,
      post_date: body.post_date || null, embed_code: body.embed_code, position: body.position || 0,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE' && id) {
    const { error } = await db.from('social_posts').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Methode non supportee' });
};
