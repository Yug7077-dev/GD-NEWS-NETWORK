import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, Menu, X, Clock, ChevronLeft, Radio, Globe, Share2, Bookmark, ChevronRight } from "lucide-react";
import { LOGO_BASE64 } from "./logoData.js";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const CATS = [
  { id:"home",          hi:"होम",            en:"Home",          q:"India breaking news today" },
  { id:"local",         hi:"स्थानीय",        en:"Local",         q:"local India city news today" },
  { id:"state",         hi:"राज्य",          en:"State",         q:"India state government news today" },
  { id:"national",      hi:"राष्ट्रीय",      en:"National",      q:"India national news today" },
  { id:"international", hi:"अंतर्राष्ट्रीय", en:"International",         q:"world international news today" },
  { id:"sports",        hi:"खेल",            en:"Sports",        q:"India cricket sports news today" },
  { id:"entertainment", hi:"मनोरंजन",        en:"Entertainment", q:"India bollywood entertainment news" },
  { id:"business",      hi:"व्यापार",        en:"Business",      q:"India business economy news" },
  { id:"politics",      hi:"राजनीति",        en:"Politics",      q:"India politics news today" },
  { id:"crime",         hi:"क्राइम",          en:"Crime",         q:"India crime news today" },
];

function tAgo(d, l) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return l==="hi" ? "अभी" : "Just now";
  if (m < 60) return l==="hi" ? `${m} मिनट पहले` : `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return l==="hi" ? `${h} घंटे पहले` : `${h}h ago`;
  return l==="hi" ? `${Math.floor(h/24)} दिन पहले` : `${Math.floor(h/24)}d ago`;
}

function clean(title) {
  const i = title.lastIndexOf(" - ");
  if (i > 10 && i > title.length - 45) return { h: title.slice(0,i), s: title.slice(i+3) };
  return { h: title, s: "News" };
}

function Ad({ h = "80px", label = "Google AdSense" }) {
  return (
    <div style={{ width:"100%", height:h, background:"#f8f8f8", border:"2px dashed #ddd",
      borderRadius:"6px", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", margin:"10px 0", color:"#bbb" }}>
      <span style={{ fontSize:"9px", letterSpacing:"0.1em" }}>ADVERTISEMENT</span>
      <span style={{ fontSize:"11px", fontWeight:"600", marginTop:"2px" }}>{label}</span>
    </div>
  );
}

// ── ARTICLE READER ──────────────────────────────────────────
function Reader({ art, lang, onBack }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [bm, setBm] = useState(false);

  useEffect(() => {
    if (!GEMINI_KEY) { setBody(art.desc); setLoading(false); return; }
    (async () => {
      try {
        const prompt = lang === "hi"
          ? `तुम GD News Network के वरिष्ठ पत्रकार हो। इस खबर पर एक विस्तृत 350-शब्द Hindi news article लिखो। केवल article body, कोई heading नहीं।\nHeadline: ${art.headline}\nSummary: ${art.desc}`
          : `You are a senior journalist at GD News Network. Write a detailed 350-word news article. Only the article body, no headings.\nHeadline: ${art.headline}\nSummary: ${art.desc}`;
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
          { method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }] }) });
        const d = await r.json();
        setBody(d.candidates?.[0]?.content?.parts?.[0]?.text || art.desc);
      } catch { setBody(art.desc); }
      setLoading(false);
    })();
  }, [art, lang]);

  const share = () => navigator.share?.({ title: art.headline, text: art.desc, url: art.link });

  return (
    <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Noto Sans','Inter',sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ background:"#CC0000", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px", position:"sticky", top:0, zIndex:50 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding:"4px", display:"flex", alignItems:"center" }}>
          <ChevronLeft size={24} />
        </button>
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News" style={{ height:"28px", objectFit:"contain" }} />
        <div style={{ marginLeft:"auto", display:"flex", gap:"12px" }}>
          <button onClick={()=>setBm(!bm)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}>
            <Bookmark size={20} fill={bm?"#fff":"none"} />
          </button>
          <button onClick={share} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}>
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"16px 14px 50px" }}>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"12px", flexWrap:"wrap" }}>
          <span style={{ background:"#CC0000", color:"#fff", fontSize:"10px", fontWeight:"800", padding:"3px 8px", borderRadius:"3px" }}>
            GD NEWS NETWORK
          </span>
          <span style={{ fontSize:"11px", color:"#888" }}>
            <Clock size={11} style={{ verticalAlign:"middle", marginRight:"3px" }} />
            {tAgo(art.pubDate, lang)}
          </span>
        </div>

        <h1 style={{ fontSize:"21px", fontWeight:"800", lineHeight:1.3, color:"#111", margin:"0 0 14px" }}>
          {art.headline}
        </h1>

        {art.img && (
          <div style={{ marginBottom:"16px", borderRadius:"8px", overflow:"hidden" }}>
            <img src={art.img} alt="" style={{ width:"100%", maxHeight:"240px", objectFit:"cover", display:"block" }}
              onError={e => e.target.style.display="none"} />
            <div style={{ background:"#f5f5f5", padding:"5px 10px", fontSize:"10px", color:"#999" }}>
              © GD News Network
            </div>
          </div>
        )}

        <Ad h="80px" label="728×90 Ad" />

        {loading ? (
          <div style={{ textAlign:"center", padding:"50px 0" }}>
            <RefreshCw size={24} style={{ animation:"spin 1s linear infinite", color:"#CC0000" }} />
            <p style={{ color:"#888", fontSize:"13px", marginTop:"10px" }}>
              {lang==="hi" ? "🤖 AI पूरी खबर लिख रहा है..." : "🤖 AI generating full article..."}
            </p>
          </div>
        ) : (
          <div style={{ fontSize:"16px", lineHeight:1.85, color:"#222" }}>
            {body.split('\n').filter(p=>p.trim()).map((p,i) => (
              <p key={i} style={{ margin:"0 0 16px" }}>{p}</p>
            ))}
          </div>
        )}

        <Ad h="220px" label="300×250 Ad" />

        <div style={{ borderTop:"1px solid #eee", paddingTop:"14px", marginTop:"10px" }}>
          <p style={{ fontSize:"11px", color:"#bbb", margin:"0 0 8px" }}>
            {lang==="hi" ? "मूल स्रोत:" : "Original Source:"} {art.src}
          </p>
          <a href={art.link} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:"13px", color:"#CC0000", fontWeight:"700" }}>
            {lang==="hi" ? "मूल खबर पढ़ें →" : "Read Original Story →"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("hi");
  const [cat, setCat] = useState("home");
  const [arts, setArts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [sq, setSq] = useState("");
  const [reader, setReader] = useState(null);
  const [adminNews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gdnn_news")||"[]"); } catch { return []; }
  });

  const load = useCallback(async (catId) => {
    setLoading(true); setErr(null);
    const c = CATS.find(x=>x.id===catId);
    try {
      const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(c.q)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const r = await fetch(RSS_API + encodeURIComponent(feed));
      const d = await r.json();
      if (d.status !== "ok") throw new Error();
      setArts(d.items.slice(0,25).map((it,i) => {
        const {h,s} = clean(it.title||"");
        const img = it.thumbnail || it.enclosure?.link || null;
        return {
          id: it.guid||i, headline:h, src:s, link:it.link,
          pubDate:it.pubDate, img: img,
          desc:(it.description||"").replace(/<[^>]+>/g,"").slice(0,250),
        };
      }));
    } catch { setErr(lang==="hi"?"खबरें लोड नहीं हो सकीं।":"Could not load news."); }
    setLoading(false);
  }, [lang]);

  useEffect(()=>{ load(cat); },[cat,load]);
  useEffect(()=>{ const t=setInterval(()=>load(cat),5*60*1000); return()=>clearInterval(t); },[cat,load]);

  if (reader) return <Reader art={reader} lang={lang} onBack={()=>setReader(null)} />;

  const list = sq ? arts.filter(a=>a.headline.toLowerCase().includes(sq.toLowerCase())) : arts;
  const ticker = [...adminNews.slice(0,2), ...arts.slice(0,6)].map(a=>a.headline||a.title).filter(Boolean);

  return (
    <div style={{ background:"#fff", fontFamily:"'Noto Sans','Inter',sans-serif", color:"#111", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        *{box-sizing:border-box} body{margin:0} a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{display:none}
        .card:hover{background:#fafafa}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:"#1a1a1a", padding:"5px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"10px", color:"#aaa" }}>
          {new Date().toLocaleDateString(lang==="hi"?"hi-IN":"en-IN",{weekday:"short",day:"numeric",month:"long",year:"numeric"})}
        </span>
        <button onClick={()=>setLang(l=>l==="hi"?"en":"hi")}
          style={{ display:"flex", alignItems:"center", gap:"4px", background:"#CC0000", color:"#fff", border:"none", padding:"4px 10px", borderRadius:"12px", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>
          <Globe size={11} />
          {lang==="hi"?"English":"हिंदी"}
        </button>
      </div>

      {/* HEADER */}
      <header style={{ background:"#fff", borderBottom:"3px solid #CC0000", position:"sticky", top:0, zIndex:40, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ maxWidth:"760px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px" }}>
          <button onClick={()=>setMenu(!menu)} style={{ background:"none", border:"none", cursor:"pointer", padding:"6px", color:"#111" }}>
            {menu ? <X size={22}/> : <Menu size={22}/>}
          </button>
          <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={{ height:"44px", width:"auto", objectFit:"contain" }} />
          <div style={{ display:"flex", gap:"4px" }}>
            <button onClick={()=>setSearch(!search)} style={{ background:"none", border:"none", cursor:"pointer", padding:"6px", color:"#111" }}><Search size={20}/></button>
            <button onClick={()=>load(cat)} style={{ background:"none", border:"none", cursor:"pointer", padding:"6px", color:"#111" }}>
              <RefreshCw size={18} style={{ animation:loading?"spin 1s linear infinite":"none" }}/>
            </button>
          </div>
        </div>

        {search && (
          <div style={{ padding:"8px 12px", background:"#f5f5f5", borderTop:"1px solid #eee" }}>
            <input autoFocus value={sq} onChange={e=>setSq(e.target.value)}
              placeholder={lang==="hi"?"खबरें खोजें...":"Search news..."}
              style={{ width:"100%", padding:"9px 14px", border:"1px solid #ddd", borderRadius:"20px", fontSize:"14px", outline:"none" }} />
          </div>
        )}

        {menu && (
          <nav style={{ background:"#fff", borderTop:"1px solid #eee", maxHeight:"70vh", overflowY:"auto" }}>
            {CATS.map(c=>(
              <button key={c.id} onClick={()=>{setCat(c.id);setMenu(false);}}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"13px 16px", background: cat===c.id?"#fff5f5":"none", border:"none", borderBottom:"1px solid #f5f5f5", fontSize:"14px", fontWeight: cat===c.id?"800":"400", color: cat===c.id?"#CC0000":"#333", cursor:"pointer" }}>
                {lang==="hi"?c.hi:c.en}
              </button>
            ))}
            <button onClick={()=>window.location.href="/admin"}
              style={{ display:"block", width:"100%", textAlign:"left", padding:"13px 16px", background:"none", border:"none", borderTop:"2px solid #eee", fontSize:"14px", color:"#666", cursor:"pointer" }}>
              🔐 Admin Panel
            </button>
          </nav>
        )}
      </header>

      {/* AD */}
      <div style={{ padding:"0 12px", maxWidth:"760px", margin:"0 auto" }}><Ad h="80px" label="728×90 Leaderboard Ad" /></div>

      {/* TICKER */}
      {ticker.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", background:"#CC0000", overflow:"hidden", height:"32px" }}>
          <span style={{ display:"flex", alignItems:"center", background:"#1a1a1a", color:"#e8b84b", fontSize:"11px", fontWeight:"800", padding:"0 12px", height:"100%", flexShrink:0, whiteSpace:"nowrap" }}>
            <Radio size={11} style={{ marginRight:"4px" }}/>{lang==="hi"?"ब्रेकिंग":"LIVE"}
          </span>
          <div style={{ overflow:"hidden", flex:1, height:"100%", display:"flex", alignItems:"center" }}>
            <div style={{ display:"flex", whiteSpace:"nowrap", animation:"ticker 40s linear infinite" }}>
              {ticker.concat(ticker).map((h,i)=>(
                <span key={i} style={{ color:"#fff", fontSize:"12px", paddingRight:"16px", fontWeight:"500" }}>
                  {h}<span style={{ color:"#e8b84b", margin:"0 14px" }}>●</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CAT NAV */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #eee", position:"sticky", top:"67px", zIndex:30 }}>
        <div style={{ maxWidth:"760px", margin:"0 auto", display:"flex", overflowX:"auto", padding:"0 8px", gap:"2px", scrollbarWidth:"none" }}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)}
              style={{ background:"none", border:"none", padding:"10px 12px", fontSize:"13px", fontWeight:"600", color:cat===c.id?"#CC0000":"#888", cursor:"pointer", whiteSpace:"nowrap", borderBottom:cat===c.id?"2.5px solid #CC0000":"2.5px solid transparent" }}>
              {lang==="hi"?c.hi:c.en}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ maxWidth:"760px", margin:"0 auto", padding:"12px 12px 50px" }}>

        {/* ADMIN NEWS */}
        {adminNews.length > 0 && (
          <section style={{ marginBottom:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", borderLeft:"4px solid #CC0000", paddingLeft:"8px", margin:"0 0 10px" }}>
              <span style={{ fontWeight:"800", fontSize:"14px" }}>📢 {lang==="hi"?"विशेष खबर":"Special Report"}</span>
            </div>
            {adminNews.slice(0,2).map((n,i)=>(
              <div key={i} className="card" onClick={()=>setReader({headline:n.title,desc:n.summary,img:n.image,pubDate:n.createdAt,link:"#",src:"GD News Network"})}
                style={{ background:"#fff", border:"2px solid #CC0000", borderRadius:"8px", overflow:"hidden", marginBottom:"10px", cursor:"pointer" }}>
                {n.image && <img src={n.image} alt="" style={{ width:"100%", height:"180px", objectFit:"cover" }} onError={e=>e.target.style.display="none"} />}
                <div style={{ padding:"12px 14px" }}>
                  <span style={{ fontSize:"9px", fontWeight:"800", color:"#CC0000", letterSpacing:"0.06em", display:"block", marginBottom:"4px" }}>GD NEWS NETWORK</span>
                  <h2 style={{ fontSize:"17px", fontWeight:"800", lineHeight:1.3, color:"#111", margin:"0 0 6px" }}>{n.title}</h2>
                  <p style={{ fontSize:"13px", color:"#555", lineHeight:1.5, margin:"0 0 8px" }}>{n.summary}</p>
                  <span style={{ fontSize:"12px", color:"#CC0000", fontWeight:"700" }}>{lang==="hi"?"पूरी खबर पढ़ें →":"Read Full Story →"}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {loading && (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <RefreshCw size={28} style={{ animation:"spin 1s linear infinite", color:"#CC0000" }}/>
            <p style={{ color:"#888", fontSize:"13px", marginTop:"10px" }}>
              {lang==="hi"?"खबरें लोड हो रही हैं...":"Loading news..."}
            </p>
          </div>
        )}

        {err && (
          <div style={{ textAlign:"center", padding:"50px 20px" }}>
            <p style={{ color:"#CC0000", fontWeight:"700", fontSize:"14px" }}>{err}</p>
            <button onClick={()=>load(cat)} style={{ background:"#CC0000", color:"#fff", border:"none", padding:"9px 20px", borderRadius:"6px", fontWeight:"700", cursor:"pointer", marginTop:"10px" }}>
              {lang==="hi"?"पुनः प्रयास":"Retry"}
            </button>
          </div>
        )}

        {!loading && !err && list.length > 0 && (
          <>
            {/* HERO */}
            <div className="card" onClick={()=>setReader(list[0])}
              style={{ background:"#fff", border:"1px solid #eee", borderRadius:"8px", overflow:"hidden", marginBottom:"12px", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ position:"relative", width:"100%", height:"210px", background:"#f0f0f0" }}>
                {list[0].img
                  ? <img src={list[0].img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";e.target.parentNode.style.background="linear-gradient(135deg,#CC0000,#7a0000)"}}/>
                  : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#CC0000,#7a0000)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"60px", fontWeight:"800" }}>GD</span>
                    </div>}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(transparent 50%,rgba(0,0,0,0.4))" }}/>
                <span style={{ position:"absolute", top:"10px", left:"10px", background:"#CC0000", color:"#fff", fontSize:"10px", fontWeight:"800", padding:"3px 8px", borderRadius:"3px" }}>
                  {lang==="hi"?"ब्रेकिंग न्यूज":"BREAKING NEWS"}
                </span>
              </div>
              <div style={{ padding:"14px" }}>
                <span style={{ fontSize:"9px", fontWeight:"800", color:"#CC0000", letterSpacing:"0.06em", display:"block", marginBottom:"4px" }}>GD NEWS NETWORK</span>
                <h1 style={{ fontSize:"18px", fontWeight:"800", lineHeight:1.3, color:"#111", margin:"0 0 8px" }}>{list[0].headline}</h1>
                <p style={{ fontSize:"13px", color:"#555", lineHeight:1.5, margin:"0 0 10px" }}>{list[0].desc}...</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
     
