const { createClient } = require('@supabase/supabase-js');
function db() { return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); }
function auth(req) {
  const t = (req.headers['authorization']||'').replace('Bearer ','');
  return t === (process.env.ADMIN_PASSWORD||'') || t === (process.env.WEBHOOK_SECRET||'');
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method==='OPTIONS') return res.status(200).end();
  const { id } = req.query;
  if (req.method==='GET') {
    const {data,error} = await db().from('social_posts').select('*').order('position').order('created_at',{ascending:false});
    if (error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if (!auth(req)) return res.status(401).json({error:'Non autorise'});
  if (req.method==='POST') {
    const b = req.body;
    if (!b.platform||!b.embed_code) return res.status(400).json({error:'Manquant'});
    const {data,error} = await db().from('social_posts').insert({platform:b.platform,username:b.username||null,post_date:b.post_date||null,embed_code:b.embed_code,position:b.position||0}).select().single();
    if (error) return res.status(500).json({error:error.message});
    return res.status(201).json(data);
  }
  if (req.method==='DELETE'&&id) {
    await db().from('social_posts').delete().eq('id',id);
    return res.status(200).json({deleted:true});
  }
  return res.status(405).json({error:'Methode non supportee'});
}
