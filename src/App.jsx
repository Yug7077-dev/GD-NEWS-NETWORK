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
  { id: "home",          hi: "होम",           en: "Home",          mr: "मुख्यपृष्ठ",    bn: "होम",         query: "India breaking news today" },
  { id: "local",         hi: "स्थानीय",       en: "Local",         mr: "स्थानिक",       bn: "स्थानीय",       query: "local India city news today" },
  { id: "state",         hi: "राज्य",         en: "State",         mr: "राज्य",         bn: "राज्य",         query: "India state government news today" },
  { id: "national",      hi: "राष्ट्रीय",     en: "National",      mr: "राष्ट्रीय",     bn: "জাতীয়",        query: "India national news today" },
  { id: "international", hi: "अंतर्राष्ट्रीय", en: "World",        mr: "आंतरराष्ट्रीय",  bn: "আন্তর্জাতিক", query: "world international news today" },
  { id: "sports",        hi: "खेल",           en: "Sports",        mr: "क्रीडा",        bn: "খেলাধুলা",      query: "India cricket sports news today" },
  { id: "entertainment", hi: "मनोरंजन",       en: "Entertainment", mr: "मनोरंजन",      bn: "বিনোদন",       query: "India bollywood entertainment news" },
  { id: "business",      hi: "व्यापार",       en: "Business",      mr: "व्यापार",       bn: "ব্যবসা",        query: "India business economy stock news" },
  { id: "politics",      hi: "राजनीति",       en: "Politics",      mr: "राजकारण",      bn: "রাজনীতি",       query: "India politics BJP Congress news" },
  { id: "crime",         hi: "क्राइम",         en: "Crime",         mr: "गुन्हेगारी",     bn: "অপরাধ",        query: "India crime police news today" },
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

function AdBanner({ size = "leaderboard" }) {
  const h = size === "leaderboard" ? "80px" : size === "rectangle" ? "220px" : "90px";
  return (
    <div style={{ width:"100%", height:h, background:"linear-gradient(135deg,#f8f9fa,#e9ecef)", border:"2px dashed #ced4da", borderRadius:"4px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", margin:"10px 0", color:"#999" }}>
      <span style={{ fontSize:"9px", letterSpacing:"0.08em" }}>ADVERTISEMENT</span>
    </div>
  );
}

function ArticleReader({ article, lang, onBack, geminiKey }) {
  const [fullContent, setFullContent] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!geminiKey) { setFullContent(article.description); return; }
    setLoading(true);
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Write a detailed article in ${lang}: ${article.headline}` }] }] })
    })
    .then(res => res.json())
    .then(data => setFullContent(data.candidates?.[0]?.content?.parts?.[0]?.text || article.description))
    .finally(() => setLoading(false));
  }, [article, lang, geminiKey]);

  return (
    <div style={{ background:"#fff", minHeight:"100vh", padding:"20px" }}>
      <button onClick={onBack}><ChevronLeft /> Back</button>
      <h1>{article.headline}</h1>
      {loading ? <p>Generating...</p> : <p>{fullContent}</p>}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("hi");
  const [activeCat, setActiveCat] = useState("home");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [adminNews] = useState(() => { try { return JSON.parse(localStorage.getItem("gdnn_news") || "[]"); } catch { return []; } });

  const fetchNews = useCallback(async (catId) => {
    setLoading(true);
    const cat = CATEGORIES.find(c => c.id === catId);
    try {
      const res = await fetch(RSS_API + encodeURIComponent(buildFeed(cat.query, lang)));
      const data = await res.json();
      setArticles(data.items.map((item, i) => ({ id: i, headline: item.title, thumbnail: item.thumbnail, pubDate: item.pubDate, link: item.link, description: item.description })));
    } catch { console.error("Err"); } finally { setLoading(false); }
  }, [lang]);

  useEffect(() => { fetchNews(activeCat); }, [activeCat, fetchNews]);

  if (selectedArticle) return <ArticleReader article={selectedArticle} lang={lang} onBack={() => setSelectedArticle(null)} geminiKey={GEMINI_KEY} />;

  return (
    <div style={{ fontFamily:"sans-serif" }}>
      <header style={{ display:"flex", justifyContent:"space-between", padding:"15px", background:"#CC0000", color:"#fff" }}>
        <Menu onClick={() => setMenuOpen(!menuOpen)} />
        <img src={`data:image/png;base64,${LOGO_BASE64}`} style={{ height:"30px" }} />
        <RefreshCw onClick={() => fetchNews(activeCat)} />
      </header>
      
      {menuOpen && (
        <nav style={{ padding:"10px" }}>
          {CATEGORIES.map(c => <button key={c.id} onClick={() => { setActiveCat(c.id); setMenuOpen(false); }}>{c[lang]}</button>)}
          <button onClick={() => window.location.href="?admin"}>Admin</button>
        </nav>
      )}

      <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width:"100%" }}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      <main style={{ padding:"15px" }}>
        {loading ? <p>Loading...</p> : articles.map(a => (
          <div key={a.id} onClick={() => setSelectedArticle(a)} style={{ marginBottom:"20px" }}>
            <h3>{a.headline}</h3>
            {a.thumbnail && <img src={a.thumbnail} style={{ width:"100%" }} />}
          </div>
        ))}
      </main>
      
      <footer style={{ background:"#1a1a1a", color:"#fff", padding:"20px", textAlign:"center" }}>
        <p>© 2026 GD News Network</p>
      </footer>
    </div>
  );
   }
   
