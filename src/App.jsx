import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, Menu, X, Clock, ChevronLeft, Radio, Globe, Share2, Bookmark, ChevronRight } from "lucide-react";
import { createClient } from "@supabase/supabase-client";
import { LOGO_BASE64 } from "./logoData.js";

// Environment Variables
const GK = import.meta.env.VITE_GEMINI_KEY || "";
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Supabase Client Initialisation
const supabase = (SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY) : null;

const RA = "https://api.rss2json.com/v1/api.json?rss_url=";
const CATS = [
  { id: "home", hi: "होम", en: "Home", q: "India breaking news today" },
  { id: "local", hi: "स्थानीय", en: "Local", q: "local India city news today" },
  { id: "state", hi: "राज्य", en: "State", q: "India state government news today" },
  { id: "national", hi: "राष्ट्रीय", en: "National", q: "India national news today" },
  { id: "international", hi: "अंतर्राष्ट्रीय", en: "World", q: "world international news today" },
  { id: "sports", hi: "खेल", en: "Sports", q: "India cricket sports news today" },
  { id: "entertainment", hi: "मनोरंजन", en: "Entertainment", q: "India bollywood entertainment news" },
  { id: "business", hi: "व्यापार", en: "Business", q: "India business economy news" },
  { id: "politics", hi: "राजनीति", en: "Politics", q: "India politics news today" },
  { id: "crime", hi: "अपराध", en: "Crime", q: "India crime news today" },
];
const RED = "#CC0000";

function ta(d, l) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return l === "hi" ? "अभी" : "Just now";
  if (m < 60) return l === "hi" ? `${m} मिनट पहले` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return l === "hi" ? `${h} घंटे पहले` : `${h}h ago`;
  return l === "hi" ? `${Math.floor(h / 24)} दिन पहले` : `${Math.floor(h / 24)}d ago`;
}

function cl(t) {
  const i = t.lastIndexOf(" - ");
  if (i > 10 && i > t.length - 45) return { h: t.slice(0, i), s: t.slice(i + 3) };
  return { h: t, s: "GD News Network" };
}

function Ad({ h = "80px" }) {
  return (
    <div style={{ width: "100%", height: h, background: "#f8f8f8", border: "2px dashed #ddd", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "10px 0", color: "#bbb" }}>
      <span style={{ fontSize: "9px", letterSpacing: "0.1em" }}>ADVERTISEMENT</span>
      <span style={{ fontSize: "11px", fontWeight: "600", marginTop: "2px" }}>Google AdSense</span>
    </div>
  );
}

function Img({ src, height = "100%" }) {
  const [err, setErr] = useState(false);
  const proxyUrl = src ? `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=400&h=250&fit=cover` : "";
  if (!src || err) return <div style={{ width: "100%", height, background: "linear-gradient(135deg,#CC0000,#7a0000)", display: "flex", alignItems: "center", justifyContent: "center" }}><img src={`data:image/png;base64,${LOGO_BASE64}`} alt="" style={{ height: "40px", objectFit: "contain", opacity: 0.5 }} /></div>;
  return <img src={proxyUrl} alt="" style={{ width: "100%", height, objectFit: "cover", display: "block" }} onError={() => setErr(true)} />;
}

async function gemini(prompt) {
  if (!GK) return null;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GK}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { return null; }
}

function Reader({ art, lang, onBack }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [bm, setBm] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const p = lang === "hi"
        ? `तुम GD News Network के वरिष्ठ पत्रकार हो। नीचे दी गई खबर पर एक विस्तृत, रोचक 400 शब्द का Hindi news article लिखो। Article में - पूरी खबर का विवरण, पृष्ठभूमि, प्रभाव और विशेषज्ञ राय शामिल करो। केवल article body लिखो, कोई heading नहीं।\n\nShirshak (Headline): ${art.headline}\nSaaransh (Summary): ${art.desc}`
        : `You are a senior journalist at GD News Network. Write a detailed, engaging 400-word news article based on the headline and summary below. Include full story details, background context, impact analysis, and expert perspective. Write only the article body, no headings.\n\nHeadline: ${art.headline}\nSummary: ${art.desc}`;
      const text = await gemini(p);
      setBody(text || art.desc || "Content unavailable.");
      setLoading(false);
    })();
  }, [art, lang]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Noto Sans','Inter',sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ background: RED, padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px", display: "flex" }}><ChevronLeft size={24} /></button>
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD" style={{ height: "28px", objectFit: "contain" }} />
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
          <button onClick={() => setBm(!bm)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><Bookmark size={20} fill={bm ? "#fff" : "none"} /></button>
          <button onClick={() => navigator.share?.({ title: art.headline, url: art.link })} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><Share2 size={20} /></button>
        </div>
      </div>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "16px 14px 50px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
          <span style={{ background: RED, color: "#fff", fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "3px" }}>GD NEWS NETWORK</span>
          <span style={{ fontSize: "11px", color: "#888", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={11} />{ta(art.pubDate, lang)}</span>
        </div>
        <h1 style={{ fontSize: "21px", fontWeight: "800", lineHeight: 1.35, color: "#111", margin: "0 0 16px" }}>{art.headline}</h1>
        {art.img && <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden" }}><Img src={art.img} height="220px" /><div style={{ background: "#f5f5f5", padding: "5px 10px", fontSize: "10px", color: "#999" }}>© GD News Network</div></div>}
        <Ad h="80px" />
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: RED }} />
            <p style={{ color: "#888", fontSize: "14px", marginTop: "12px" }}>{GK ? (lang === "hi" ? "🤖 AI पूरी खबर लिख रहा है..." : "🤖 AI writing full article...") : (lang === "hi" ? "खबर导 रही है..." : "Loading article...")}</p>
          </div>
        ) : (
          <div style={{ fontSize: "16px", lineHeight: 1.85, color: "#222" }}>
            {body.split("\n").filter(p => p.trim()).map((p, i) => <p key={i} style={{ margin: "0 0 16px" }}>{p}</p>)}
          </div>
        )}
        <Ad h="220px" />
        <div style={{ borderTop: "1px solid #eee", paddingTop: "14px", marginTop: "10px" }}>
          <p style={{ fontSize: "11px", color: "#bbb", margin: "0 0 8px" }}>{lang === "hi" ? "मूल स्रोत:" : "Source:"} {art.src}</p>
          <a href={art.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: RED, fontWeight: "700" }}>{lang === "hi" ? "मूल खबर पढ़ें →" : "Read Original →"}</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const isAdmin = window.location.pathname === "/admin";
  if (isAdmin) return <Admin />;

  const [lang, setLang] = useState("hi");
  const [cat, setCat] = useState("home");
  const [arts, setArts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [menu, setMenu] = useState(false);
  const [srch, setSrch] = useState(false);
  const [sq, setSq] = useState("");
  const [reader, setReader] = useState(null);
  const [adminNews, setAdminNews] = useState([]);

  const fetchAdminNews = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        setAdminNews(data.map(n => ({
          id: n.id,
          title: n.title,
          summary: n.summary,
          image: n.image,
          category: n.category,
          createdAt: n.created_at
        })));
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadNews = useCallback(async (catId) => {
    setLoading(true); setErr(null);
    const c = CATS.find(x => x.id === catId);
    try {
      const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(c.q)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const r = await fetch(RA + encodeURIComponent(feed));
      const d = await r.json();
      if (d.status !== "ok") throw new Error();
      setArts(d.items.slice(0, 25).map((it, i) => {
        const { h, s } = cl(it.title || "");
        const img = it.thumbnail || it.enclosure?.link || null;
        return { id: it.guid || i, headline: h, src: s, link: it.link, pubDate: it.pubDate, img, desc: (it.description || "").replace(/<\/[^>]+>/g, "").slice(0, 300) };
      }));
    } catch { setErr(lang === "hi" ? "खबरें लोड नहीं हो सकीं।" : "Could not load news."); }
    setLoading(false);
  }, [lang]);

  useEffect(() => { loadNews(cat); fetchAdminNews(); }, [cat, loadNews, fetchAdminNews]);
  useEffect(() => { const t = setInterval(() => { loadNews(cat); fetchAdminNews(); }, 5 * 60 * 1000); return () => clearInterval(t); }, [cat, loadNews, fetchAdminNews]);

  if (reader) return <Reader art={reader} lang={lang} onBack={() => setReader(null)} />;
  const list = sq ? arts.filter(a => a.headline.toLowerCase().includes(sq.toLowerCase())) : arts;
  const ticker = [...adminNews.slice(0, 2), ...arts.slice(0, 6)].map(a => a.headline || a.title).filter(Boolean);

  return (
    <div style={{ background: "#fff", fontFamily: "'Noto Sans','Inter',sans-serif", color: "#111", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}*{box-sizing:border-box}body{margin:0}a{text-decoration:none;color:inherit}::-webkit-scrollbar{display:none}`}</style>
      <div style={{ background: "#1a1a1a", padding: "5px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: "#aaa" }}>{new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
        <button onClick={() => setLang(l => l === "hi" ? "en" : "hi")} style={{ display: "flex", alignItems: "center", gap: "4px", background: RED, color: "#fff", border: "none", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}><Globe size={11} />{lang === "hi" ? "English" : "हिंदी"}</button>
      </div>
      <header style={{ background: "#fff", borderBottom: `3px solid ${RED}`, position: "sticky", top: 0, zIndex: 40, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" }}>
          <button onClick={() => setMenu(!menu)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#111" }}>{menu ? <X size={22} /> : <Menu size={22} />}</button>
          <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={{ height: "44px", width: "auto", objectFit: "contain" }} />
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setSrch(!srch)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#111" }}><Search size={20} /></button>
            <button onClick={() => { loadNews(cat); fetchAdminNews(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#111" }}><RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /></button>
          </div>
        </div>
        {srch && <div style={{ padding: "8px 12px", background: "#f5f5f5", borderTop: "1px solid #eee" }}><input autoFocus value={sq} onChange={e => setSq(e.target.value)} placeholder={lang === "hi" ? "खबरें खोजें..." : "Search news..."} style={{ width: "100%", padding: "9px 14px", border: "1px solid #ddd", borderRadius: "20px", fontSize: "14px", outline: "none" }} /></div>}
        {menu && <nav style={{ background: "#fff", borderTop: "1px solid #eee", maxHeight: "70vh", overflowY: "auto" }}>
          {CATS.map(c => <button key={c.id} onClick={() => { setCat(c.id); setMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 16px", background: cat === c.id ? "#fff5f5" : "none", border: "none", borderBottom: "1px solid #f5f5f5", fontSize: "14px", fontWeight: cat === c.id ? "800" : "400", color: cat === c.id ? RED : "#333", cursor: "pointer" }}>{lang === "hi" ? c.hi : c.en}</button>)}
          <button onClick={() => window.location.href = "/admin"} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 16px", background: "none", border: "none", borderTop: "2px solid #eee", fontSize: "14px", color: "#666", cursor: "pointer" }}>🔐 Admin Panel</button>
        </nav>}
      </header>
      <div style={{ padding: "0 12px", maxWidth: "760px", margin: "0 auto" }}><Ad h="80px" /></div>
      {ticker.length > 0 && <div style={{ display: "flex", alignItems: "center", background: RED, overflow: "hidden", height: "32px" }}>
        <span style={{ display: "flex", alignItems: "center", background: "#1a1a1a", color: "#e8b84b", fontSize: "11px", fontWeight: "800", padding: "0 12px", height: "100%", flexShrink: 0, whiteSpace: "nowrap" }}><Radio size={11} style={{ marginRight: "4px" }} />{lang === "hi" ? "ब्रेकिंग" : "LIVE"}</span>
        <div style={{ overflow: "hidden", flex: 1, height: "100%", display: "flex", alignItems: "center" }}><div style={{ display: "flex", whiteSpace: "nowrap", animation: "ticker 40s linear infinite" }}>{ticker.concat(ticker).map((h, i) => <span key={i} style={{ color: "#fff", fontSize: "12px", paddingRight: "16px" }}>{h} <span style={{ color: "#e8b84b", margin: "0 14px" }}>●</span></span>)}</div></div>
      </div>}
      <nav style={{ background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: "67px", zIndex: 30 }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", overflowX: "auto", padding: "0 8px", gap: "2px", scrollbarWidth: "none" }}>
          {CATS.map(c => <button key={c.id} onClick={() => setCat(c.id)} style={{ background: "none", border: "none", padding: "10px 12px", fontSize: "13px", fontWeight: "600", color: cat === c.id ? RED : "#888", cursor: "pointer", whiteSpace: "nowrap", borderBottom: cat === c.id ? `2.5px solid ${RED}` : "2.5px solid transparent" }}>{lang === "hi" ? c.hi : c.en}</button>)}
        </div>
      </nav>
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "12px 12px 50px" }}>
        {adminNews.length > 0 && <section style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", borderLeft: `4px solid ${RED}`, paddingLeft: "8px", margin: "0 0 10px" }}><span style={{ fontWeight: "800", fontSize: "14px" }}>📢 {lang === "hi" ? "विशेष खबर" : "Special Report"}</span></div>
          {adminNews.slice(0, 2).map((n, i) => <div key={i} onClick={() => setReader({ headline: n.title, desc: n.summary, img: n.image, pubDate: n.createdAt, link: "#", src: "GD News Network" })} style={{ background: "#fff", border: `2px solid ${RED}`, borderRadius: "8px", overflow: "hidden", marginBottom: "10px", cursor: "pointer" }}>
            {n.image && <div style={{ height: "180px", overflow: "hidden" }}><Img src={n.image} height="180px" /></div>}
            <div style={{ padding: "12px 14px" }}><span style={{ fontSize: "9px", fontWeight: "800", color: RED, letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>GD NEWS NETWORK</span><h2 style={{ fontSize: "17px", fontWeight: "800", lineHeight: 1.3, color: "#111", margin: "0 0 6px" }}>{n.title}</h2><p style={{ fontSize: "13px", color: "#555", lineHeight: 1.5, margin: "0 0 8px" }}>{n.summary}</p><span style={{ fontSize: "12px", color: RED, fontWeight: "700" }}>{lang === "hi" ? "पूरी खबर →" : "Full Story →"}</span></div>
          </div>)}
        </section>}
        {loading && <div style={{ textAlign: "center", padding: "60px 0" }}><RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: RED }} /><p style={{ color: "#888", fontSize: "13px", marginTop: "10px" }}>{lang === "hi" ? "खबरें लोड हो रही हैं..." : "Loading news..."}</p></div>}
        {err && <div style={{ textAlign: "center", padding: "50px 20px" }}><p style={{ color: RED, fontWeight: "700", fontSize: "14px" }}>{err}</p><button onClick={() => loadNews(cat)} style={{ background: RED, color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", marginTop: "10px" }}>{lang === "hi" ? "पुनः प्रयास" : "Retry"}</button></div>}
        {!loading && !err && list.length > 0 && <>
          <div onClick={() => setReader(list[0])} style={{ background: "#fff", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden", marginBottom: "12px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden" }}>
              <Img src={list[0].img} height="220px" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%,rgba(0,0,0,0.5))" }} />
              <span style={{ position: "absolute", top: "10px", left: "10px", background: RED, color: "#fff", fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "3px" }}>{lang === "hi" ? "ब्रेकिंग न्यूज" : "BREAKING NEWS"}</span>
            </div>
            <div style={{ padding: "14px" }}>
              <span style={{ fontSize: "9px", fontWeight: "800", color: RED, letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>GD NEWS NETWORK</span>
              <h1 style={{ fontSize: "19px", fontWeight: "800", lineHeight: 1.3, color: "#111", margin: "0 0 8px" }}>{list[0].headline}</h1>
              <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.5, margin: "0 0 10px" }}>{list[0].desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#aaa", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={11} />{ta(list[0].pubDate, lang)}</span>
                <span style={{ fontSize: "12px", color: RED, fontWeight: "700" }}>{lang === "hi" ? "पूरी खबर पढ़ें →" : "Read Full Story →"}</span>
              </div>
            </div>
          </div>
          <Ad h="80px" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        " }}>
 