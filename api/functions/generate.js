// netlify/functions/generate.js
const { ok, err, checkAuth, cors } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Methode non supportee', 405);

  // Support both admin token AND a dedicated webhook secret for Apps Script
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
  const authHeader = event.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  const isAuthed = token === ADMIN_PASSWORD || (WEBHOOK_SECRET && token === WEBHOOK_SECRET);
  if (!isAuthed) return err('Non autorise', 401);

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return err('Cle API Anthropic manquante', 500);

  try {
    const body = JSON.parse(event.body || '{}');
    const sheetUrl   = body.sheetUrl   || '';
    const instructions = body.instructions || '';
    // Direct mode: Apps Script sends post content + consigne directly (no sheet fetch needed)
    const directPost    = body.post     || '';
    const directConsigne = body.consigne || '';
    const autoPublish   = body.autoPublish === true;

    let postsSummary = '';
    let postsCount   = 0;
    let sheetId = '', gid = '0';

    if (directPost) {
      // Called directly by Google Apps Script with row data
      postsSummary = '--- Post 1 ---\nContenu : ' + directPost
        + (directConsigne ? '\nConsigne editoriale : ' + directConsigne : '');
      postsCount = 1;
    } else {
      // Called from back-office with Sheet URL
      if (!sheetUrl) return err('URL Google Sheet ou contenu de post manquant');
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!idMatch) return err('URL Google Sheets invalide');
      sheetId = idMatch[1];
      const gidMatch = sheetUrl.match(/gid=(\d+)/);
      gid = gidMatch ? gidMatch[1] : '0';

      const csvUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/export?format=csv&gid=' + gid;
      const csvResp = await fetch(csvUrl);
      if (!csvResp.ok) throw new Error('Impossible de lire le Sheet. Verifiez le partage public en lecture.');
      const csv = await csvResp.text();
      if (!csv.trim()) throw new Error('Le Google Sheet semble vide.');

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
      if (lines.length < 2) throw new Error('Pas assez de donnees dans le Sheet.');

      // C=2, E=4, N=13
      var COL_POST = 2, COL_EDITO = 4, COL_CONSIGNE = 13;

      var selectedPosts = lines.slice(1).filter(function(row) {
        return (row[COL_EDITO] || '').trim().toUpperCase() === 'OUI';
      });
      if (!selectedPosts.length) throw new Error('Aucune ligne avec "OUI" dans la colonne Edito (col E).');

      postsSummary = selectedPosts.map(function(row, i) {
        var post     = (row[COL_POST]     || '').trim();
        var consigne = (row[COL_CONSIGNE] || '').trim();
        return '--- Post ' + (i+1) + ' ---\nContenu : ' + post
          + (consigne ? '\nConsigne editoriale : ' + consigne : '');
      }).join('\n\n');
      postsCount = selectedPosts.length;
    }

    var allInstructions = instructions || '';

    var prompt = 'Tu es un journaliste senior de Vigie Conso'
      + ' ("Ce que les consommateurs disent avant que les entreprises l\'entendent").\n\n'
      + 'Posts consommateurs selectionnes (' + postsCount + ') :\n\n'
      + postsSummary + '\n\n'
      + (allInstructions ? 'Instructions : ' + allInstructions + '\n\n' : '')
      + 'Redige un article de presse en respectant IMPERATIVEMENT ce format :\n'
      + '- Titre : maximum 12 mots, percutant, journalistique\n'
      + '- Chapeau (lead) : exactement 2 phrases, faits cles et chiffres si disponibles\n'
      + '- Corps : 2 ou 3 parties avec sous-titres H2, style factuel, angle consommateur,\n'
      + '  cite les posts comme signaux, analyse la tendance emergente\n\n'
      + 'Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :\n'
      + '{"title":"Titre max 12 mots",'
      + '"category":"Industrie|Distribution|Finance|Energie|Agroalimentaire",'
      + '"author":"Redaction Vigie Conso",'
      + '"lead":"Phrase 1. Phrase 2.",'
      + '"body":"<h2>Sous-titre 1</h2><p>...</p><h2>Sous-titre 2</h2><p>...</p>"}';

    var aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      var e = await aiResp.json();
      throw new Error((e.error && e.error.message) || 'Erreur API Anthropic');
    }

    var aiData = await aiResp.json();
    var text = aiData.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    var article = JSON.parse(text);

    // If called by Apps Script with autoPublish=true, save directly to Supabase
    if (autoPublish) {
      const { createClient } = require('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

      function slugify(t) {
        return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
          .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      }
      var slug = slugify(article.title);
      // Ensure unique slug
      var ts = Date.now().toString(36);
      var finalSlug = slug + '-' + ts;

      var payload = {
        title:       article.title,
        slug:        finalSlug,
        category:    article.category,
        author:      article.author,
        lead:        article.lead,
        body:        article.body,
        image_url:   null,
        published:   true,
        published_at: new Date().toISOString(),
      };

      var result = await db.from('articles').insert(payload).select().single();
      if (result.error) throw new Error('Supabase insert error: ' + result.error.message);

      return ok({
        published: true,
        slug: finalSlug,
        url: '/article/' + finalSlug,
        title: article.title,
      });
    }

    // Otherwise return article data to back-office
    article._meta = { postsCount: postsCount };
    return ok(article);

  } catch(e) {
    console.error('Generate error:', e.message);
    return err(e.message, 500);
  }
};
