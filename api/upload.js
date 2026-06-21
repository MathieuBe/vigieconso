const { createClient } = require('@supabase/supabase-js');
function auth(req) { return (req.headers['authorization']||'').replace('Bearer ','') === (process.env.ADMIN_PASSWORD||''); }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).end();
  if (!auth(req)) return res.status(401).json({error:'Non autorise'});
  try {
    const {file,filename,mimetype} = req.body;
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const buffer = Buffer.from(file,'base64');
    const ext = filename.split('.').pop();
    const name = Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+ext;
    const {error} = await db.storage.from('article-images').upload(name,buffer,{contentType:mimetype||'image/jpeg'});
    if (error) return res.status(500).json({error:error.message});
    const {data:{publicUrl}} = db.storage.from('article-images').getPublicUrl(name);
    return res.status(200).json({url:publicUrl});
  } catch(e) { return res.status(500).json({error:e.message}); }
}
