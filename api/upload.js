// netlify/functions/upload.js
const { supabaseAdmin, ok, err, checkAuth, cors } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Méthode non supportée', 405);
  if (!checkAuth(event)) return err('Non autorisé', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    // body.file = base64 string, body.filename, body.mimetype
    const { file, filename, mimetype } = body;
    if (!file || !filename) return err('Fichier manquant');

    const db = supabaseAdmin();
    const buffer = Buffer.from(file, 'base64');
    const ext = filename.split('.').pop().toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await db.storage
      .from('article-images')
      .upload(safeName, buffer, {
        contentType: mimetype || 'image/jpeg',
        upsert: false,
      });

    if (error) return err(error.message, 500);

    const { data: { publicUrl } } = db.storage
      .from('article-images')
      .getPublicUrl(safeName);

    return ok({ url: publicUrl });
  } catch (e) {
    return err(e.message, 500);
  }
};
