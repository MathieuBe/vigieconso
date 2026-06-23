import { useState, useEffect, useRef } from "react"
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom"

// ── CONSTANTES ──
const BRAND = {
  navy: "#0D1B2A",
  red: "#E63946",
  gold: "#C9A84C",
  light: "#EEF0F2",
  border: "#DEE2E6",
  slate: "#6C757D",
}

const CATEGORIES = ["Industrie", "Distribution", "Finance", "Énergie", "Agroalimentaire"]

function toSlug(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── SPINNER ──
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${BRAND.light}`, borderTopColor: BRAND.red, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── HEADER ──
function Header({ articles = [] }) {
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const tickerRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 40)
    return () => clearInterval(id)
  }, [])

  const alerts = articles.slice(0, 5).map(a => a.title).filter(Boolean)
  const allAlerts = alerts.length ? [...alerts, ...alerts] : ['Vigie Conso — Ce que les consommateurs disent avant que les entreprises l\'entendent']

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: BRAND.navy }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none' }}>
          <div style={{ width: 44, height: 44, background: BRAND.red, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 26 26" fill="none" width="26" height="26">
              <circle cx="11" cy="11" r="6.5" stroke="white" strokeWidth="2.2" fill="none" />
              <path d="M16 16 L23 23" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="11" cy="11" r="2.5" fill="white" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '.04em', lineHeight: 1 }}>
              Vigie <span style={{ color: BRAND.red }}>Conso</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 3 }}>
              Ce que les consommateurs disent avant que les entreprises l'entendent
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 40px', overflowX: 'auto' }}>
        {['Accueil', ...CATEGORIES].map(cat => (
          <div key={cat} onClick={() => navigate(cat === 'Accueil' ? '/' : `/categorie/${toSlug(cat)}`)}
            style={{ padding: '13px 18px', fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', cursor: 'pointer', borderBottom: '3px solid transparent', whiteSpace: 'nowrap', transition: 'color .2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderBottomColor = BRAND.red }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.65)'; e.currentTarget.style.borderBottomColor = 'transparent' }}>
            {cat}
          </div>
        ))}
      </nav>

      {/* Ticker */}
      <div style={{ background: BRAND.red, overflow: 'hidden', padding: '7px 0', display: 'flex', alignItems: 'center' }}>
        <div style={{ background: '#C1121F', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '0 18px', height: 22, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0, marginRight: 20 }}>
          Alertes
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap' }}>
            {allAlerts.map((a, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 500, color: '#fff', paddingRight: 60, letterSpacing: '.02em' }}>
                ● {a}
              </span>
            ))}
          </div>
        </div>
        <style>{`@keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
      </div>
    </header>
  )
}

// ── CAROUSEL ──
function Carousel({ articles }) {
  const [cur, setCur] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!articles.length) return
    const id = setInterval(() => setCur(c => (c + 1) % articles.length), 6000)
    return () => clearInterval(id)
  }, [articles.length])

  if (!articles.length) return (
    <div style={{ height: '100vh', marginTop: 110, background: BRAND.navy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'rgba(255,255,255,.3)' }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Aucun article publié</div>
      <div style={{ fontSize: 13 }}>Le premier article apparaitra ici des sa publication</div>
    </div>
  )

  const a = articles[cur]

  return (
    <div style={{ position: 'relative', height: '100vh', marginTop: 110, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/article/${a.slug}`)}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: a.image_url ? `url('${a.image_url}')` : 'none',
        backgroundColor: BRAND.navy,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'opacity .7s'
      }} />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,27,42,.92) 0%, rgba(13,27,42,.45) 50%, rgba(13,27,42,.05) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '48px 80px 60px' }}>
        <div style={{ display: 'inline-block', background: BRAND.red, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', padding: '5px 14px', marginBottom: 18 }}>
          {a.category}
        </div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 3.5vw, 46px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, maxWidth: 780, marginBottom: 16 }}>
          {a.title}
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(248,249,250,.8)', lineHeight: 1.65, maxWidth: 640, fontWeight: 300 }}>
          {a.lead}
        </p>
        <div style={{ marginTop: 18, display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(248,249,250,.55)' }}>{a.author ? `Par ${a.author}` : ''}</span>
          <span style={{ fontSize: 12, color: BRAND.gold }}>{fmtDate(a.published_at || a.created_at)}</span>
        </div>
        <div style={{ display: 'inline-block', marginTop: 24, padding: '12px 28px', border: '1px solid rgba(248,249,250,.4)', color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Lire l article
        </div>
      </div>

      {/* Controls */}
      {articles.length > 1 && <>
        <button onClick={e => { e.stopPropagation(); setCur(c => (c - 1 + articles.length) % articles.length) }}
          style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)', background: 'rgba(13,27,42,.55)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          ‹
        </button>
        <button onClick={e => { e.stopPropagation(); setCur(c => (c + 1) % articles.length) }}
          style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', background: 'rgba(13,27,42,.55)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          ›
        </button>
        <div style={{ position: 'absolute', bottom: 28, right: 80, zIndex: 10, display: 'flex', gap: 8 }}>
          {articles.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setCur(i) }}
              style={{ width: i === cur ? 44 : 28, height: 3, background: i === cur ? BRAND.red : 'rgba(255,255,255,.3)', cursor: 'pointer', transition: 'all .25s' }} />
          ))}
        </div>
      </>}
    </div>
  )
}

// ── SOCIAL WALL ──
const PLAT_ICONS = { x: '𝕏', fb: 'f', ig: '📷', li: 'in', tt: '♪' }
const PLAT_COLORS = { x: '#000', fb: '#1877F2', ig: 'linear-gradient(135deg,#f09433,#bc1888)', li: '#0A66C2', tt: '#000' }

function SocialWall({ posts }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? posts : posts.filter(p => p.platform === filter)

  return (
    <section style={{ padding: '80px 40px', background: BRAND.light }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 44, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: BRAND.navy }}>
          Social <span style={{ color: BRAND.red }}>Wall</span>
        </h2>
        <p style={{ fontSize: 13, color: BRAND.slate, borderLeft: `2px solid ${BRAND.border}`, paddingLeft: 16, lineHeight: 1.5 }}>
          Ce que les consommateurs publient sur les reseaux
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
        {['all', 'x', 'fb', 'ig', 'li', 'tt'].map(p => (
          <button key={p} onClick={() => setFilter(p)}
            style={{ padding: '8px 18px', border: `1px solid ${filter === p ? BRAND.navy : BRAND.border}`, background: filter === p ? BRAND.navy : '#fff', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: filter === p ? '#fff' : BRAND.slate }}>
            {p === 'all' ? 'Tout' : PLAT_ICONS[p]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: BRAND.slate }}>Aucun post pour l instant.</div>
      ) : (
        <div style={{ columns: 4, columnGap: 20 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ breakInside: 'avoid', background: '#fff', border: `1px solid ${BRAND.border}`, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10, borderBottom: `1px solid ${BRAND.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: PLAT_COLORS[p.platform] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {PLAT_ICONS[p.platform]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username || p.platform}</div>
                </div>
                <div style={{ fontSize: 10, color: BRAND.slate, whiteSpace: 'nowrap' }}>{p.post_date || ''}</div>
              </div>
              <div
              ref={el => {
                if (!el) return;
                el.innerHTML = p.embed_code;
                // Re-execute scripts inside embed code
                el.querySelectorAll('script').forEach(old => {
                  const s = document.createElement('script');
                  if (old.src) { s.src = old.src; s.async = true; }
                  else { s.textContent = old.textContent; }
                  document.body.appendChild(s);
                  old.remove();
                });
              }}
              style={{ minHeight: p.embed_code.includes('iframe') ? 200 : 'auto', overflow:'hidden' }}
            />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── FOOTER ──
function Footer() {
  return (
    <footer style={{ background: BRAND.navy, color: 'rgba(248,249,250,.6)', padding: '52px 40px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, marginBottom: 48, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            Vigie <span style={{ color: BRAND.red }}>Conso</span>
          </div>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(248,249,250,.45)', lineHeight: 1.6, marginBottom: 24, fontFamily: 'Playfair Display, serif' }}>
            Ce que les consommateurs disent avant que les entreprises l'entendent.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)' }}>
            <div style={{ width: 40, height: 40, background: BRAND.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 900, color: BRAND.navy }}>LC</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 2 }}>La Centrale</div>
              <div style={{ color: 'rgba(248,249,250,.4)', fontSize: 11, lineHeight: 1.5 }}>Fondee en 2013<br />59, rue du Departement — 75018 Paris</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(248,249,250,.4)', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,.08)' }}>Rubriques</div>
          {CATEGORIES.map(cat => (
            <Link key={cat} to={`/categorie/${toSlug(cat)}`} style={{ display: 'block', fontSize: 13, color: 'rgba(248,249,250,.55)', textDecoration: 'none', marginBottom: 10 }}>{cat}</Link>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(248,249,250,.4)', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,.08)' }}>Informations legales</div>
          <p style={{ fontSize: 11, color: 'rgba(248,249,250,.35)', lineHeight: 1.8 }}>
            Vigie Conso est un site d information edite par La Centrale.<br /><br />
            Siege : 59, rue du Departement — 75018 Paris<br /><br />
            Conformement a la loi Informatique et Libertes et au RGPD, vous disposez d un droit d acces, de rectification et de suppression de vos donnees.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 11, color: 'rgba(248,249,250,.3)' }}>2026 Vigie Conso · Edite par La Centrale</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Mentions legales', 'CGU', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 11, color: 'rgba(248,249,250,.3)', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── HOME PAGE ──
function HomePage() {
  const [articles, setArticles] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/articles').then(r => r.json()),
      fetch('/api/social').then(r => r.json()),
    ]).then(([arts, soc]) => {
      setArticles(Array.isArray(arts) ? arts : [])
      setPosts(Array.isArray(soc) ? soc : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ marginTop: 110 }}><Spinner /></div>

  return (
    <>
      <Carousel articles={articles.slice(0, 5)} />
      <SocialWall posts={posts} />
      <Footer />
    </>
  )
}

// ── ARTICLE PAGE ──
function ArticlePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then(r => r.json())
      .then(a => { setArticle(a); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ marginTop: 110 }}><Spinner /></div>
  if (!article || article.error) return (
    <div style={{ marginTop: 110, textAlign: 'center', padding: 80, color: BRAND.slate }}>
      Article introuvable. <span onClick={() => navigate('/')} style={{ color: BRAND.red, cursor: 'pointer' }}>Retour</span>
    </div>
  )

  return (
    <div style={{ marginTop: 110 }}>
      {article.image_url && (
        <div style={{ width: '100%', height: '55vh', backgroundImage: `url('${article.image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,27,42,.65) 0%, transparent 60%)' }} />
        </div>
      )}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>
        <span onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: BRAND.red, cursor: 'pointer', marginBottom: 32, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          ← Retour
        </span>
        <div style={{ display: 'inline-block', background: BRAND.red, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', padding: '5px 14px', marginBottom: 20 }}>
          {article.category}
        </div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>
          {article.title}
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, color: BRAND.slate, lineHeight: 1.7, borderLeft: `3px solid ${BRAND.red}`, paddingLeft: 20, marginBottom: 32 }}>
          {article.lead}
        </p>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: BRAND.slate, paddingBottom: 24, borderBottom: `1px solid ${BRAND.border}`, marginBottom: 32, flexWrap: 'wrap' }}>
          <span>Par <strong style={{ color: BRAND.navy }}>{article.author || 'Redaction Vigie Conso'}</strong></span>
          <span>{fmtDate(article.published_at || article.created_at)}</span>
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.85, color: '#2d3748' }} dangerouslySetInnerHTML={{ __html: article.body }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 40, paddingTop: 24, borderTop: `1px solid ${BRAND.border}`, flexWrap: 'wrap' }}>
          <button onClick={() => navigator.clipboard.writeText(location.href)} style={{ padding: '10px 20px', border: `1px solid ${BRAND.border}`, background: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: BRAND.navy }}>
            Copier le lien
          </button>
          <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(location.href)}`, '_blank')} style={{ padding: '10px 20px', border: `1px solid ${BRAND.border}`, background: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: BRAND.navy }}>
            Partager sur X
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ── CATEGORY PAGE ──
function CategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const cat = CATEGORIES.find(c => toSlug(c) === slug) || slug
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(arts => {
        setArticles((Array.isArray(arts) ? arts : []).filter(a => a.category === cat))
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [slug])

  return (
    <div style={{ marginTop: 110 }}>
      <div style={{ background: BRAND.navy, padding: '60px 40px 48px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          <span style={{ color: BRAND.red }}>◆</span> {cat}
        </h1>
        <div style={{ fontSize: 13, color: 'rgba(248,249,250,.4)', letterSpacing: '.06em' }}>
          {loading ? 'Chargement...' : `${articles.length} article${articles.length > 1 ? 's' : ''}`}
        </div>
      </div>
      {loading ? <Spinner /> : !articles.length ? (
        <div style={{ textAlign: 'center', padding: 80, color: BRAND.slate }}>
          Aucun article dans cette categorie. <span onClick={() => navigate('/')} style={{ color: BRAND.red, cursor: 'pointer' }}>Accueil</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', background: BRAND.light }}>
          {articles.map(a => (
            <div key={a.slug} onClick={() => navigate(`/article/${a.slug}`)} style={{ background: '#fff', borderRight: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}`, cursor: 'pointer', overflow: 'hidden' }}>
              {a.image_url
                ? <img src={a.image_url} alt={a.title} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: 200, background: BRAND.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.1)', fontSize: 40 }}>◆</div>}
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: BRAND.red, marginBottom: 10 }}>{a.category}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, lineHeight: 1.3, marginBottom: 10, color: BRAND.navy }}>{a.title}</div>
                <div style={{ fontSize: 13, color: BRAND.slate, lineHeight: 1.6, marginBottom: 16 }}>{(a.lead || '').substring(0, 120)}…</div>
                <div style={{ fontSize: 11, color: BRAND.slate }}>{a.author || 'Redaction'} · {fmtDate(a.published_at || a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  )
}

// ── BODY EDITOR (contentEditable sans conflit React) ──
function BodyEditor({ body, onChange }) {
  const ref = React.useRef(null)
  const lastBody = React.useRef(body)

  // Only set innerHTML when body changes externally (load from server, AI generation)
  React.useEffect(() => {
    if (ref.current && body !== lastBody.current) {
      ref.current.innerHTML = body || ''
      lastBody.current = body
    }
  }, [body])

  const handleInput = () => {
    const html = ref.current.innerHTML
    lastBody.current = html
    onChange(html)
  }

  const execCmd = (cmd, val) => {
    ref.current.focus()
    document.execCommand(cmd, false, val || null)
  }

  const insertTag = (tag) => {
    ref.current.focus()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const el = document.createElement(tag)
    el.textContent = sel.toString() || (tag === 'p' ? 'Nouveau paragraphe' : tag === 'blockquote' ? 'Citation' : 'Titre')
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(el)
    // Move cursor after inserted element
    range.setStartAfter(el)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    handleInput()
  }

  const btns = [
    { l: 'G', fn: () => execCmd('bold') },
    { l: 'I', fn: () => execCmd('italic') },
    { l: 'H2', fn: () => insertTag('h2') },
    { l: 'H3', fn: () => insertTag('h3') },
    { l: '❝', fn: () => insertTag('blockquote') },
    { l: '¶', fn: () => insertTag('p') },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
        {btns.map(b => (
          <button key={b.l} type="button" onMouseDown={e => { e.preventDefault(); b.fn(); }}
            style={{ padding:'4px 10px', background:'#2E3540', border:'1px solid #3A3F4A', color:'#C9A84C', fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:4 }}>
            {b.l}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{ width:'100%', minHeight:320, padding:'14px 16px', border:'1px solid #3A3F4A',
          fontFamily:'Georgia,serif', fontSize:15, lineHeight:1.8, outline:'none',
          overflowY:'auto', backgroundColor:'#1A1E24', color:'white', boxSizing:'border-box',
          cursor:'text' }}
      />
    </div>
  )
}


// ── ADMIN PAGE ──
function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('articles')
  const [articles, setArticles] = useState([])
  const [posts, setPosts] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  // Article form
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [author, setAuthor] = useState('')
  const [lead, setLead] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [editSlug, setEditSlug] = useState(null)
  // Social form
  const [platform, setPlatform] = useState('x')
  const [username, setUsername] = useState('')
  const [postDate, setPostDate] = useState('')
  const [embedCode, setEmbedCode] = useState('')
  const [showPostForm, setShowPostForm] = useState(false)
  // AI generation
  const [sheetUrl, setSheetUrl] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [generating, setGenerating] = useState(false)

  const token = () => pwd

  async function login() {
    const r = await fetch('/api/articles?all=1', { headers: { Authorization: `Bearer ${pwd}` } })
    if (r.ok) { setAuthed(true); loadAll() }
    else setError('Mot de passe incorrect')
  }

  async function loadAll() {
    const [arts, soc] = await Promise.all([
      fetch('/api/articles?all=1', { headers: { Authorization: `Bearer ${pwd}` } }).then(r => r.json()),
      fetch('/api/social', { headers: { Authorization: `Bearer ${pwd}` } }).then(r => r.json()),
    ])
    setArticles(Array.isArray(arts) ? arts : [])
    setPosts(Array.isArray(soc) ? soc : [])
  }

  async function saveArticle(status) {
    if (!title.trim()) { setMsg('Le titre est obligatoire'); return }
    setLoading(true)
    const payload = { title, category, author, lead, body, image_url: imageUrl || null, published: status === 'published' }
    const method = editSlug ? 'PUT' : 'POST'
    const url = editSlug ? `/api/articles?slug=${editSlug}` : '/api/articles'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` }, body: JSON.stringify(payload) })
    const d = await r.json()
    if (r.ok) { setMsg(status === 'published' ? 'Article publie !' : 'Brouillon enregistre'); resetForm(); loadAll() }
    else setMsg('Erreur : ' + d.error)
    setLoading(false)
  }

  async function deleteArticle(slug) {
    if (!confirm('Supprimer cet article ?')) return
    await fetch(`/api/articles?slug=${slug}`, { method: 'DELETE', headers: { Authorization: `Bearer ${pwd}` } })
    loadAll(); setMsg('Article supprime')
  }

  function editArticle(a) {
    setEditSlug(a.slug); setTitle(a.title); setCategory(a.category); setAuthor(a.author || '')
    setLead(a.lead || ''); setBody(a.body || ''); setImageUrl(a.image_url || '')
    setTab('editor')
  }

  function resetForm() {
    setEditSlug(null); setTitle(''); setCategory(CATEGORIES[0]); setAuthor('')
    setLead(''); setBody(''); setImageUrl('')
  }

  async function generateFromSheet() {
    if (!sheetUrl.trim()) { setMsg('Collez URL du Google Sheet'); return }
    setGenerating(true); setMsg('')
    const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` }, body: JSON.stringify({ sheetUrl, instructions: aiInstructions }) })
    const d = await r.json()
    if (r.ok && d.title) {
      setTitle(d.title); setCategory(d.category || CATEGORIES[0]); setAuthor(d.author || '')
      setLead(d.lead || ''); setBody(d.body || '')
      setTab('editor'); setMsg(`Article genere depuis ${d._meta?.postsCount || '?'} post(s) avec Edito = OUI`)
    } else setMsg('Erreur : ' + (d.error || 'inconnue'))
    setGenerating(false)
  }

  async function savePost() {
    if (!platform || !embedCode.trim()) { setMsg('Plateforme et code embed obligatoires'); return }
    const r = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` }, body: JSON.stringify({ platform, username, post_date: postDate, embed_code: embedCode }) })
    if (r.ok) { setMsg('Post ajoute !'); setShowPostForm(false); setEmbedCode(''); setUsername(''); setPostDate(''); loadAll() }
    else setMsg('Erreur ajout post')
  }

  async function deletePost(id) {
    if (!confirm('Supprimer ce post ?')) return
    await fetch(`/api/social/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${pwd}` } })
    loadAll(); setMsg('Post supprime')
  }

  async function uploadImage(file) {
    const reader = new FileReader()
    reader.onload = async e => {
      const base64 = e.target.result.split(',')[1]
      const mimetype = file.type
      const ext = file.name.split('.').pop()
      const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` }, body: JSON.stringify({ file: base64, filename: `image.${ext}`, mimetype }) })
      const d = await r.json()
      if (d.url) setImageUrl(d.url)
      else setMsg('Erreur upload')
    }
    reader.readAsDataURL(file)
  }

  // LOGIN SCREEN
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.navy }}>
      <div style={{ background: '#fff', padding: '48px 40px', width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: BRAND.navy }}>
            Vigie <span style={{ color: BRAND.red }}>Conso</span>
          </div>
          <div style={{ fontSize: 12, color: BRAND.slate, marginTop: 6, letterSpacing: '.06em' }}>Back-office — Acces reserve</div>
        </div>
        {error && <div style={{ background: '#fee', border: '1px solid #fcc', color: BRAND.red, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.navy, display: 'block', marginBottom: 8, letterSpacing: '.05em', textTransform: 'uppercase' }}>Mot de passe</label>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="••••••••" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BRAND.border}`, fontSize: 14, marginBottom: 20, outline: 'none' }} />
        <button onClick={login} style={{ width: '100%', padding: 14, background: BRAND.navy, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Acceder au back-office
        </button>
      </div>
    </div>
  )

  const tabStyle = (t) => ({
    padding: '12px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    borderBottom: tab === t ? `2px solid ${BRAND.red}` : '2px solid transparent',
    color: tab === t ? BRAND.navy : BRAND.slate, background: 'none', border: 'none',
    borderBottom: tab === t ? `2px solid ${BRAND.red}` : '2px solid transparent',
  })

  const inputStyle = { width: '100%', padding: '10px 14px', border: `1px solid ${BRAND.border}`, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }
  const btnPrimary = { padding: '10px 22px', background: BRAND.navy, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  const btnRed = { padding: '10px 22px', background: BRAND.red, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  const btnOutline = { padding: '10px 22px', background: 'none', border: `1px solid ${BRAND.border}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: BRAND.navy }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: BRAND.navy, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#fff' }}>
            Vigie <span style={{ color: BRAND.red }}>Conso</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>Back-office</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[['articles', 'Articles'], ['editor', 'Nouvel article'], ['generate', 'Generer via Sheet'], ['social', 'Social Wall']].map(([key, label]) => (
            <div key={key} onClick={() => { setTab(key); if (key === 'editor') resetForm() }}
              style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', fontSize: 13, fontWeight: 500, color: tab === key ? '#fff' : 'rgba(255,255,255,.6)', cursor: 'pointer', borderLeft: tab === key ? `3px solid ${BRAND.red}` : '3px solid transparent', background: tab === key ? 'rgba(230,57,70,.15)' : 'none' }}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Link to="/" target="_blank" style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.4)', textDecoration: 'none', marginBottom: 8 }}>Voir le site</Link>
          <span onClick={() => setAuthed(false)} style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}>Deconnexion</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', minHeight: '100vh' }}>
        {msg && <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>{msg}</div>}

        {/* ARTICLES LIST */}
        {tab === 'articles' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28 }}>Articles</h1>
              <button onClick={() => { resetForm(); setTab('editor') }} style={btnPrimary}>+ Nouvel article</button>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BRAND.border}` }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BRAND.border}`, fontSize: 13, fontWeight: 700 }}>{articles.length} article(s)</div>
              {!articles.length ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: BRAND.slate, fontSize: 14 }}>
                  Aucun article. <span onClick={() => setTab('editor')} style={{ color: BRAND.red, cursor: 'pointer' }}>Creer le premier</span>
                </div>
              ) : articles.map(a => (
                <div key={a.slug} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${BRAND.border}`, gap: 16 }}>
                  {a.image_url ? <img src={a.image_url} alt="" style={{ width: 64, height: 48, objectFit: 'cover', flexShrink: 0, border: `1px solid ${BRAND.border}` }} /> : <div style={{ width: 64, height: 48, background: BRAND.light, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: BRAND.slate }}>
                      <span style={{ background: BRAND.light, padding: '2px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginRight: 8 }}>{a.category}</span>
                      <span style={{ background: a.published ? '#d4edda' : '#fff3cd', color: a.published ? '#155724' : '#856404', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.published ? 'Publie' : 'Brouillon'}</span>
                      <span style={{ marginLeft: 8 }}>{fmtDate(a.published_at || a.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link to={`/article/${a.slug}`} target="_blank" style={{ padding: '6px 14px', border: `1px solid ${BRAND.border}`, fontSize: 12, fontWeight: 600, textDecoration: 'none', color: BRAND.navy }}>Voir</Link>
                    <button onClick={() => editArticle(a)} style={{ padding: '6px 14px', border: `1px solid ${BRAND.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'none', color: BRAND.navy }}>Modifier</button>
                    <button onClick={() => deleteArticle(a.slug)} style={{ padding: '6px 14px', border: '1px solid #fcc', fontSize: 12, color: BRAND.red, cursor: 'pointer', background: 'none' }}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* EDITOR */}
        {tab === 'editor' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28 }}>{editSlug ? 'Modifier' : 'Nouvel article'}</h1>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => saveArticle('draft')} style={btnOutline}>Enregistrer brouillon</button>
                <button onClick={() => saveArticle('published')} style={btnRed} disabled={loading}>Publier</button>
              </div>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BRAND.border}`, padding: 24, marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Titre *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de l article..." style={{ ...inputStyle, fontSize: 18, padding: '14px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Categorie</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Auteur</label>
                  <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Prenom Nom" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Image</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL ou upload..." style={{ ...inputStyle, flex: 1 }} />
                    <label style={{ padding: '10px 14px', border: `1px solid ${BRAND.gold}`, color: BRAND.gold, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) uploadImage(e.target.files[0]) }} />
                    </label>
                  </div>
                  {imageUrl && <img src={imageUrl} alt="" style={{ marginTop: 8, height: 60, objectFit: 'cover', border: `1px solid ${BRAND.border}` }} onError={e => e.target.style.display='none'} />}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Chapeau (2 phrases max)</label>
                <textarea value={lead} onChange={e => setLead(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Corps de l\'article</label>
                <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                  {[['G','bold'],['I','italic'],['H2','h2'],['H3','h3'],['❝','blockquote'],['¶','p']].map(([label, cmd]) => (
                    <button key={cmd} type="button" onMouseDown={e => { e.preventDefault();
                      const editor = document.getElementById('body-editor');
                      if (cmd==='h2'||cmd==='h3'||cmd==='blockquote'||cmd==='p') {
                        const sel=window.getSelection(); if(!sel||!sel.rangeCount) return;
                        const el=document.createElement(cmd); el.textContent=sel.toString()||' ';
                        sel.getRangeAt(0).deleteContents(); sel.getRangeAt(0).insertNode(el);
                      } else { document.execCommand(cmd,false,null); }
                      editor.focus();
                    }} style={{ padding:'4px 10px', background:'#2E3540', border:'1px solid #3A3F4A', color:'#C9A84C', fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:4 }}>{label}</button>
                  ))}
                </div>
                <BodyEditor body={body} onChange={setBody} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setTab('articles')} style={btnOutline}>Annuler</button>
              <button onClick={() => saveArticle('draft')} style={btnOutline}>Brouillon</button>
              <button onClick={() => saveArticle('published')} style={btnRed} disabled={loading}>Publier</button>
            </div>
          </>
        )}

        {/* GENERATE */}
        {tab === 'generate' && (
          <>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 24 }}>Generer via Google Sheet</h1>
            <div style={{ background: 'linear-gradient(135deg, rgba(102,126,234,.08), rgba(118,75,162,.08))', border: '1px solid rgba(118,75,162,.2)', padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#764ba2', marginBottom: 6 }}>Generation IA depuis CACmonitor</div>
              <p style={{ fontSize: 12, color: BRAND.slate, marginBottom: 16, lineHeight: 1.6 }}>
                L IA lit les lignes avec <strong>Edito = OUI</strong> dans la colonne D, utilise le contenu de la colonne C et les consignes de la colonne N.
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>URL Google Sheet</label>
                <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..." style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Instructions supplementaires</label>
                <input value={aiInstructions} onChange={e => setAiInstructions(e.target.value)}
                  placeholder="Ex: Angle finance, ton alarmiste..." style={inputStyle} />
              </div>
              <button onClick={generateFromSheet} disabled={generating}
                style={{ ...btnPrimary, background: 'linear-gradient(135deg,#667eea,#764ba2)', opacity: generating ? .7 : 1 }}>
                {generating ? 'Generation en cours...' : 'Generer avec IA'}
              </button>
            </div>
          </>
        )}

        {/* SOCIAL WALL */}
        {tab === 'social' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28 }}>Social Wall</h1>
              <button onClick={() => setShowPostForm(true)} style={btnPrimary}>+ Ajouter un post</button>
            </div>
            {showPostForm && (
              <div style={{ background: '#fff', border: `1px solid ${BRAND.border}`, padding: 24, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Nouveau post</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Plateforme</label>
                    <select value={platform} onChange={e => setPlatform(e.target.value)} style={inputStyle}>
                      {[['x','X / Twitter'],['fb','Facebook'],['ig','Instagram'],['li','LinkedIn'],['tt','TikTok']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom affiche</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="@utilisateur" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date</label>
                    <input value={postDate} onChange={e => setPostDate(e.target.value)} placeholder="Ex: Hier, 14h30" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Code HTML embed</label>
                  <textarea value={embedCode} onChange={e => setEmbedCode(e.target.value)} rows={5}
                    placeholder="Collez le code embed de la plateforme..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={savePost} style={btnPrimary}>Ajouter</button>
                  <button onClick={() => setShowPostForm(false)} style={btnOutline}>Annuler</button>
                </div>
              </div>
            )}
            <div style={{ background: '#fff', border: `1px solid ${BRAND.border}` }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BRAND.border}`, fontSize: 13, fontWeight: 700 }}>{posts.length} post(s)</div>
              {!posts.length ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: BRAND.slate }}>Aucun post.</div>
              ) : posts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px 20px', borderBottom: `1px solid ${BRAND.border}`, gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: PLAT_COLORS[p.platform] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{PLAT_ICONS[p.platform]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.navy }}>{p.username || p.platform}</div>
                    <div style={{ fontSize: 12, color: BRAND.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.embed_code || '').replace(/<[^>]+>/g, ' ').trim().substring(0, 100)}</div>
                  </div>
                  <button onClick={() => deletePost(p.id)} style={{ padding: '6px 14px', border: '1px solid #fcc', fontSize: 12, color: BRAND.red, cursor: 'pointer', background: 'none', flexShrink: 0 }}>Supprimer</button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ── APP ──
export default function App() {
  const [articles, setArticles] = useState([])

  useEffect(() => {
    fetch('/api/articles').then(r => r.json()).then(a => setArticles(Array.isArray(a) ? a : [])).catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={
          <>
            <Header articles={articles} />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/article/:slug" element={<ArticlePage />} />
              <Route path="/categorie/:slug" element={<CategoryPage />} />
            </Routes>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}
