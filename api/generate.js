const { createClient } = require('@supabase/supabase-js');
function auth(req) {
  const t = (req.headers['authorization']||'').replace('Bearer ','');
  return t===(process.env.ADMIN_PASSWORD||'')||t===(process.env.WEBHOOK_SECRET||'');
}
function slug(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).end();
  if (!auth(req)) return res.status(401).json({error:'Non autorise'});
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({error:'Cle API manquante'});
  try {
    const {sheetUrl,instructions,post,consigne,autoPublish} = req.body;
    let summary='', count=0;
    if (post) {
      summary='--- Post 1 ---\nContenu : '+post+(consigne?'\nConsigne : '+consigne:'');
      count=1;
    } else {
      if (!sheetUrl) return res.status(400).json({error:'URL manquante'});
      const m = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!m) return res.status(400).json({error:'URL invalide'});
      const gm = sheetUrl.match(/gid=(\d+)/);
      const csv = await fetch('https://docs.google.com/spreadsheets/d/'+m[1]+'/export?format=csv'+(gm?'&gid='+gm[1]:'')).then(r=>r.text());
      const lines = csv.split('\n').map(l=>{
        const f=[],cur={v:'',q:false};
        for(const c of l){if(c==='"'){cur.q=!cur.q}else if(c===','&&!cur.q){f.push(cur.v.trim());cur.v=''}else{cur.v+=c}}
        f.push(cur.v.trim());return f;
      });
      const sel = lines.slice(1).filter(r=>(r[3]||'').trim().toUpperCase()==='OUI');
      if (!sel.length) throw new Error('Aucune ligne OUI dans colonne D');
      summary = sel.map((r,i)=>'--- Post '+(i+1)+' ---\nContenu : '+(r[2]||'')+(r[13]?'\nConsigne : '+r[13]:'')).join('\n\n');
      count = sel.length;
    }
    const prompt = 'Tu es journaliste Vigie Conso. Posts ('+count+') :\n\n'+summary+'\n\n'+(instructions?'Instructions : '+instructions+'\n\n':'')+'Format : titre 12 mots max, chapeau 2 phrases, corps 2-3 parties H2.\nJSON uniquement sans markdown : {"title":"...","category":"Industrie|Distribution|Finance|Energie|Agroalimentaire","author":"Redaction Vigie Conso","lead":"...","body":"<h2>...</h2><p>...</p>"}';
    const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:3000,messages:[{role:'user',content:prompt}]})});
    if (!r.ok) { const e=await r.json(); throw new Error((e.error&&e.error.message)||'Erreur API'); }
    const d = await r.json();
    const art = JSON.parse(d.content[0].text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,''));
    if (autoPublish) {
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const sl = slug(art.title)+'-'+Date.now().toString(36);
      const {error} = await db.from('articles').insert({title:art.title,slug:sl,category:art.category,author:art.author,lead:art.lead,body:art.body,image_url:null,published:true,published_at:new Date().toISOString()});
      if (error) throw new Error(error.message);
      return res.status(200).json({published:true,slug:sl,url:'/article/'+sl,title:art.title});
    }
    art._meta={postsCount:count};
    return res.status(200).json(art);
  } catch(e) { return res.status(500).json({error:e.message}); }
}
