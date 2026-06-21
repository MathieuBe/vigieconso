const { createClient } = require('@supabase/supabase-js');

function db() { return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); }
function auth(req) {
  const t = (req.headers['authorization']||'').replace('Bearer ','');
  return t === (process.env.ADMIN_PASSWORD||'') || t === (process.env.WEBHOOK_SECRET||'');
}
function slug(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method==='OPTIONS') return res.status(200).end();

  const { slug: s } = req.query;

  if (req.method==='GET' && !s) {
    const all = req.query.all==='1';
    if (all && !auth(req)) return res.status(401).json({error:'Non autorise'});
    let q = db().from('articles').select('id,title,slug,category,author,lead,image_url,published,published_at,created_at');
    if (!all) q = q.eq('published',true);
    q = q.order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
    const {data,error} = await q;
    if (error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }

  if (req.method==='GET' && s) {
    const {data,error} = await db().from('articles').select('*').eq('slug',s).single();
    if (error) return res.status(404).json({error:'Introuvable'});
    if (!data.published && !auth(req)) return res.status(404).json({error:'Introuvable'});
    return res.status(200).json(data);
  }

  if (!auth(req)) return res.status(401).json({error:'Non autorise'});

  if (req.method==='POST') {
    const b = req.body;
    if (!b.title) return res.status(400).json({error:'Titre obligatoire'});
    const {data,error} = await db().from('articles').insert({
      title:b.title, slug:slug(b.title), category:b.category, author:b.author||null,
      lead:b.lead||null, body:b.body||null, image_url:b.image_url||null,
      published:b.published||false, published_at:b.published?new Date().toISOString():null
    }).select().single();
    if (error) return res.status(500).json({error:error.message});
    return res.status(201).json(data);
  }

  if (req.method==='PUT' && s) {
    const b = req.body;
    const {data:ex} = await db().from('articles').select('id,published_at').eq('slug',s).single();
    if (!ex) return res.status(404).json({error:'Introuvable'});
    const {data,error} = await db().from('articles').update({
      ...(b.title&&{title:b.title,slug:slug(b.title)}),
      ...(b.category!==undefined&&{category:b.category}),
      ...(b.author!==undefined&&{author:b.author}),
      ...(b.lead!==undefined&&{lead:b.lead}),
      ...(b.body!==undefined&&{body:b.body}),
      ...(b.image_url!==undefined&&{image_url:b.image_url}),
      ...(b.published!==undefined&&{published:b.published,published_at:b.published&&!ex.published_at?new Date().toISOString():ex.published_at}),
    }).eq('id',ex.id).select().single();
    if (error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }

  if (req.method==='DELETE' && s) {
    await db().from('articles').delete().eq('slug',s);
    return res.status(200).json({deleted:true});
  }

  return res.status(405).json({error:'Methode non supportee'});
}
