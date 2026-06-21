const { createClient } = require('@supabase/supabase-js');
function auth(req) {
  const t = (req.headers['authorization']||'').replace('Bearer ','');
  return t===(process.env.ADMIN_PASSWORD||'')||t===(process.env.WEBHOOK_SECRET||'');
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method==='OPTIONS') return res.status(200).end();
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { slug } = req.query;
  if (req.method==='GET') {
    const {data,error} = await db.from('articles').select('*').eq('slug',slug).single();
    if (error) return res.status(404).json({error:'Introuvable'});
    if (!data.published && !auth(req)) return res.status(404).json({error:'Introuvable'});
    return res.status(200).json(data);
  }
  if (!auth(req)) return res.status(401).json({error:'Non autorise'});
  if (req.method==='PUT') {
    const b = req.body;
    const {data:ex} = await db.from('articles').select('id,published_at').eq('slug',slug).single();
    if (!ex) return res.status(404).json({error:'Introuvable'});
    const {data,error} = await db.from('articles').update({
      ...(b.title&&{title:b.title}),
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
  if (req.method==='DELETE') {
    await db.from('articles').delete().eq('slug',slug);
    return res.status(200).json({deleted:true});
  }
  return res.status(405).end();
}
