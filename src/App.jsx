import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Clock, ExternalLink, Radio, AlertCircle, Menu, X } from "lucide-react";
import { LOGO_BASE64 } from "./logoData.js";

const CATEGORIES = [
  { id: "top", label: "Top Stories", query: "India" },
  { id: "national", label: "National", query: "India national news" },
  { id: "world", label: "World", query: "world international news" },
  { id: "business", label: "Business", query: "India business economy" },
  { id: "tech", label: "Technology", query: "India technology" },
  { id: "sports", label: "Sports", query: "India sports cricket" },
  { id: "entertainment", label: "Entertainment", query: "India entertainment bollywood" },
];

const RSS_TO_JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

function buildFeedUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function stripSourceFromTitle(title) {
  const idx = title.lastIndexOf(" - ");
  if (idx > title.length - 40 && idx > 10) {
    return { headline: title.slice(0, idx), source: title.slice(idx + 3) };
  }
  return { headline: title, source: "" };
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("top");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchNews = useCallback(async (categoryId) => {
    setLoading(true);
    setError(null);
    const category = CATEGORIES.find((c) => c.id === categoryId);
    try {
      const feedUrl = buildFeedUrl(category.query);
      const res = await fetch(RSS_TO_JSON + encodeURIComponent(feedUrl));
      const data = await res.json();
      if (data.status !== "ok" || !data.items) {
        throw new Error("Feed unavailable");
      }
      const cleaned = data.items.slice(0, 24).map((item, i) => {
        const { headline, source } = stripSourceFromTitle(item.title || "");
        return {
          id: item.guid || item.link || i,
          headline,
          source: source || item.author || "News",
          link: item.link,
          pubDate: item.pubDate,
          thumbnail: item.thumbnail || item.enclosure?.link || null,
          description: (item.description || "").replace(/<[^>]+>/g, "").slice(0, 160),
        };
      });
      setArticles(cleaned);
      setLastUpdated(new Date());
    } catch (e) {
      setError("News load nahi ho payi. Connection check karke dobara try karo.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory, fetchNews]);

  useEffect(() => {
    const interval = setInterval(() => fetchNews(activeCategory), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCategory, fetchNews]);

  const headlineTicker = articles.slice(0, 6).map((a) => a.headline);

  return (
    <div style={styles.page}>
      <style>{fontImports}</style>

      {/* Top bar */}
      <header style={styles.topbar}>
        <div style={styles.topbarInner}>
          <button
            style={styles.menuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={styles.brandBlock}>
            <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={styles.logoImg} />
          </div>

          <button
            onClick={() => fetchNews(activeCategory)}
            style={styles.refreshBtn}
            aria-label="Refresh news"
          >
            <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>

        {/* Slide-down category menu */}
        {menuOpen && (
          <div style={styles.menuDrawer}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setMenuOpen(false);
                }}
                style={{
                  ...styles.menuItem,
                  ...(activeCategory === cat.id ? styles.menuItemActive : {}),
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Breaking ticker */}
      {headlineTicker.length > 0 && (
        <div style={styles.tickerWrap}>
          <span style={styles.tickerLabel}>
            <Radio size={12} style={{ marginRight: 5 }} />
            LIVE
          </span>
          <div style={styles.tickerTrack}>
            <div style={styles.tickerContent}>
              {headlineTicker.concat(headlineTicker).map((h, i) => (
                <span key={i} style={styles.tickerItem}>
                  {h} <span style={styles.tickerDot}>●</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category tabs (desktop-friendly horizontal scroll) */}
      <nav style={styles.tabsNav}>
        <div style={styles.tabsScroll}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                ...styles.tab,
                ...(activeCategory === cat.id ? styles.tabActive : {}),
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {lastUpdated && (
          <div style={styles.updatedRow}>
            <span style={styles.updatedText}>Updated {timeAgo(lastUpdated.toISOString())}</span>
            <span style={styles.liveDot}></span>
          </div>
        )}

        {loading && articles.length === 0 && (
          <div style={styles.stateBox}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#E8B84B" }} />
            <p style={styles.stateText}>Taaza khabrein la rahe hain...</p>
          </div>
        )}

        {error && (
          <div style={styles.stateBox}>
            <AlertCircle size={24} style={{ color: "#E63946" }} />
            <p style={styles.stateText}>{error}</p>
            <button onClick={() => fetchNews(activeCategory)} style={styles.retryBtn}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <>
            {/* Featured hero article */}
            <a href={articles[0].link} target="_blank" rel="noopener noreferrer" style={styles.featuredCard}>
              <div style={styles.featuredImgWrap}>
                {articles[0].thumbnail ? (
                  <img src={articles[0].thumbnail} alt="" style={styles.featuredImg} />
                ) : (
                  <div style={styles.featuredImgFallback} />
                )}
                <div style={styles.featuredGradient} />
                <span style={styles.breakingBadge}>BREAKING</span>
              </div>
              <div style={styles.featuredBody}>
                <span style={styles.sourceTag}>{articles[0].source}</span>
                <h2 style={styles.featuredHeadline}>{articles[0].headline}</h2>
                {articles[0].description && (
                  <p style={styles.featuredDesc}>{articles[0].description}...</p>
                )}
                <span style={styles.timeTag}>
                  <Clock size={12} style={{ marginRight: 4 }} />
                  {timeAgo(articles[0].pubDate)}
                </span>
              </div>
            </a>

            {/* Grid of remaining articles */}
            <div style={styles.grid}>
              {articles.slice(1).map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.card}
                >
                  {article.thumbnail ? (
                    <img src={article.thumbnail} alt="" style={styles.cardImg} />
                  ) : (
                    <div style={styles.cardImgFallback}>
                      <span style={styles.fallbackInitial}>{article.source[0] || "N"}</span>
                    </div>
                  )}
                  <div style={styles.cardBody}>
                    <span style={styles.sourceTag}>{article.source}</span>
                    <h3 style={styles.cardHeadline}>{article.headline}</h3>
                    <div style={styles.cardFooter}>
                      <span style={styles.timeTag}>
                        <Clock size={11} style={{ marginRight: 3 }} />
                        {timeAgo(article.pubDate)}
                      </span>
                      <ExternalLink size={12} color="#8A8580" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={styles.footer}>
        <img src={`data:image/png;base64,${LOGO_BASE64}`} alt="GD News Network" style={styles.footerLogo} />
        <p style={styles.footerText}>Headlines aggregated via Google News RSS. Full stories open on publisher sites.</p>
      </footer>
    </div>
  );
}

const fontImports = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap');
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  * { box-sizing: border-box; }
  body { margin: 0; }
  a { text-decoration: none; color: inherit; }
`;

const RED = "#B91C1C";
const RED_DEEP = "#7F1212";
const GOLD = "#E8B84B";
const INK = "#121214";
const CHARCOAL = "#1C1C20";
const CARD = "#1F1F24";

const styles = {
  page: {
    minHeight: "100vh",
    background: INK,
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: "#EDEAE3",
  },
  topbar: {
    background: `linear-gradient(180deg, ${CHARCOAL} 0%, ${INK} 100%)`,
    borderBottom: `2px solid ${GOLD}`,
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  topbarInner: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
  },
  menuBtn: {
    background: "rgba(232,184,75,0.08)",
    border: "1px solid rgba(232,184,75,0.25)",
    borderRadius: 8,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: GOLD,
    cursor: "pointer",
    flexShrink: 0,
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logoImg: {
    height: 42,
    width: "auto",
    objectFit: "contain",
  },
  refreshBtn: {
    background: "rgba(232,184,75,0.08)",
    border: "1px solid rgba(232,184,75,0.25)",
    borderRadius: 8,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: GOLD,
    cursor: "pointer",
    flexShrink: 0,
  },
  menuDrawer: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid rgba(232,184,75,0.15)",
  },
  menuItem: {
    background: "none",
    border: "none",
    borderBottom: "1px solid rgba(232,184,75,0.08)",
    color: "#C9C5BC",
    textAlign: "left",
    padding: "13px 18px",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  menuItemActive: {
    color: GOLD,
    background: "rgba(232,184,75,0.06)",
  },
  tickerWrap: {
    display: "flex",
    alignItems: "center",
    background: `linear-gradient(90deg, ${RED_DEEP}, ${RED})`,
    overflow: "hidden",
    height: 32,
  },
  tickerLabel: {
    display: "flex",
    alignItems: "center",
    background: INK,
    color: GOLD,
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: "0.06em",
    padding: "0 12px",
    height: "100%",
    flexShrink: 0,
  },
  tickerTrack: {
    overflow: "hidden",
    flex: 1,
    height: "100%",
    display: "flex",
    alignItems: "center",
  },
  tickerContent: {
    display: "flex",
    whiteSpace: "nowrap",
    animation: "tickerScroll 38s linear infinite",
  },
  tickerItem: {
    color: "#FBF0DC",
    fontSize: 12.5,
    paddingRight: 26,
    fontWeight: 500,
  },
  tickerDot: {
    color: GOLD,
    marginLeft: 26,
    fontSize: 7,
  },
  tabsNav: {
    background: CHARCOAL,
    borderBottom: "1px solid rgba(232,184,75,0.12)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tabsScroll: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    overflowX: "auto",
    padding: "0 14px",
    gap: 2,
    scrollbarWidth: "none",
  },
  tab: {
    background: "none",
    border: "none",
    padding: "12px 13px",
    fontSize: 13,
    fontWeight: 700,
    color: "#7C7870",
    cursor: "pointer",
    whiteSpace: "nowrap",
    borderBottom: "2.5px solid transparent",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.01em",
  },
  tabActive: {
    color: GOLD,
    borderBottom: `2.5px solid ${RED}`,
  },
  main: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "16px 14px 40px",
  },
  updatedRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginBottom: 12,
  },
  updatedText: {
    fontSize: 11,
    color: "#7C7870",
    fontWeight: 500,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#4ADE80",
    animation: "pulse 2s ease-in-out infinite",
  },
  stateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "60px 20px",
    textAlign: "center",
  },
  stateText: {
    color: "#9A958C",
    fontSize: 14,
  },
  retryBtn: {
    background: RED,
    color: "#fff",
    border: "none",
    padding: "9px 20px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  featuredCard: {
    display: "block",
    background: CARD,
    border: "1px solid rgba(232,184,75,0.15)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },
  featuredImgWrap: {
    position: "relative",
    width: "100%",
    height: 200,
    background: "#2A2A30",
  },
  featuredImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  featuredImgFallback: {
    width: "100%",
    height: "100%",
    background: `linear-gradient(135deg, ${RED_DEEP}, ${INK})`,
  },
  featuredGradient: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(18,18,20,0.6) 100%)",
  },
  breakingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    background: RED,
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.05em",
    padding: "4px 10px",
    borderRadius: 4,
  },
  featuredBody: {
    padding: "16px 18px 18px",
  },
  sourceTag: {
    fontSize: 10.5,
    fontWeight: 800,
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  featuredHeadline: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.28,
    color: "#F5F2EA",
    margin: "7px 0 8px",
    letterSpacing: "-0.01em",
  },
  featuredDesc: {
    fontSize: 13.5,
    color: "#A8A39A",
    lineHeight: 1.5,
    margin: "0 0 10px",
  },
  timeTag: {
    fontSize: 11.5,
    color: "#7C7870",
    display: "inline-flex",
    alignItems: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
  card: {
    display: "flex",
    gap: 12,
    background: CARD,
    border: "1px solid rgba(232,184,75,0.1)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  cardImg: {
    width: 92,
    height: 92,
    objectFit: "cover",
    flexShrink: 0,
    background: "#2A2A30",
  },
  cardImgFallback: {
    width: 92,
    height: 92,
    flexShrink: 0,
    background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackInitial: {
    color: GOLD,
    fontFamily: "'Inter', sans-serif",
    fontSize: 26,
    fontWeight: 800,
  },
  cardBody: {
    padding: "10px 12px 10px 0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    minWidth: 0,
  },
  cardHeadline: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.32,
    color: "#E8E5DE",
    margin: "4px 0 6px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footer: {
    textAlign: "center",
    padding: "26px 20px",
    borderTop: "1px solid rgba(232,184,75,0.1)",
  },
  footerLogo: {
    height: 30,
    width: "auto",
    objectFit: "contain",
    opacity: 0.85,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 11,
    color: "#6B6760",
    margin: 0,
  },
};
