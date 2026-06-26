import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, Menu, X, Clock, ChevronLeft, Radio, Globe, Share2, Bookmark, ChevronRight } from "lucide-react";
import { LOGO_BASE64 } from "./logoData.js";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";

const LANGUAGES = [
  { code: "hi", label: "हिंदी", params: "&hl=hi&gl=IN&ceid=IN:hi" },
  { code: "en", label: "English", params: "&hl=en-IN&gl=IN&ceid=IN:en" },
  { code: "mr", label: "मराठी", params: "&hl=mr&gl=IN&ceid=IN:mr" },
  { code: "bn", label: "বাংলা", params: "&hl=bn&gl=IN&ceid=IN:bn" },
];

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

function buildFeed(query, langCode) {
  const langObj = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}${langObj.params}`;
}

function timeAgo(dateStr, lang) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "hi" ? "अभी" : "Just now";
  if (m < 60) return lang === "hi" ? `${m} मिनट पहले` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "hi" ? `${h} घंटे पहले` : `${h}h ago`;
  return lang === "hi" ? `${Math.floor(h/24)} दिन पहले` : `${Math.floor(h/24)}d ago`;
}

export default function App() {
  const [lang, setLang] = useState("hi");
  const [activeCat, setActiveCat] = useState("home");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNews] = useState(() => { try { return JSON.parse(localStorage.getItem("gdnn_news") || "[]"); } catch { return []; } });

  const fetchNews = useCallback(async (catId) => {
    setLoading(true);
    const cat = CATEGORIES.find(c => c.id === catId);
    try {
      const res = await fetch(RSS_API + encodeURIComponent(buildFeed(cat.query, lang)));
      const data = await res.json();
      setArticles(data.items.map((item, i) => ({ 
        id: i, 
        headline: item.title, 
        thumbnail: item.thumbnail, 
        pubDate: item.pubDate, 
        link: item.link, 
        description: item.description?.replace(/<[^>]+>/g, "").slice(0, 150) 
      })));
    } catch { console.error("Err"); } finally { setLoading(false); }
  }, [lang]);

  useEffect(() => { fetchNews(activeCat); }, [activeCat, fetchNews]);

  return (
    <div style={{ fontFamily: "'Noto Sans', sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "#CC0000", padding: "12px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Menu size={24} color="#fff" onClick={() => setMenuOpen(!menuOpen)} />
        <img src={`data:image/png;base64,${LOGO_BASE64}`} style={{ height: "30px" }} />
        <div style={{ display: "flex", gap: "15px" }}>
            <Search size={22} color="#fff" onClick={() => setSearchOpen(!searchOpen)} />
            <RefreshCw size={22} color="#fff" onClick={() => fetchNews(activeCat)} />
        </div>
      </header>

      {/* Language Toggle */}
      <div style={{ padding: "10px", background: "#f8f8f8" }}>
        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: "100%", padding: "8px" }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* Menu */}
      {menuOpen && (
        <nav style={{ background: "#fff", padding: "15px", borderBottom: "1px solid #ddd" }}>
          {CATEGORIES.map(c => <button key={c.id} style={{ display: "block", padding: "10px" }} onClick={() => { setActiveCat(c.id); setMenuOpen(false); }}>{c[lang]}</button>)}
          <button style={{ color: "red", fontWeight: "bold" }} onClick={() => window.location.href="?admin"}>Admin Panel</button>
        </nav>
      )}

      {/* Articles */}
      <main style={{ padding: "15px" }}>
        {loading ? <p>Loading news...</p> : articles.map(a => (
          <div key={a.id} style={{ marginBottom: "25px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
            <h2 style={{ fontSize: "18px", lineHeight: "1.4" }}>{a.headline}</h2>
            {a.thumbnail && <img src={a.thumbnail} style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }} />}
            <p style={{ fontSize: "14px", color: "#555", marginTop: "10px" }}>{a.description}...</p>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer style={{ background: "#1a1a1a", color: "#fff", padding: "20px", textAlign: "center" }}>
        <p>© 2026 GD News Network</p>
      </footer>
    </div>
  );
    }
    
