import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8090";

const api = {
  post: async (path, body, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  },
  get: async (path, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { ...(token ? { Authorization: token } : {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  },
};

// ─── MOCK DATA (used when backend is offline) ─────────────────────────────────
const MOCK_COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 67842.5, price_change_percentage_24h: 2.34, market_cap: 1328000000000, total_volume: 28400000000, image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3521.8, price_change_percentage_24h: -1.12, market_cap: 422000000000, total_volume: 14200000000, image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", current_price: 412.3, price_change_percentage_24h: 0.87, market_cap: 60000000000, total_volume: 1800000000, image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { id: "solana", symbol: "SOL", name: "Solana", current_price: 178.4, price_change_percentage_24h: 5.21, market_cap: 79000000000, total_volume: 4100000000, image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  { id: "ripple", symbol: "XRP", name: "XRP", current_price: 0.624, price_change_percentage_24h: -0.45, market_cap: 35000000000, total_volume: 1500000000, image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
  { id: "cardano", symbol: "ADA", name: "Cardano", current_price: 0.458, price_change_percentage_24h: 1.67, market_cap: 16000000000, total_volume: 620000000, image: "https://assets.coingecko.com/coins/images/975/small/cardano.png" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", current_price: 0.162, price_change_percentage_24h: 3.14, market_cap: 23000000000, total_volume: 980000000, image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", current_price: 7.82, price_change_percentage_24h: -2.3, market_cap: 10000000000, total_volume: 390000000, image: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png" },
];

const MOCK_PORTFOLIO = [
  { coin: MOCK_COINS[0], quantity: 0.5, avgBuy: 61000 },
  { coin: MOCK_COINS[1], quantity: 2.3, avgBuy: 3200 },
  { coin: MOCK_COINS[3], quantity: 15, avgBuy: 150 },
];

const MOCK_ORDERS = [
  { id: 1, orderType: "BUY", quantity: 0.1, price: 65000, coin: { name: "Bitcoin", symbol: "BTC" }, createdAt: "2026-05-10T10:30:00" },
  { id: 2, orderType: "SELL", quantity: 1.2, price: 3400, coin: { name: "Ethereum", symbol: "ETH" }, createdAt: "2026-05-12T14:20:00" },
  { id: 3, orderType: "BUY", quantity: 5, price: 170, coin: { name: "Solana", symbol: "SOL" }, createdAt: "2026-05-14T09:00:00" },
  { id: 4, orderType: "BUY", quantity: 0.4, price: 62000, coin: { name: "Bitcoin", symbol: "BTC" }, createdAt: "2026-05-15T16:45:00" },
];

// ─── SPARKLINE MINI CHART ─────────────────────────────────────────────────────
function Sparkline({ positive, width = 80, height = 32 }) {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const base = 50 + (positive ? i * 1.5 : -i * 1.2);
    return base + (Math.random() - 0.5) * 15;
  });
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map(p => ((p - min) / (max - min)) * (height - 4) + 2);
  const path = norm.map((y, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * width},${height - y}`).join(" ");
  const fill = norm.map((y, i) => `${(i / (pts.length - 1)) * width},${height - y}`).join(" ") + ` ${width},${height} 0,${height}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`g${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#00d4a8" : "#ff4d6d"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? "#00d4a8" : "#ff4d6d"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#g${positive})`} />
      <polyline points={norm.map((y, i) => `${(i / (pts.length - 1)) * width},${height - y}`).join(" ")} fill="none" stroke={positive ? "#00d4a8" : "#ff4d6d"} strokeWidth="1.5" />
    </svg>
  );
}

// ─── NUMBER FORMATTING ────────────────────────────────────────────────────────
const fmt = (n, decimals = 2) => {
  if (n === null || n === undefined) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "#080c14",
    color: "#e8edf5",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: "14px",
  },
  // Topbar
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 32px", height: "64px",
    background: "rgba(10,15,25,0.95)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    position: "sticky", top: 0, zIndex: 100,
  },
  logo: {
    fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px",
    background: "linear-gradient(135deg, #00d4a8, #0ea5e9)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    display: "flex", alignItems: "center", gap: "8px",
  },
  nav: { display: "flex", gap: "4px" },
  navBtn: (active) => ({
    padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: active ? "600" : "400",
    background: active ? "rgba(0,212,168,0.12)" : "transparent",
    color: active ? "#00d4a8" : "#8892a4",
    transition: "all 0.15s",
  }),
  userArea: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: {
    width: "34px", height: "34px", borderRadius: "50%",
    background: "linear-gradient(135deg, #00d4a8, #0ea5e9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", fontWeight: "700", color: "#080c14", cursor: "pointer",
  },
  // Layout
  layout: { display: "flex", minHeight: "calc(100vh - 64px)" },
  sidebar: {
    width: "220px", minWidth: "220px",
    background: "rgba(10,15,25,0.6)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    padding: "20px 12px",
    display: "flex", flexDirection: "column", gap: "4px",
  },
  sideItem: (active) => ({
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
    border: "none", width: "100%", textAlign: "left",
    background: active ? "rgba(0,212,168,0.1)" : "transparent",
    color: active ? "#00d4a8" : "#8892a4",
    fontSize: "13px", fontWeight: active ? "600" : "400",
    transition: "all 0.15s",
    borderLeft: active ? "2px solid #00d4a8" : "2px solid transparent",
  }),
  main: { flex: 1, padding: "28px 32px", overflowY: "auto" },
  // Cards
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px", padding: "24px",
  },
  statCard: (accent) => ({
    background: `linear-gradient(135deg, rgba(${accent},0.08), rgba(${accent},0.03))`,
    border: `1px solid rgba(${accent},0.15)`,
    borderRadius: "16px", padding: "20px",
  }),
  // Table
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 16px", textAlign: "left",
    fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
    color: "#556070", borderBottom: "1px solid rgba(255,255,255,0.06)",
    textTransform: "uppercase",
  },
  td: {
    padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  },
  // Buttons
  btn: (variant = "primary") => ({
    padding: variant === "sm" ? "6px 14px" : "12px 24px",
    borderRadius: "10px", border: "none", cursor: "pointer",
    fontWeight: "600", fontSize: variant === "sm" ? "12px" : "14px",
    background: variant === "primary" ? "linear-gradient(135deg, #00d4a8, #0ea5e9)"
      : variant === "danger" ? "rgba(255,77,109,0.15)"
      : "rgba(255,255,255,0.06)",
    color: variant === "primary" ? "#080c14" : variant === "danger" ? "#ff4d6d" : "#e8edf5",
    transition: "all 0.15s", letterSpacing: "0.01em",
  }),
  // Input
  input: {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#e8edf5", fontSize: "14px", outline: "none",
    transition: "border 0.15s", boxSizing: "border-box",
  },
  label: { display: "block", marginBottom: "6px", fontSize: "12px", color: "#8892a4", fontWeight: "500" },
  // Badge
  badge: (positive) => ({
    padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
    background: positive ? "rgba(0,212,168,0.12)" : "rgba(255,77,109,0.12)",
    color: positive ? "#00d4a8" : "#ff4d6d",
  }),
  // Section title
  sectionTitle: { fontSize: "18px", fontWeight: "700", marginBottom: "20px", letterSpacing: "-0.3px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" },
};

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", mobile: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      if (tab === "login") {
        const data = await api.post("/auth/login", { email: form.email, password: form.password });
        onLogin(data.jwt, { email: form.email, fullName: form.email.split("@")[0] });
      } else {
        const data = await api.post("/auth/signup", { email: form.email, password: form.password, fullName: form.fullName, mobile: form.mobile });
        onLogin(data.jwt, { email: form.email, fullName: form.fullName });
      }
    } catch (e) {
      // Demo mode — allow login with any credentials
      onLogin("demo-token-" + Date.now(), { email: form.email, fullName: form.fullName || form.email.split("@")[0] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* BG glow */}
      <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,168,0.06) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <div style={{ width: "420px", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ ...S.logo, justifyContent: "center", fontSize: "28px", marginBottom: "8px" }}>
            <span>◈</span> CryptoTrade
          </div>
          <p style={{ color: "#556070", fontSize: "13px" }}>Professional crypto trading platform</p>
        </div>
        {/* Card */}
        <div style={{ ...S.card, border: "1px solid rgba(0,212,168,0.15)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", marginBottom: "28px" }}>
            {["login", "signup"].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", background: tab === t ? "rgba(0,212,168,0.15)" : "transparent", color: tab === t ? "#00d4a8" : "#8892a4", transition: "all 0.15s", textTransform: "capitalize" }}>
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {tab === "signup" && (
              <>
                <div>
                  <label style={S.label}>Full Name</label>
                  <input style={S.input} placeholder="Karthik Daivadnya" value={form.fullName} onChange={set("fullName")} />
                </div>
                <div>
                  <label style={S.label}>Mobile</label>
                  <input style={S.input} placeholder="+91 98765 43210" value={form.mobile} onChange={set("mobile")} />
                </div>
              </>
            )}
            <div>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
            </div>
            {err && <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,77,109,0.1)", color: "#ff4d6d", fontSize: "13px" }}>{err}</div>}
            <button style={{ ...S.btn("primary"), marginTop: "4px" }} onClick={submit} disabled={loading}>
              {loading ? "Processing..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
        <p style={{ textAlign: "center", color: "#3a4455", marginTop: "20px", fontSize: "12px" }}>Demo mode: any credentials will work if backend is offline</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, token }) {
  const totalValue = MOCK_PORTFOLIO.reduce((s, h) => s + h.quantity * h.coin.current_price, 0);
  const totalCost = MOCK_PORTFOLIO.reduce((s, h) => s + h.quantity * h.avgBuy, 0);
  const pnl = totalValue - totalCost;
  const pnlPct = (pnl / totalCost) * 100;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "4px" }}>
          Good evening, <span style={{ background: "linear-gradient(135deg,#00d4a8,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{user.fullName}</span> 👋
        </h1>
        <p style={{ color: "#556070", fontSize: "13px" }}>Here's your trading overview for today</p>
      </div>

      {/* Stat cards */}
      <div style={S.grid4}>
        {[
          { label: "Portfolio Value", value: fmt(totalValue), sub: `${pnl >= 0 ? "+" : ""}${fmt(pnl)} today`, accent: "0,212,168", pos: true },
          { label: "Total P&L", value: `${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`, sub: "All time returns", accent: pnl >= 0 ? "0,212,168" : "255,77,109", pos: pnl >= 0 },
          { label: "Wallet Balance", value: fmt(12450.00), sub: "Available to trade", accent: "14,165,233", pos: true },
          { label: "Active Orders", value: "4", sub: "2 buy · 2 sell", accent: "168,85,247", pos: true },
        ].map((c, i) => (
          <div key={i} style={S.statCard(c.accent)}>
            <p style={{ color: "#8892a4", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>{c.label}</p>
            <p style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "4px", color: `rgb(${c.accent})` }}>{c.value}</p>
            <p style={{ color: c.pos ? "#00d4a8" : "#ff4d6d", fontSize: "12px" }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px", marginTop: "24px" }}>
        {/* Holdings */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Your Holdings</p>
          <table style={S.table}>
            <thead><tr>
              {["Asset", "Amount", "Value", "P&L"].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {MOCK_PORTFOLIO.map((h, i) => {
                const val = h.quantity * h.coin.current_price;
                const cost = h.quantity * h.avgBuy;
                const gain = val - cost;
                const gainPct = (gain / cost) * 100;
                return (
                  <tr key={i} style={{ transition: "background 0.1s" }}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src={h.coin.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                        <div>
                          <p style={{ fontWeight: "700", fontSize: "13px" }}>{h.coin.name}</p>
                          <p style={{ color: "#556070", fontSize: "11px" }}>{h.coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}><span style={{ fontWeight: "600" }}>{h.quantity}</span> <span style={{ color: "#556070" }}>{h.coin.symbol}</span></td>
                    <td style={S.td}><span style={{ fontWeight: "700" }}>{fmt(val)}</span></td>
                    <td style={S.td}><span style={S.badge(gain >= 0)}>{gain >= 0 ? "+" : ""}{gainPct.toFixed(2)}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recent Orders */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Recent Orders</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MOCK_ORDERS.slice(0, 4).map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: o.orderType === "BUY" ? "rgba(0,212,168,0.12)" : "rgba(255,77,109,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: o.orderType === "BUY" ? "#00d4a8" : "#ff4d6d" }}>
                    {o.orderType === "BUY" ? "↓" : "↑"}
                  </div>
                  <div>
                    <p style={{ fontWeight: "600", fontSize: "13px" }}>{o.orderType} {o.coin.symbol}</p>
                    <p style={{ color: "#556070", fontSize: "11px" }}>{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "700", fontSize: "13px" }}>{o.quantity} {o.coin.symbol}</p>
                  <p style={{ color: "#556070", fontSize: "11px" }}>{fmt(o.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MARKET PAGE ──────────────────────────────────────────────────────────────
function MarketPage({ token, onTrade }) {
  const [coins, setCoins] = useState(MOCK_COINS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get("/coins?page=1", token);
        if (data && data.length) setCoins(data);
      } catch { /* use mock */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>Live Market</h1>
        <input style={{ ...S.input, width: "260px" }} placeholder="🔍  Search coins..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            {["#", "Coin", "Price", "24h Change", "Market Cap", "Volume", "7D Chart", ""].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((coin, i) => {
              const pos = coin.price_change_percentage_24h >= 0;
              return (
                <tr key={coin.id} style={{ cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...S.td, color: "#556070", fontWeight: "600", width: "40px" }}>{i + 1}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={coin.image} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                      <div>
                        <p style={{ fontWeight: "700" }}>{coin.name}</p>
                        <p style={{ color: "#556070", fontSize: "11px", textTransform: "uppercase" }}>{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...S.td, fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>{fmt(coin.current_price)}</td>
                  <td style={S.td}><span style={S.badge(pos)}>{pos ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%</span></td>
                  <td style={{ ...S.td, color: "#8892a4" }}>{fmt(coin.market_cap)}</td>
                  <td style={{ ...S.td, color: "#8892a4" }}>{fmt(coin.total_volume)}</td>
                  <td style={S.td}><Sparkline positive={pos} /></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={S.btn("sm")} onClick={() => onTrade(coin, "BUY")}>Buy</button>
                      <button style={{ ...S.btn("sm"), background: "rgba(255,77,109,0.1)", color: "#ff4d6d" }} onClick={() => onTrade(coin, "SELL")}>Sell</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────
function PortfolioPage() {
  const totalValue = MOCK_PORTFOLIO.reduce((s, h) => s + h.quantity * h.coin.current_price, 0);
  const totalCost = MOCK_PORTFOLIO.reduce((s, h) => s + h.quantity * h.avgBuy, 0);
  const totalPnl = totalValue - totalCost;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "24px" }}>Portfolio</h1>
      <div style={{ ...S.grid4, marginBottom: "24px" }}>
        {[
          { label: "Total Value", value: fmt(totalValue), accent: "0,212,168" },
          { label: "Total Cost", value: fmt(totalCost), accent: "14,165,233" },
          { label: "Unrealized P&L", value: `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}`, accent: totalPnl >= 0 ? "0,212,168" : "255,77,109" },
          { label: "ROI", value: `${((totalPnl / totalCost) * 100).toFixed(2)}%`, accent: "168,85,247" },
        ].map((c, i) => (
          <div key={i} style={S.statCard(c.accent)}>
            <p style={{ color: "#8892a4", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{c.label}</p>
            <p style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px", color: `rgb(${c.accent})` }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <p style={S.sectionTitle}>Holdings Breakdown</p>
        <table style={S.table}>
          <thead><tr>
            {["Asset", "Quantity", "Avg Buy Price", "Current Price", "Current Value", "Profit/Loss", "Allocation"].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {MOCK_PORTFOLIO.map((h, i) => {
              const val = h.quantity * h.coin.current_price;
              const cost = h.quantity * h.avgBuy;
              const pnl = val - cost;
              const pnlPct = (pnl / cost) * 100;
              const alloc = (val / totalValue) * 100;
              return (
                <tr key={i}>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={h.coin.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                      <div>
                        <p style={{ fontWeight: "700" }}>{h.coin.name}</p>
                        <p style={{ color: "#556070", fontSize: "11px" }}>{h.coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...S.td, fontWeight: "600" }}>{h.quantity}</td>
                  <td style={S.td}>{fmt(h.avgBuy)}</td>
                  <td style={{ ...S.td, fontWeight: "700" }}>{fmt(h.coin.current_price)}</td>
                  <td style={{ ...S.td, fontWeight: "700" }}>{fmt(val)}</td>
                  <td style={S.td}>
                    <div>
                      <span style={S.badge(pnl >= 0)}>{pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                      <p style={{ color: pnl >= 0 ? "#00d4a8" : "#ff4d6d", fontSize: "11px", marginTop: "4px" }}>{pnl >= 0 ? "+" : ""}{fmt(pnl)}</p>
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ height: "100%", borderRadius: "2px", width: `${alloc}%`, background: "linear-gradient(90deg,#00d4a8,#0ea5e9)" }} />
                      </div>
                      <span style={{ fontSize: "12px", color: "#8892a4", minWidth: "36px" }}>{alloc.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
function OrdersPage() {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter === "ALL" ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.orderType === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>Order History</h1>
        <div style={{ display: "flex", gap: "6px" }}>
          {["ALL", "BUY", "SELL"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "12px", background: filter === f ? "rgba(0,212,168,0.15)" : "rgba(255,255,255,0.05)", color: filter === f ? "#00d4a8" : "#8892a4" }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            {["Order ID", "Type", "Coin", "Quantity", "Price", "Total Value", "Date"].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td style={{ ...S.td, color: "#556070", fontFamily: "monospace" }}>#{o.id}</td>
                <td style={S.td}>
                  <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", background: o.orderType === "BUY" ? "rgba(0,212,168,0.12)" : "rgba(255,77,109,0.12)", color: o.orderType === "BUY" ? "#00d4a8" : "#ff4d6d" }}>
                    {o.orderType}
                  </span>
                </td>
                <td style={{ ...S.td, fontWeight: "700" }}>{o.coin.name} <span style={{ color: "#556070", fontWeight: "400" }}>({o.coin.symbol})</span></td>
                <td style={S.td}>{o.quantity}</td>
                <td style={S.td}>{fmt(o.price)}</td>
                <td style={{ ...S.td, fontWeight: "700" }}>{fmt(o.quantity * o.price)}</td>
                <td style={{ ...S.td, color: "#8892a4" }}>{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── WALLET PAGE ──────────────────────────────────────────────────────────────
function WalletPage({ token }) {
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");

  const deposit = () => {
    if (!amount || isNaN(amount)) { setMsg("Enter a valid amount"); return; }
    setMsg(`✅ Deposit of ${fmt(parseFloat(amount))} initiated! (Payment gateway integration required)`);
    setAmount("");
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "24px" }}>Wallet</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
        {/* Balance card */}
        <div>
          <div style={{ ...S.card, background: "linear-gradient(135deg, rgba(0,212,168,0.1), rgba(14,165,233,0.05))", border: "1px solid rgba(0,212,168,0.2)", marginBottom: "16px" }}>
            <p style={{ color: "#8892a4", fontSize: "12px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Available Balance</p>
            <p style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-1px", background: "linear-gradient(135deg,#00d4a8,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$12,450.00</p>
            <p style={{ color: "#556070", fontSize: "12px", marginTop: "6px" }}>≈ ₹10,37,462.50</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Total Deposited", value: "$25,000.00", icon: "↓" },
              { label: "Total Withdrawn", value: "$8,200.00", icon: "↑" },
              { label: "Trading P&L", value: "+$4,350.00", icon: "📈" },
            ].map((item, i) => (
              <div key={i} style={{ ...S.card, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#8892a4", fontSize: "13px" }}>{item.label}</span>
                <span style={{ fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deposit form */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Add Funds</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={S.label}>Amount (USD)</label>
              <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Quick Select</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[500, 1000, 5000, 10000].map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#8892a4", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>${a.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Payment Method</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {["Razorpay", "Stripe"].map(m => (
                  <div key={m} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(0,212,168,0.3)", background: "rgba(0,212,168,0.05)", textAlign: "center", cursor: "pointer" }}>
                    <p style={{ fontWeight: "600", fontSize: "13px", color: "#00d4a8" }}>{m}</p>
                    <p style={{ color: "#556070", fontSize: "11px" }}>Instant transfer</p>
                  </div>
                ))}
              </div>
            </div>
            {msg && <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(0,212,168,0.08)", color: "#00d4a8", fontSize: "13px" }}>{msg}</div>}
            <button style={S.btn("primary")} onClick={deposit}>Deposit Funds</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRADE MODAL ──────────────────────────────────────────────────────────────
function TradeModal({ coin, type, token, onClose }) {
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const total = (parseFloat(qty) || 0) * (coin?.current_price || 0);
  const isBuy = type === "BUY";

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      await api.post("/api/orders/pay", { coinId: coin.id, quantity: parseFloat(qty), orderType: type }, token);
      setDone(true);
    } catch {
      // Demo mode
      setDone(true);
    } finally { setLoading(false); }
  };

  if (!coin) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(6px)" }}>
      <div style={{ ...S.card, width: "420px", border: `1px solid ${isBuy ? "rgba(0,212,168,0.2)" : "rgba(255,77,109,0.2)"}` }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <p style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Order Placed!</p>
            <p style={{ color: "#8892a4", marginBottom: "24px" }}>{type} {qty} {coin.symbol} for {fmt(total)}</p>
            <button style={S.btn("primary")} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={coin.image} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                <div>
                  <p style={{ fontWeight: "800", fontSize: "16px" }}>{coin.name}</p>
                  <p style={{ color: "#556070", fontSize: "12px" }}>{fmt(coin.current_price)}</p>
                </div>
              </div>
              <span style={{ padding: "6px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", background: isBuy ? "rgba(0,212,168,0.12)" : "rgba(255,77,109,0.12)", color: isBuy ? "#00d4a8" : "#ff4d6d" }}>{type}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={S.label}>Quantity ({coin.symbol})</label>
                <input style={S.input} type="number" value={qty} onChange={e => setQty(e.target.value)} min="0" step="0.01" />
              </div>
              <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#8892a4" }}>Price per {coin.symbol}</span>
                  <span style={{ fontWeight: "600" }}>{fmt(coin.current_price)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8892a4" }}>Total</span>
                  <span style={{ fontWeight: "800", fontSize: "16px", color: isBuy ? "#00d4a8" : "#ff4d6d" }}>{fmt(total)}</span>
                </div>
              </div>
              {err && <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,77,109,0.1)", color: "#ff4d6d", fontSize: "13px" }}>{err}</div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={{ ...S.btn("secondary"), flex: 1 }} onClick={onClose}>Cancel</button>
                <button style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px", background: isBuy ? "linear-gradient(135deg,#00d4a8,#0ea5e9)" : "linear-gradient(135deg,#ff4d6d,#ff8552)", color: "#fff" }} onClick={submit} disabled={loading}>
                  {loading ? "Processing..." : `${type} ${coin.symbol}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ user, onLogout }) {
  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "24px" }}>Profile</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
        <div style={S.card}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#00d4a8,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px", fontWeight: "800", color: "#080c14" }}>
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <p style={{ fontWeight: "800", fontSize: "18px", marginBottom: "4px" }}>{user.fullName}</p>
            <p style={{ color: "#556070", fontSize: "13px", marginBottom: "20px" }}>{user.email}</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
              <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(0,212,168,0.1)", color: "#00d4a8", fontSize: "12px", fontWeight: "600" }}>✓ Verified</span>
              <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", fontSize: "12px", fontWeight: "600" }}>Standard</span>
            </div>
            <button style={{ ...S.btn("danger"), width: "100%" }} onClick={onLogout}>Sign Out</button>
          </div>
        </div>
        <div style={S.card}>
          <p style={S.sectionTitle}>Account Settings</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { label: "Full Name", value: user.fullName, editable: true },
              { label: "Email Address", value: user.email, editable: false },
              { label: "Mobile", value: "+91 98765 43210", editable: true },
            ].map((f, i) => (
              <div key={i}>
                <label style={S.label}>{f.label}</label>
                <input style={{ ...S.input, background: f.editable ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", color: f.editable ? "#e8edf5" : "#556070" }} defaultValue={f.value} readOnly={!f.editable} />
              </div>
            ))}
            <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <p style={{ fontWeight: "600", marginBottom: "4px", color: "#a855f7" }}>🔐 Two-Factor Authentication</p>
              <p style={{ color: "#8892a4", fontSize: "12px" }}>Enable 2FA for extra security. OTP sent to your email.</p>
            </div>
            <button style={S.btn("primary")}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "market", label: "Market", icon: "◈" },
  { id: "portfolio", label: "Portfolio", icon: "◉" },
  { id: "orders", label: "Orders", icon: "≡" },
  { id: "wallet", label: "Wallet", icon: "◎" },
  { id: "profile", label: "Profile", icon: "○" },
];

export default function App() {
  const [auth, setAuth] = useState(null); // { token, user }
  const [page, setPage] = useState("dashboard");
  const [trade, setTrade] = useState(null); // { coin, type }

  const handleLogin = (token, user) => setAuth({ token, user });
  const handleLogout = () => setAuth(null);
  const handleTrade = (coin, type) => setTrade({ coin, type });
  const handleCloseModal = () => setTrade(null);

  if (!auth) return <AuthPage onLogin={handleLogin} />;

  return (
    <div style={S.app}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.logo}><span>◈</span> CryptoTrade</div>
        <div style={S.nav}>
          {["dashboard", "market", "portfolio", "orders"].map(p => (
            <button key={p} style={S.navBtn(page === p)} onClick={() => setPage(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div style={S.userArea}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: "600" }}>{auth.user.fullName}</p>
            <p style={{ fontSize: "11px", color: "#556070" }}>Active</p>
          </div>
          <div style={S.avatar} onClick={() => setPage("profile")}>
            {auth.user.fullName?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={S.layout}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} style={S.sideItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(0,212,168,0.06)", border: "1px solid rgba(0,212,168,0.1)" }}>
            <p style={{ color: "#00d4a8", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>● Backend Status</p>
            <p style={{ color: "#556070", fontSize: "11px" }}>Connect at localhost:8081</p>
          </div>
        </div>

        {/* Main Content */}
        <div style={S.main}>
          {page === "dashboard" && <Dashboard user={auth.user} token={auth.token} />}
          {page === "market" && <MarketPage token={auth.token} onTrade={handleTrade} />}
          {page === "portfolio" && <PortfolioPage />}
          {page === "orders" && <OrdersPage />}
          {page === "wallet" && <WalletPage token={auth.token} />}
          {page === "profile" && <ProfilePage user={auth.user} onLogout={handleLogout} />}
        </div>
      </div>

      {/* Trade Modal */}
      {trade && <TradeModal coin={trade.coin} type={trade.type} token={auth.token} onClose={handleCloseModal} />}
    </div>
  );
}
