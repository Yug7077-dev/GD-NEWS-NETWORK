import { useState, useEffect } from "react";
import { LOGO_BASE64 } from "./logoData.js";

const ADMIN_PASS = "gdnews2025";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [news, setNews] = useState([]);
  const [form, setForm] = useState({ title: "", summary: "", image: "", category: "राष्ट्रीय" });
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { setNews(JSON.parse(localStorage.getItem("gdnn_news") || "[]")); } catch {}
  }, []);

  const save = (updated) => {
    setNews(updated);
    localStorage.setItem("gdnn_news", JSON.stringify(updated));
    window.dispatchEvent(new Event("gdnn_update"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const publish = () => {
    if (!form.title || !form.summary) return alert("Title aur summary zaroori hai!");
    const newItem = { ...form, createdAt: new Date().toISOString(), id: Date.now() };
    save([newItem, ...news]);
    setForm({ title: "", summary: "", image: "", category: "राष्ट्रीय" });
  };

  const deleteNews = (id) => save(news.filter(n => n.id !== id));

  const aiWrite = async () => {
    if (!aiTopic) return alert("Topic daalo pehle!");
    if (!GEMINI_KEY) return alert("Gemini API key set nahi hai Vercel mein!");
    setAiLoading(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Tu GD News Network ka senior journalist hai. Topic: "${aiTopic}" par ek news article likho.
JSON format mein return karo (no markdown):
{"title":"compelling Hindi headline","summary":"3-4 line news summary Hindi mein, factual aur engaging"}
Sirf JSON, kuch aur nahi.`
            }]
          }]
        }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setForm(f => ({ ...f, title: parsed.title || "", summary: parsed.summary || "" }));
    } catch (e) { alert("AI Error: " + e.message); }
    finally { setAiLoading(false); }
  };

  if (!auth) return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "300px", textAlign: "center" }}>
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News" style={{ height: "50px", marginBottom: "16px" }} />
        <h2 style={{ color: "#CC0000", margin: "0 0 20px", fontSize: "18px" }}>Admin Panel</h2>
        <input type="password" placeholder="Password daalo..." value={pass} onChange={e => setPass(e.target.value)}
          style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box" }} />
        <button onClick={() => pass === ADMIN_PASS ? setAuth(true) : alert("Galat password!")}
          style={{ width: "100%", padding: "10px", background: "#CC0000", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
          Login
        </button>
        <p style={{ fontSize: "11px", color: "#aaa", marginTop: "12px" }}>Default: gdnews2025</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#CC0000", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="" style={{ height: "36px" }} />
        <span style={{ color: "#fff", fontWeight: "800", fontSize: "16px" }}>GD News Network — Admin Panel</span>
        {saved && <span style={{ marginLeft: "auto", background: "#4caf50", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>✅ Saved!</span>}
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>

        {/* AI Writer */}
        <div style={{ background: "#fff", borderRadius: "10px", padding: "16px", marginBottom: "16px", border: "1px solid #e0e0e0" }}>
          <h3 style={{ color: "#CC0000", margin: "0 0 12px", fontSize: "15px" }}>🤖 AI News Writer</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <input placeholder="Topic daalo (jaise: MP mein barish, Delhi crime...)"
              value={aiTopic} onChange={e => setAiTopic(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }} />
            <button onClick={aiWrite} disabled={aiLoading}
              style={{ padding: "8px 16px", background: aiLoading ? "#aaa" : "#CC0000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
              {aiLoading ? "लिख रहा है..." : "AI se Likhao"}
            </button>
          </div>
        </div>

        {/* Publish Form */}
        <div style={{ background: "#fff", borderRadius: "10px", padding: "16px", marginBottom: "16px", border: "1px solid #e0e0e0" }}>
          <h3 style={{ color: "#CC0000", margin: "0 0 12px", fontSize: "15px" }}>📝 Khaber Publish Karo</h3>

          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", marginBottom: "10px" }}>
            {["स्थानीय", "राज्य", "राष्ट्रीय", "अंतर्राष्ट्रीय", "खेल", "मनोरंजन", "व्यापार", "राजनीति", "अपराध"].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input placeholder="Headline / शीर्षक *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", marginBottom: "10px", boxSizing: "border-box" }} />

          <textarea placeholder="Khaber ka summary / विवरण *" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            rows={4} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", resize: "vertical" }} />

          <input placeholder="Image URL (optional)" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", boxSizing: "border-box" }} />

          <button onClick={publish}
            style={{ width: "100%", padding: "12px", background: "#CC0000", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "800", cursor: "pointer" }}>
            🚀 Publish Karo — GD News Network
          </button>
        </div>

        {/* Published News */}
        {news.length > 0 && (
          <div>
            <h3 style={{ fontSize: "14px", color: "#333", marginBottom: "10px" }}>📋 Published News ({news.length})</h3>
            {news.map(n => (
              <div key={n.id} style={{ background: "#fff", borderRadius: "8px", padding: "12px", marginBottom: "8px", border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", color: "#CC0000", fontWeight: "800", letterSpacing: "0.05em" }}>{n.category}</span>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: "700", color: "#333" }}>{n.title}</p>
                </div>
                <button onClick={() => deleteNews(n.id)}
                  style={{ background: "#ff5252", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
