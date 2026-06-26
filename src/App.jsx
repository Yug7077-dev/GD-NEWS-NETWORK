import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, Menu, X, Clock, ChevronLeft, Radio, Globe, Share2, Bookmark, ChevronRight } from "lucide-react";
import { LOGO_BASE64 } from "./logoData.js";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";

const CATEGORIES = [
  { id: "home",          hi: "होम",           en: "Home",          query: "India breaking news today" },
  { id: "local",         hi: "स्थानीय",       en: "Local",         query: "local India city news today" },
  { id: "state",         hi: "राज्य",         en: "State",         query: "India state government news today" },
  { id: "national",      hi: "राष्ट्रीय",     en: "National",      query: "India national news today" },
  { id: "international", hi: "अंतर्राष्ट्रीय", en: "World",        query: "world international news today" },
  { id: "sports",        hi: "खेल",           en: "Sports",        query: "India cricket sports news today" },
  { id: "entertainment", hi: "मनोरंजन",       en: "Entertainment", query: "India bollywood entertainment news" },
  { id: "business",      hi: "व्यापार",       en: "Business",      query: "India business economy stock news" },
  { id: "politics",      hi: "राजनीति",       en: "Politics",      query: "India politics BJP Congress news" },
  { id: "crime",         hi: "क्राइम",         en: "Crime",         query: "India crime police news today" },
];

const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

function buildFeed(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "hi" ? "अभी" : "Just now";
  if (m < 60) return lang === "hi" ? `${m} मिनट पहले` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "hi" ? `${h} घंटे पहले` : `${h}h ago`;
  return lang === "hi" ? `${Math.floor(h/24)} दिन पहले` : `${Math.floor(h/24)}d ago`;
}

function AdBanner({ size = "leaderboard" }) {
  const h = size === "leaderboard" ? "80px" : size === "rectangle" ? "220px" : "90px";
  return (
    <div style={{ width:"100%", height:h, background:"linear-gradient(135deg,#f8f9fa,#e9ecef)",
      border:"2px dashed #ced4da", borderRadius:"4px", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", margin:"10px 0", color:"#999" }}>
      <span style={{ fontSize:"9px", letterSpacing:"0.08em" }}>ADVERTISEMENT</span>
      <span style={{ fontSize:"11px", fontWeight:"600", marginTop:"2px" }}>Google AdSense</span>
    </div>
  );
}

// ARTICLE READER PAGE
function ArticleReader({ article, lang, onBack, geminiKey }) {
  const [fullContent, setFullContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!geminiKey) {
      setFullContent(article.description || "");
      return;
    }
    setLoading(true);
    const generate = async () => {
      try {
        const prompt = lang === "hi"
          ? `तुम GD News Network के वरिष्ठ पत्रकार हो। नीचे दी गई खबर को पूरी तरह विस्तृत करो। एक professional Hindi news article लिखो जिसमें हो: पूरी खबर का विवरण, background, impact, और expert opinion। Article 300-400 शब्दों का हो। Headline: "${article.headline}". Summary: "${article.description}".  केवल article text लिखो, कोई heading या formatting नहीं।`
          : `You are a senior journalist at GD News Network. Write a complete, detailed news article based on this headline and summary. Include: full story, background context, impact, and analysis. 300-400 words. Professional English news style. Headline: "${article.headline}". Summary: "${article.description}". Only write the article body, no headings or formatting.`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || article.description;
        setFullContent(text);
      } catch {
        setFullContent(article.description || "");
      } finally { setLoading(false); }
    };
    generate();
  }, [article, lang, geminiKey]);

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: article.headline, text: article.description, url: article.link });
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Noto Sans','Inter',sans-serif" }}>
      {/* Back Header */}
      <div style={{ background:"#CC0000", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px", position:"sticky", top:0, zIndex:30 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding:"4px", display:"flex" }}>
          <ChevronLeft size={24} />
        </button>
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News" style={{ height:"30px", objectFit:"contain" }} />
        <div style={{ marginLeft:"auto", display:"flex", gap:"10px" }}>
          <button onClick={() => setBookmarked(!bookmarked)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}>
            <Bookmark size={20} fill={bookmarked ? "#fff" : "none"} />
          </button>
          <button onClick={share} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}>
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"16px 14px 40px" }}>
        {/* Category + Time */}
        <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"10px" }}>
          <span style={{ background:"#CC0000", color:"#fff", fontSize:"10px", fontWeight:"800", padding:"3px 8px", borderRadius:"3px" }}>
            GD NEWS NETWORK
          </span>
          <span style={{ fontSize:"11px", color:"#888", display:"flex", alignItems:"center", gap:"3px" }}>
            <Clock size={11} />{timeAgo(article.pubDate, lang)}
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:"22px", fontWeight:"800", lineHeight:1.3, color:"#111", margin:"0 0 12px" }}>
          {article.headline}
        </h1>

        {/* Hero Image */}
        {article.thumbnail && (
          <div style={{ width:"100%", borderRadius:"8px", overflow:"hidden", marginBottom:"16px" }}>
            <img src={article.thumbnail} alt="" style={{ width:"100%", height:"220px", objectFit:"cover" }} />
            <div style={{ background:"#f5f5f5", padding:"6px 10px", fontSize:"11px", color:"#888" }}>
              📷 GD News Network
            </div>
          </div>
        )}

        {/* Ad */}
        <AdBanner size="inline" />

        {/* Article Content */}
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 0", gap:"12px" }}>
            <RefreshCw size={24} style={{ animation:"spin 1s linear infinite", color:"#CC0000" }} />
            <p style={{ color:"#888", fontSize:"13px" }}>
              {lang === "hi" ? "AI पूरी खबर तैयार कर रहा है..." : "AI is generating full article..."}
            </p>
          </div>
        ) : (
          <div style={{ fontSize:"16px", lineHeight:1.8, color:"#222" }}>
            {fullContent.split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ margin:"0 0 16px" }}>{para}</p>
            ))}
          </div>
        )}

        {/* Ad */}
        <AdBanner size="rectangle" />

        {/* Source */}
        <div style={{ borderTop:"1px solid #eee", paddingTop:"12px", marginTop:"8px" }}>
          <p style={{ fontSize:"12px", color:"#aaa" }}>
            {lang === "hi" ? "स्रोत: " : "Source: "}{article.originalSource}
          </p>
          <a href={article.link} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:"13px", color:"#CC0000", fontWeight:"600", display:"flex", alignItems:"center", gap:"4px" }}>
            {lang === "hi" ? "मूल खबर पढ़ें →" : "Read Original Story →"}
          </a>
        </div>
      </div>
    </div>
  );
}

// MAIN APP
export default function App() {
  const [lang, setLang] = useState("hi");
  const [activeCat, setActiveCat] = useState("home");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [adminNews, setAdminNews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gdnn_news") || "[]"); } catch { return []; }
  });

  const fetchNews = useCallback(async (catId) => {
    setLoading(true); setError(null);
    const cat = CATEGORIES.find(c => c.id === catId);
    try {
      const url = RSS_API + encodeURIComponent(buildFeed(cat.query));
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "ok" || !data.items?.length) throw new Error("No data");
      const cleaned = data.items.slice(0, 25).map((item, i) => {
        const title = item.title || "";
        const dashIdx = title.lastIndexOf(" - ");
        const headline = dashIdx > 10 ? title.slice(0, dashIdx) : title;
        const originalSource = dashIdx > 10 ? title.slice(dashIdx + 3) : "News";
        return {
          id: item.guid || i,
          headline,
          originalSource,
          link: item.link,
          pubDate: item.pubDate,
          thumbnail: item.thumbnail || item.enclosure?.link || null,
          description: (item.description || "").replace(/<[^>]+>/g, "").slice(0, 250),
          category: lang === "hi" ? cat.hi : cat.en,
        };
      });
      setArticles(cleaned);
    } catch {
      setError(lang === "hi" ? "खबरें लोड नहीं हो सकीं।" : "Could not load news.");
    } finally { setLoading(false); }
  }, [lang]);

  useEffect(() => { fetchNews(activeCat); }, [activeCat, fetchNews]);
  useEffect(() => {
    const i = setInterval(() => fetchNews(activeCat), 5 * 60 * 1000);
    return () => clearInterval(i);
  }, [activeCat, fetchNews]);
  useEffect(() => {
    const h = () => { try { setAdminNews(JSON.parse(localStorage.getItem("gdnn_news") || "[]")); } catch {} };
    window.addEventListener("gdnn_update", h);
    return () => window.removeEventListener("gdnn_update", h);
  }, []);

  // If reading an article
  if (selectedArticle) {
    return <ArticleReader article={selectedArticle} lang={lang} onBack={() => setSelectedArticle(null)} geminiKey={GEMINI_KEY} />;
  }

  const filtered = searchQuery ? articles.filter(a => a.headline.toLowerCase().includes(searchQuery.toLowerCase())) : articles;
  const ticker = [...adminNews.slice(0,3), ...articles.slice(0,6)].map(a => a.headline || a.title).filter(Boolean);

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <div style={S.topBar}>
        <div style={S.topBarInner}>
          <span style={S.topDate}>
            {new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </span>
          {/* Language Toggle */}
          <button onClick={() => setLang(l => l === "hi" ? "en" : "hi")} style={S.langBtn}>
            <Globe size={12} style={{ marginRight:"4px" }} />
            {lang === "hi" ? "English" : "हिंदी"}
          </button>
        </div>
      </div>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <button style={S.iconBtn} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={S.logo} />
          <div style={{ display:"flex", gap:"4px" }}>
            <button style={S.iconBtn} onClick={() => setSearchOpen(!searchOpen)}><Search size={20} /></button>
            <button style={S.iconBtn} onClick={() => fetchNews(activeCat)}>
              <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div style={S.searchWrap}>
            <input autoFocus style={S.searchInput}
              placeholder={lang === "hi" ? "खबरें खोजें..." : "Search news..."}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        )}

        {menuOpen && (
          <nav style={S.menu}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} style={{ ...S.menuItem, ...(activeCat === cat.id ? S.menuActive : {}) }}
                onClick={() => { setActiveCat(cat.id); setMenuOpen(false); }}>
                {lang === "hi" ? cat.hi : cat.en}
              </button>
            ))}
            <div style={{ borderTop:"2px solid #eee", marginTop:"4px" }}>
              <button style={S.menuItem} onClick={() => { window.location.href = "/admin"; }}>
                🔐 {lang === "hi" ? "Admin Panel" : "Admin Panel"}
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* AD */}
      <div style={{ padding:"0 12px" }}><AdBanner size="leaderboard" /></div>

      {/* BREAKING TICKER */}
      {ticker.length > 0 && (
        <div style={S.ticker}>
          <span style={S.tickerLabel}><Radio size={11} style={{ marginRight:"4px" }} />{lang === "hi" ? "ब्रेकिंग" : "LIVE"}</span>
          <div style={S.tickerTrack}>
            <div style={S.tickerInner}>
              {ticker.concat(ticker).map((h,i) => (
                <span key={i} style={S.tickerItem}>{h}<span style={{ color:"#e8b84b", margin:"0 14px" }}>●</span></span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CAT NAV */}
      <nav style={S.catNav}>
        <div style={S.catScroll}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} style={{ ...S.catBtn, ...(activeCat === cat.id ? S.catActive : {}) }}
              onClick={() => setActiveCat(cat.id)}>
              {lang === "hi" ? cat.hi : cat.en}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={S.main}>

        {/* ADMIN NEWS */}
        {adminNews.length > 0 && (
          <section style={{ marginBottom:"16px" }}>
            <div style={S.secHead}>
              <span style={S.secTitle}>📢 {lang === "hi" ? "विशेष खबर" : "Special Report"}</span>
            </div>
            {adminNews.slice(0,2).map((n,i) => (
              <div key={i} onClick={() => setSelectedArticle({ headline: n.title, description: n.summary, thumbnail: n.image, pubDate: n.createdAt, link:"#", originalSource:"GD News Network" })}
                style={{ ...S.heroCard, cursor:"pointer" }}>
                {n.image && <img src={n.image} alt="" style={{ width:"100%", height:"200px", objectFit:"cover" }} />}
                <div style={{ padding:"12px 14px 14px" }}>
                  <span style={S.gdBadge}>GD NEWS NETWORK</span>
                  <h2 style={S.heroH}>{n.title}</h2>
                  <p style={{ fontSize:"13px", color:"#555", lineHeight:1.5, margin:"0 0 8px" }}>{n.summary}</p>
                  <span style={S.readMore}>{lang === "hi" ? "पूरी खबर पढ़ें →" : "Read Full Story →"}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {loading && articles.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px", gap:"12px" }}>
            <RefreshCw size={28} style={{ animation:"spin 1s linear infinite", color:"#CC0000" }} />
            <p style={{ color:"#888", fontSize:"13px" }}>{lang === "hi" ? "खबरें लोड हो रही हैं..." : "Loading news..."}</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <p style={{ color:"#CC0000", fontWeight:"700" }}>{error}</p>
            <button onClick={() => fetchNews(activeCat)} style={S.retryBtn}>
              {lang === "hi" ? "पुनः प्रयास" : "Retry"}
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* HERO */}
            <div onClick={() => setSelectedArticle(filtered[0])} style={{ ...S.heroCard, cursor:"pointer", marginBottom:"12px" }}>
              <div style={{ position:"relative", height:"220px", background:"#f0f0f0" }}>
                {filtered[0].thumbnail
                  ? <img src={filtered[0].thumbnail} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#CC0000,#7a0000)" }} />}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(transparent 40%,rgba(0,0,0,0.5))" }} />
                <span style={{ position:"absolute", top:"10px", left:"10px", background:"#CC0000", color:"#fff", fontSize:"10px", fontWeight:"800", padding:"3px 8px", borderRadius:"3px" }}>
                  {lang === "hi" ? "ब्रेकिंग न्यूज" : "BREAKING NEWS"}
                </span>
              </div>
              <div style={{ padding:"14px" }}>
                <span style={S.gdBadge}>GD NEWS NETWORK</span>
                <h1 style={S.heroH}>{filtered[0].headline}</h1>
                <p style={{ fontSize:"13px", color:"#555", lineHeight:1.5, margin:"0 0 10px" }}>{filtered[0].description}...</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"11px", color:"#888", display:"flex", alignItems:"center", gap:"3px" }}>
                    <Clock size={11} />{timeAgo(filtered[0].pubDate, lang)}
                  </span>
                  <span style={S.readMore}>{lang === "hi" ? "पूरी खबर →" : "Read More →"}</span>
                </div>
              </div>
            </div>

            <AdBanner size="inline" />

            {/* TOP 3 GRID */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
              {filtered.slice(1,3).map(art => (
                <div key={art.id} onClick={() => setSelectedArticle(art)}
                  style={{ background:"#fff", border:"1px solid #eee", borderRadius:"8px", overflow:"hidden", cursor:"pointer" }}>
                  {art.thumbnail
                    ? <img src={art.thumbnail} alt="" style={{ width:"100%", height:"90px", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"90px", background:"linear-gradient(135deg,#CC0000,#7a0000)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ color:"#fff", fontWeight:"800", fontSize:"18px" }}>GD</span>
                      </div>}
                  <div style={{ padding:"8px" }}>
                    <span style={S.gdBadge}>GD NEWS NETWORK</span>
                    <p style={{ fontSize:"12px", fontWeight:"700", lineHeight:1.3, color:"#111", margin:"3px 0 4px", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                      {art.headline}
                    </p>
                    <span style={{ fontSize:"10px", color:"#888" }}>{timeAgo(art.pubDate, lang)}</span>
                  </div>
                </div>
              ))}
      </
