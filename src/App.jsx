import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, Menu, X, Clock, ExternalLink, Radio, ChevronRight, Tv } from "lucide-react";
import { LOGO_BASE64 } from "./logoData.js";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";

const CATEGORIES = [
  { id: "home", label: "होम / Home", labelHi: "होम", labelEn: "Home", query: "India breaking news today" },
  { id: "local", label: "स्थानीय / Local", labelHi: "स्थानीय", labelEn: "Local", query: "local India state news today" },
  { id: "state", label: "राज्य / State", labelHi: "राज्य", labelEn: "State", query: "India state government news" },
  { id: "national", label: "राष्ट्रीय / National", labelHi: "राष्ट्रीय", labelEn: "National", query: "India national news today" },
  { id: "international", label: "अंतर्राष्ट्रीय / World", labelHi: "अंतर्राष्ट्रीय", labelEn: "World", query: "world international news today" },
  { id: "sports", label: "खेल / Sports", labelHi: "खेल", labelEn: "Sports", query: "India sports cricket news today" },
  { id: "entertainment", label: "मनोरंजन / Entertainment", labelHi: "मनोरंजन", labelEn: "Entertainment", query: "India entertainment bollywood news" },
  { id: "business", label: "व्यापार / Business", labelHi: "व्यापार", labelEn: "Business", query: "India business economy market news" },
  { id: "politics", label: "राजनीति / Politics", labelHi: "राजनीति", labelEn: "Politics", query: "India politics government news today" },
  { id: "crime", label: "अपराध / Crime", labelHi: "अपराध", labelEn: "Crime", query: "India crime police news today" },
];

const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

function buildFeed(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "अभी / Just now";
  if (m < 60) return `${m} मिनट पहले / ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} घंटे पहले / ${h}h ago`;
  return `${Math.floor(h / 24)} दिन पहले / ${Math.floor(h / 24)}d ago`;
}

function stripSource(title) {
  const idx = title.lastIndexOf(" - ");
  if (idx > 10 && idx > title.length - 40) {
    return { headline: title.slice(0, idx), source: title.slice(idx + 3) };
  }
  return { headline: title, source: "GD News Network" };
}

// Ad Placeholder Component
function AdBanner({ size = "leaderboard", label = "Advertisement" }) {
  const sizes = {
    leaderboard: { w: "100%", h: "90px", text: "728×90 Leaderboard Ad" },
    rectangle: { w: "100%", h: "250px", text: "300×250 Rectangle Ad" },
    halfpage: { w: "100%", h: "200px", text: "300×200 Half Page Ad" },
    inline: { w: "100%", h: "100px", text: "Inline Ad" },
  };
  const s = sizes[size] || sizes.leaderboard;
  return (
    <div style={{
      width: s.w, height: s.h, background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
      border: "2px dashed #ced4da", borderRadius: "4px", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      margin: "12px 0", color: "#6c757d", fontSize: "12px", fontWeight: "600",
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      <span style={{ fontSize: "10px", color: "#adb5bd" }}>ADVERTISEMENT</span>
      <span style={{ fontSize: "11px", marginTop: "4px" }}>{s.text}</span>
      <span style={{ fontSize: "10px", color: "#adb5bd", marginTop: "2px" }}>Google AdSense Slot</span>
    </div>
  );
}

export default function App() {
  const [activeCat, setActiveCat] = useState("home");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [aiNews, setAiNews] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [adminNews, setAdminNews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gdnn_news") || "[]"); } catch { return []; }
  });

  const fetchNews = useCallback(async (catId) => {
    setLoading(true); setError(null);
    const cat = CATEGORIES.find(c => c.id === catId);
    try {
      const res = await fetch(RSS_API + encodeURIComponent(buildFeed(cat.query)));
      const data = await res.json();
      if (data.status !== "ok") throw new Error("Feed error");
      const cleaned = data.items.slice(0, 20).map((item, i) => {
        const { headline, source } = stripSource(item.title || "");
        return {
          id: item.guid || i,
          headline,
          source: "GD News Network",
          originalSource: source,
          link: item.link,
          pubDate: item.pubDate,
          thumbnail: item.thumbnail || item.enclosure?.link || null,
          description: (item.description || "").replace(/<[^>]+>/g, "").slice(0, 180),
          category: cat.labelHi,
        };
      });
      setArticles(cleaned);
      setLastUpdated(new Date());
    } catch {
      setError("खबरें लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।");
    } finally { setLoading(false); }
  }, []);

  const fetchAiNews = useCallback(async () => {
    if (!GEMINI_KEY) return;
    setAiLoading(true);
    try {
      const cat = CATEGORIES.find(c => c.id === activeCat);
      const prompt = `You are a news writer for GD News Network, a Hindi-English bilingual state-level news channel in India. 
Write 3 short news summaries about "${cat.query}" in this exact JSON format (no markdown, pure JSON):
[{"headline":"Hindi headline here","headline_en":"English headline here","summary":"2-3 line summary in Hindi","summary_en":"2-3 line summary in English","category":"${cat.labelHi}"}]
Make them realistic, current, and relevant to Indian readers.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAiNews(parsed);
    } catch { setAiNews([]); }
    finally { setAiLoading(false); }
  }, [activeCat]);

  useEffect(() => { fetchNews(activeCat); }, [activeCat, fetchNews]);
  useEffect(() => { if (GEMINI_KEY) fetchAiNews(); }, [activeCat, fetchAiNews]);
  useEffect(() => {
    const interval = setInterval(() => fetchNews(activeCat), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCat, fetchNews]);

  // Listen for new admin news
  useEffect(() => {
    const handler = () => {
      try { setAdminNews(JSON.parse(localStorage.getItem("gdnn_news") || "[]")); } catch {}
    };
    window.addEventListener("storage", handler);
    window.addEventListener("gdnn_update", handler);
    return () => { window.removeEventListener("storage", handler); window.removeEventListener("gdnn_update", handler); };
  }, []);

  const filteredArticles = searchQuery
    ? articles.filter(a => a.headline.toLowerCase().includes(searchQuery.toLowerCase()))
    : articles;

  const ticker = [...adminNews.slice(0, 3), ...articles.slice(0, 5)].map(a => a.headline || a.title);

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <div style={S.topBar}>
        <div style={S.topBarInner}>
          <span style={S.topDate}>{new Date().toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <span style={S.topDate}>|</span>
          <span style={S.topDate}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <button style={S.iconBtn} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={S.logoWrap}>
            <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={S.logo} />
          </div>
          <div style={S.headerRight}>
            <button style={S.iconBtn} onClick={() => setSearchOpen(!searchOpen)}>
              <Search size={20} />
            </button>
            <button style={S.iconBtn} onClick={() => fetchNews(activeCat)} title="Refresh">
              <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div style={S.searchBar}>
            <input
              style={S.searchInput}
              placeholder="खबरें खोजें / Search news..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Mobile Menu */}
        {menuOpen && (
          <nav style={S.mobileMenu}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} style={{ ...S.menuItem, ...(activeCat === cat.id ? S.menuItemActive : {}) }}
                onClick={() => { setActiveCat(cat.id); setMenuOpen(false); }}>
                {cat.labelHi} / {cat.labelEn}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* LEADERBOARD AD */}
      <div style={{ padding: "0 12px" }}>
        <AdBanner size="leaderboard" />
      </div>

      {/* BREAKING NEWS TICKER */}
      {ticker.length > 0 && (
        <div style={S.ticker}>
          <span style={S.tickerLabel}><Radio size={12} style={{ marginRight: 4 }} />ब्रेकिंग</span>
          <div style={S.tickerTrack}>
            <div style={S.tickerContent}>
              {ticker.concat(ticker).map((h, i) => (
                <span key={i} style={S.tickerItem}>{h} <span style={{ color: "#e8b84b", margin: "0 16px" }}>●</span></span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY NAV */}
      <nav style={S.catNav}>
        <div style={S.catScroll}>
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              style={{ ...S.catBtn, ...(activeCat === cat.id ? S.catBtnActive : {}) }}
              onClick={() => setActiveCat(cat.id)}>
              {cat.labelHi}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={S.main}>
        {/* ADMIN NEWS (if any) */}
        {adminNews.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <div style={S.sectionHead}>
              <span style={S.sectionTitle}>📢 GD News Network — विशेष खबर</span>
            </div>
            {adminNews.slice(0, 3).map((news, i) => (
              <div key={i} style={S.adminCard}>
                {news.image && <img src={news.image} alt="" style={S.adminCardImg} />}
                <div style={S.adminCardBody}>
                  <span style={S.gdnnBadge}>GD NEWS NETWORK</span>
                  <h2 style={S.adminCardHeadline}>{news.title}</h2>
                  <p style={S.adminCardSummary}>{news.summary}</p>
                  <span style={S.timeTag}><Clock size={11} style={{ marginRight: 3 }} />{timeAgo(news.createdAt)}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* AI NEWS */}
        {aiNews.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <div style={S.sectionHead}>
              <span style={S.sectionTitle}>🤖 AI संपादित खबरें / AI Curated</span>
            </div>
            <div style={S.aiGrid}>
              {aiNews.map((n, i) => (
                <div key={i} style={S.aiCard}>
                  <span style={S.gdnnBadge}>GD NEWS NETWORK</span>
                  <h3 style={S.aiCardHeadline}>{n.headline}</h3>
                  <p style={S.aiCardHeadlineEn}>{n.headline_en}</p>
                  <p style={S.aiCardSummary}>{n.summary}</p>
                  <p style={S.aiCardSummaryEn}>{n.summary_en}</p>
                </div>
              ))}
            </div>
            {/* RECTANGLE AD after AI news */}
            <AdBanner size="rectangle" />
          </section>
        )}

        {loading && articles.length === 0 && (
          <div style={S.stateBox}>
            <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: "#c00" }} />
            <p style={S.stateText}>खबरें लोड हो रही हैं... / Loading news...</p>
          </div>
        )}

        {error && (
          <div style={S.stateBox}>
            <p style={{ color: "#c00", fontWeight: "700" }}>{error}</p>
            <button style={S.retryBtn} onClick={() => fetchNews(activeCat)}>पुनः प्रयास / Retry</button>
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <>
            {/* HERO */}
            <a href={filteredArticles[0].link} target="_blank" rel="noopener noreferrer" style={S.hero}>
              <div style={S.heroImgWrap}>
                {filteredArticles[0].thumbnail
                  ? <img src={filteredArticles[0].thumbnail} alt="" style={S.heroImg} />
                  : <div style={S.heroImgFallback} />}
                <div style={S.heroGrad} />
                <span style={S.breakingTag}>ब्रेकिंग न्यूज</span>
                <span style={S.catTag}>{filteredArticles[0].category}</span>
              </div>
              <div style={S.heroBody}>
                <span style={S.gdnnBadge}>GD NEWS NETWORK</span>
                <h1 style={S.heroHeadline}>{filteredArticles[0].headline}</h1>
                <p style={S.heroDesc}>{filteredArticles[0].description}...</p>
                <div style={S.heroMeta}>
                  <Clock size={12} style={{ marginRight: 4 }} />
                  <span>{timeAgo(filteredArticles[0].pubDate)}</span>
                  <span style={{ margin: "0 8px" }}>|</span>
                  <span style={{ color: "#999", fontSize: "11px" }}>Source: {filteredArticles[0].originalSource}</span>
                </div>
              </div>
            </a>

            {/* INLINE AD */}
            <AdBanner size="inline" />

            {/* TOP 3 CARDS */}
            <div style={S.topGrid}>
              {filteredArticles.slice(1, 4).map(art => (
                <a key={art.id} href={art.link} target="_blank" rel="noopener noreferrer" style={S.topCard}>
                  {art.thumbnail ? <img src={art.thumbnail} alt="" style={S.topCardImg} /> : <div style={S.topCardImgFb} />}
                  <div style={S.topCardBody}>
                    <span style={S.gdnnBadge}>GD NEWS NETWORK</span>
                    <h3 style={S.topCardHeadline}>{art.headline}</h3>
                    <span style={S.timeTag}><Clock size={10} style={{ marginRight: 2 }} />{timeAgo(art.pubDate)}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* RECTANGLE AD */}
            <AdBanner size="rectangle" />

            {/* NEWS LIST */}
            <div style={S.sectionHead}>
              <span style={S.sectionTitle}>सभी खबरें / All News</span>
              <span style={S.sectionMore}>और देखें <ChevronRight size={14} /></span>
            </div>

            {filteredArticles.slice(4).map((art, idx) => (
              <div key={art.id}>
                <a href={art.link} target="_blank" rel="noopener noreferrer" style={S.listCard}>
                  {art.thumbnail
                    ? <img src={art.thumbnail} alt="" style={S.listCardImg} />
                    : <div style={S.listCardImgFb}><span style={{ color: "#c00", fontWeight: "800", fontSize: "20px" }}>GD</span></div>}
                  <div style={S.listCardBody}>
                    <span style={S.gdnnBadge}>GD NEWS NETWORK</span>
                    <h3 style={S.listCardHeadline}>{art.headline}</h3>
                    <div style={S.listCardMeta}>
                      <span style={S.timeTag}><Clock size={10} style={{ marginRight: 2 }} />{timeAgo(art.pubDate)}</span>
                      <ExternalLink size={11} color="#aaa" />
                    </div>
                  </div>
                </a>
                {/* Ad every 5 articles */}
                {(idx + 1) % 5 === 0 && <AdBanner size="inline" />}
              </div>
            ))}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer style={S.footer}>
        <AdBanner size="leaderboard" />
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={{ height: "36px", objectFit: "contain", marginBottom: "8px" }} />
        <p style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}>GD News Network — आपकी अपनी खबर / Your Trusted News Source</p>
        <p style={{ fontSize: "11px", color: "#aaa", margin: "2px 0" }}>© 2025 GD News Network. All Rights Reserved.</p>
        <p style={{ fontSize: "10px", color: "#bbb", marginTop: "6px" }}>Headlines aggregated via Google News. Full stories on publisher sites.</p>
      </footer>
    </div>
  );
}

const RED = "#CC0000";
const GOLD = "#E8B84B";
const DARK = "#1A1A1A";
const WHITE = "#FFFFFF";
const LIGHTGRAY = "#F5F5F5";
const BORDER = "#E0E0E0";

const S = {
  page: { background: WHITE, fontFamily: "'Noto Sans', 'Inter', sans-serif", color: DARK, minHeight: "100vh" },
  topBar: { background: DARK, padding: "4px 12px" },
  topBarInner: { display: "flex", gap: "8px", maxWidth: "760px", margin: "0 auto", alignItems: "center" },
  topDate: { fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" },
  header: { background: WHITE, borderBottom: `3px solid ${RED}`, position: "sticky", top: 0, zIndex: 30, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  headerInner: { maxWidth: "760px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" },
  logoWrap: { flex: 1, display: "flex", justifyContent: "center" },
  logo: { height: "44px", width: "auto", objectFit: "contain" },
  headerRight: { display: "flex", gap: "4px", alignItems: "center" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: "6px", color: DARK, borderRadius: "6px" },
  searchBar: { padding: "8px 12px", borderTop: `1px solid ${BORDER}`, background: LIGHTGRAY },
  searchInput: { width: "100%", padding: "8px 12px", border: `1px solid ${BORDER}`, borderRadius: "20px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  mobileMenu: { background: WHITE, borderTop: `1px solid ${BORDER}`, maxHeight: "60vh", overflowY: "auto" },
  menuItem: { display: "block", width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${BORDER}`, fontSize: "14px", cursor: "pointer", color: DARK },
  menuItemActive: { color: RED, fontWeight: "700", background: "#fff5f5" },
  ticker: { display: "flex", alignItems: "center", background: RED, overflow: "hidden", height: "32px" },
  tickerLabel: { display: "flex", alignItems: "center", background: DARK, color: GOLD, fontSize: "11px", fontWeight: "800", padding: "0 12px", height: "100%", flexShrink: 0, whiteSpace: "nowrap" },
  tickerTrack: { overflow: "hidden", flex: 1, height: "100%", display: "flex", alignItems: "center" },
  tickerContent: { display: "flex", whiteSpace: "nowrap", animation: "ticker 40s linear infinite" },
  tickerItem: { color: WHITE, fontSize: "12px", paddingRight: "16px", fontWeight: "500" },
  catNav: { background: WHITE, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: "66px", zIndex: 20 },
  catScroll: { maxWidth: "760px",
margin: "0 auto", display: "flex", overflowX: "auto", padding: "0 8px", gap: "2px", scrollbarWidth: "none" },
  catBtn: { background: "none", border: "none", padding: "10px 12px", fontSize: "13px", fontWeight: "600", color: "#888", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "2.5px solid transparent" },
  catActive: { color: RED, borderBottom: `2.5px solid ${RED}` },
  main: { maxWidth: "760px", margin: "0 auto", padding: "12px 12px 40px" },
  secHead: { display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${RED}`, paddingLeft: "8px", margin: "14px 0 10px" },
  secTitle: { fontWeight: "800", fontSize: "14px", color: "#111" },
  gdBadge: { fontSize: "9px", fontWeight: "800", color: RED, letterSpacing: "0.06em", display: "block", marginBottom: "3px" },
  heroCard: { background: "#fff", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  heroH: { fontSize: "18px", fontWeight: "800", lineHeight: 1.3, color: "#111", margin: "4px 0 8px" },
  readMore: { fontSize: "12px", color: RED, fontWeight: "700" },
  retryBtn: { background: RED, color: "#fff", border: "none", padding: "8px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  * { box-sizing:border-box; }
  body { margin:0; }
  a { text-decoration:none; color:inherit; }
  ::-webkit-scrollbar { display:none; }
`;
