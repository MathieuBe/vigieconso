function checkAuth(req) {
  const token = (req.headers['authorization']||'').replace('Bearer ','');
  return token === (process.env.ADMIN_PASSWORD||'') || token === (process.env.WEBHOOK_SECRET||'');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non supportee' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'Non autorise' });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Cle API Anthropic manquante' });

  try {
    const { sheetUrl, instructions, post, consigne, autoPublish } = req.body;
    let postsSummary = '', postsCount = 0;

    if (post) {
      postsSummary = '--- Post 1 ---\nContenu : ' + post + (consigne ? '\nConsigne : ' + consigne : '');
      postsCount = 1;
    } else {
      if (!sheetUrl) return res.status(400).json({ error: 'URL Google Sheet manquante' });
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!idMatch) return res.status(400).json({ error: 'URL invalide' });
      const gidMatch = sheetUrl.match(/gid=(\d+)/);
      const csvUrl = 'https://docs.google.com/spreadsheets/d/' + idMatch[1] + '/export?format=csv' + (gidMatch ? '&gid=' + gidMatch[1] : '');
      const csvResp = await fetch(csvUrl);
      if (!csvResp.ok) throw new Error('Impossible de lire le Sheet');
      const csv = await csvResp.text();

      function parseCSVLine(line) {
        var fields = [], current = '', inQuotes = false;
        for (var i = 0; i < line.length; i++) {
          var ch = line[i];
          if (ch === '"') { inQuotes = !inQuotes; }
          else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
          else { current += ch; }
        }
        fields.push(current.trim());
        return fields;
      }

      var lines = csv.split('\n').map(parseCSVLine);
      var COL_POST = 2, COL_EDITO = 3, COL_CONSIGNE = 13;
      var selected = lines.slice(1).filter(function(r) { return (r[COL_EDITO]||'').trim().toUpperCase() === 'OUI'; });
      if (!selected.length) throw new Error('Aucune ligne avec OUI dans la colonne Edito');

      postsSummary = selected.map(function(r, i) {
        return '--- Post ' + (i+1) + ' ---\nContenu : ' + (r[COL_POST]||'') + (r[COL_CONSIGNE] ? '\nConsigne : ' + r[COL_CONSIGNE] : '');
      }).join('\n\n');
      postsCount = selected.length;
    }

    var prompt = 'Tu es journaliste senior pour Vigie Conso ("Ce que les consommateurs disent avant que les entreprises l entendent").\n\n'
      + 'Posts selectionnes (' + postsCount + ') :\n\n' + postsSummary + '\n\n'
      + (instructions ? 'Instructions : ' + instructions + '\n\n' : '')
      + 'Format IMPERATIF : titre max 12 mots, chapeau exactement 2 phrases, corps 2-3 parties avec H2.\n\n'
      + 'Reponds UNIQUEMENT avec JSON valide sans markdown :\n'
      + '{"title":"...","category":"Industrie|Distribution|Finance|Energie|Agroalimentaire","author":"Redaction Vigie Conso","lead":"Phrase 1. Phrase 2.","body":"<h2>...</h2><p>...</p>"}';

    var aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!aiResp.ok) { var e = await aiResp.json(); throw new Error((e.error&&e.error.message)||'Erreur API'); }
    var aiData = await aiResp.json();
    var text = aiData.content[0].text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
    var article = JSON.parse(text);

    if (autoPublish) {
      const { createClient } = require('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      function slugify(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
      var slug = slugify(article.title) + '-' + Date.now().toString(36);
      var { error } = await db.from('articles').insert({ title: article.title, slug, category: article.category, author: article.author, lead: article.lead, body: article.body, image_url: null, published: true, published_at: new Date().toISOString() });
      if (error) throw new Error('Supabase: ' + error.message);
      return res.status(200).json({ published: true, slug, url: '/article/' + slug, title: article.title });
    }

    article._meta = { postsCount };
    return res.status(200).json(article);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
