const { createClient } = require('@supabase/supabase-js');

function checkAuth(req) {
  const token = (req.headers['authorization']||'').replace('Bearer ','');
  return token === (process.env.ADMIN_PASSWORD||'');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non supportee' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'Non autorise' });

  try {
    const { file, filename, mimetype } = req.body;
    if (!file || !filename) return res.status(400).json({ error: 'Fichier manquant' });
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const buffer = Buffer.from(file, 'base64');
    const ext = filename.split('.').pop().toLowerCase();
    const safeName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { error } = await db.storage.from('article-images').upload(safeName, buffer, { contentType: mimetype || 'image/jpeg' });
    if (error) return res.status(500).json({ error: error.message });
    const { data: { publicUrl } } = db.storage.from('article-images').getPublicUrl(safeName);
    return res.status(200).json({ url: publicUrl });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
