import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8090";

const MOCK_COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", currentPrice: 67842.5, priceChangePercentage24h: 2.34, marketCap: 1328000000000, totalVolume: 28400000000 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", currentPrice: 3521.8, priceChangePercentage24h: -1.12, marketCap: 422000000000, totalVolume: 14200000000 },
  { id: "binancecoin", symbol: "BNB", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", currentPrice: 412.3, priceChangePercentage24h: 0.87, marketCap: 60000000000, totalVolume: 1800000000 },
  { id: "solana", symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", currentPrice: 178.4, priceChangePercentage24h: 5.21, marketCap: 79000000000, totalVolume: 4100000000 },
  { id: "ripple", symbol: "XRP", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", currentPrice: 0.624, priceChangePercentage24h: -0.45, marketCap: 35000000000, totalVolume: 1500000000 },
  { id: "cardano", symbol: "ADA", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/small/cardano.png", currentPrice: 0.458, priceChangePercentage24h: 1.67, marketCap: 16000000000, totalVolume: 620000000 },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", currentPrice: 0.162, priceChangePercentage24h: 3.14, marketCap: 23000000000, totalVolume: 980000000 },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png", currentPrice: 7.82, priceChangePercentage24h: -2.3, marketCap: 10000000000, totalVolume: 390000000 },
  { id: "avalanche", symbol: "AVAX", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", currentPrice: 38.5, priceChangePercentage24h: 4.1, marketCap: 15700000000, totalVolume: 780000000 },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", currentPrice: 14.72, priceChangePercentage24h: -0.9, marketCap: 8600000000, totalVolume: 420000000 },
];

// ─── API HELPER ───────────────────────────────────────────────────────────────
const api = {
  post: async (path, body, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || JSON.stringify(data));
    return data;
  },
  get: async (path, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || JSON.stringify(data));
    return data;
  },
  put: async (path, body, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || JSON.stringify(data));
    return data;
  },
};

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ positive, width = 80, height = 32 }) {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const base = 50 + (positive ? i * 1.5 : -i * 1.2);
    return base + (Math.random() - 0.5) * 15;
  });
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map(p => ((p - min) / (max - min || 1)) * (height - 4) + 2);
  const polyPoints = norm.map((y, i) => `${(i / (pts.length - 1)) * width},${height - y}`).join(" ");
  const fillPoints = polyPoints + ` ${width},${height} 0,${height}`;
  const color = positive ? "#00d4a8" : "#ff4d6d";
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg${positive ? "p" : "n"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sg${positive ? "p" : "n"})`} />
      <polyline points={polyPoints} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
const fmtPrice = (n) => {
  if (n === null || n === undefined) return "—";
  const num = parseFloat(n);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num < 1) return `$${num.toFixed(4)}`;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPct = (n) => {
  if (n === null || n === undefined) return "—";
  const num = parseFloat(n);
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const c = {
  bg: "#07090f",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text: "#e2e8f2",
  muted: "#64748b",
  accent: "#00d4a8",
  accent2: "#0ea5e9",
  danger: "#f43f5e",
  warning: "#f59e0b",
};

const S = {
  app: { minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "'Sora', 'Segoe UI', sans-serif", fontSize: "14px" },
  // Topbar
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", height: "60px",
    background: "rgba(7,9,15,0.92)", borderBottom: `1px solid ${c.border}`,
    backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100,
  },
  logo: {
    fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px",
    background: `linear-gradient(135deg, ${c.accent}, ${c.accent2})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
  },
  navBtn: (active) => ({
    padding: "5px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: active ? "600" : "400",
    background: active ? "rgba(0,212,168,0.1)" : "transparent",
    color: active ? c.accent : c.muted, transition: "all 0.15s",
  }),
  avatar: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: `linear-gradient(135deg, ${c.accent}, ${c.accent2})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: "800", color: "#07090f", cursor: "pointer",
  },
  // Layout
  layout: { display: "flex", minHeight: "calc(100vh - 60px)" },
  sidebar: {
    width: "200px", minWidth: "200px",
    background: "rgba(7,9,15,0.5)", borderRight: `1px solid ${c.border}`,
    padding: "16px 10px", display: "flex", flexDirection: "column", gap: "2px",
  },
  sideItem: (active) => ({
    display: "flex", alignItems: "center", gap: "9px",
    padding: "9px 12px", borderRadius: "9px", cursor: "pointer",
    border: "none", width: "100%", textAlign: "left",
    background: active ? "rgba(0,212,168,0.1)" : "transparent",
    color: active ? c.accent : c.muted,
    fontSize: "13px", fontWeight: active ? "600" : "400",
    transition: "all 0.15s",
    borderLeft: active ? `2px solid ${c.accent}` : "2px solid transparent",
  }),
  main: { flex: 1, padding: "24px 28px", overflowY: "auto" },
  // Cards
  card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "20px" },
  statCard: (rgb) => ({
    background: `linear-gradient(135deg, rgba(${rgb},0.08), rgba(${rgb},0.02))`,
    border: `1px solid rgba(${rgb},0.15)`, borderRadius: "14px", padding: "18px",
  }),
  // Table
  th: { padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: c.muted, borderBottom: `1px solid ${c.border}`, textTransform: "uppercase" },
  td: { padding: "13px 14px", borderBottom: `1px solid rgba(255,255,255,0.03)`, verticalAlign: "middle" },
  // Buttons
  btn: { padding: "11px 22px", borderRadius: "9px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", background: `linear-gradient(135deg, ${c.accent}, ${c.accent2})`, color: "#07090f", transition: "opacity 0.15s" },
  btnSm: (variant = "default") => ({
    padding: "5px 13px", borderRadius: "7px", border: "none", cursor: "pointer",
    fontWeight: "600", fontSize: "12px", transition: "all 0.15s",
    background: variant === "buy" ? "rgba(0,212,168,0.12)" : variant === "sell" ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.06)",
    color: variant === "buy" ? c.accent : variant === "sell" ? c.danger : c.text,
  }),
  btnGhost: { padding: "11px 22px", borderRadius: "9px", border: `1px solid ${c.border}`, cursor: "pointer", fontWeight: "600", fontSize: "14px", background: "transparent", color: c.text },
  // Input
  input: {
    width: "100%", padding: "11px 13px", borderRadius: "9px",
    background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
    color: c.text, fontSize: "14px", outline: "none", boxSizing: "border-box",
    transition: "border 0.15s",
  },
  label: { display: "block", marginBottom: "5px", fontSize: "12px", color: c.muted, fontWeight: "500" },
  badge: (positive) => ({
    padding: "2px 8px", borderRadius: "5px", fontSize: "12px", fontWeight: "600",
    background: positive ? "rgba(0,212,168,0.1)" : "rgba(244,63,94,0.1)",
    color: positive ? c.accent : c.danger,
  }),
  pageTitle: { fontSize: "20px", fontWeight: "800", letterSpacing: "-0.4px", marginBottom: "20px" },
};

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: type === "success" ? "rgba(0,212,168,0.15)" : "rgba(244,63,94,0.15)", border: `1px solid ${type === "success" ? c.accent : c.danger}`, color: type === "success" ? c.accent : c.danger, fontWeight: "600", fontSize: "13px", backdropFilter: "blur(12px)" }}>
      {type === "success" ? "✅ " : "❌ "}{msg}
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", mobile: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.email || !form.password) { setErr("Email and password are required"); return; }
    setLoading(true); setErr("");
    try {
      let data;
      if (tab === "login") {
        data = await api.post("/auth/login", { email: form.email, password: form.password });
      } else {
        if (!form.fullName) { setErr("Full name is required"); setLoading(false); return; }
        data = await api.post("/auth/signup", { email: form.email, password: form.password, fullName: form.fullName, mobile: form.mobile });
      }
      onLogin(data.jwt, { email: form.email, fullName: form.fullName || form.email.split("@")[0] });
    } catch (e) {
      setErr(e.message || "Something went wrong. Check if backend is running on port 8090.");
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: `radial-gradient(circle, rgba(0,212,168,0.05) 0%, transparent 70%)`, top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <div style={{ width: "400px", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ ...S.logo, justifyContent: "center", fontSize: "26px", marginBottom: "8px" }}>◈ CryptoTrade</div>
          <p style={{ color: c.muted, fontSize: "13px" }}>Professional crypto trading platform</p>
        </div>
        <div style={{ ...S.card, border: `1px solid rgba(0,212,168,0.12)` }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "9px", padding: "3px", marginBottom: "24px" }}>
            {[["login", "Sign In"], ["signup", "Sign Up"]].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }} style={{ flex: 1, padding: "7px", borderRadius: "7px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", background: tab === t ? "rgba(0,212,168,0.15)" : "transparent", color: tab === t ? c.accent : c.muted, transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {tab === "signup" && (
              <>
                <div>
                  <label style={S.label}>Full Name</label>
                  <input style={S.input} placeholder="Your full name" value={form.fullName} onChange={set("fullName")} onKeyDown={onKey} />
                </div>
                <div>
                  <label style={S.label}>Mobile</label>
                  <input style={S.input} placeholder="+91 98765 43210" value={form.mobile} onChange={set("mobile")} onKeyDown={onKey} />
                </div>
              </>
            )}
            <div>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onKeyDown={onKey} />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={onKey} />
            </div>
            {err && <div style={{ padding: "10px 13px", borderRadius: "8px", background: "rgba(244,63,94,0.08)", color: c.danger, fontSize: "12px", border: `1px solid rgba(244,63,94,0.2)` }}>{err}</div>}
            <button style={{ ...S.btn, marginTop: "4px", opacity: loading ? 0.7 : 1 }} onClick={submit} disabled={loading}>
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
        <p style={{ textAlign: "center", color: "#2a3444", marginTop: "16px", fontSize: "11px" }}>Backend must be running on localhost:8090</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, token, onTrade, onNav }) {
  const [coins, setCoins] = useState([]);
  const [assets, setAssets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false"
    );
    const coinsData = await res.json();
    const normalized = coinsData.map(c => ({
    ...c,
    currentPrice: c.current_price,
    priceChangePercentage24h: c.price_change_percentage_24h,
    marketCap: c.market_cap,
    totalVolume: c.total_volume,
    }));
    setCoins(normalized);
  }
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const coinsData = await api.get("/coins?page=1", token).catch(() => MOCK_COINS);
        setCoins((coinsData || MOCK_COINS).slice(0, 6));

        let userId = user?.id || user?.userId;
        if (!userId) {
          const profile = await api.get("/api/users/profile", token).catch(() => null);
          userId = profile?.id;
        }

        if (userId) {
          const [assetsData, ordersData, walletData] = await Promise.all([
            api.get(`/api/asset/user/${userId}`, token),
            api.get(`/api/orders/user/${userId}`, token),
            api.get("/api/wallet/api/wallet", token),
          ]);
          setAssets(assetsData || []);
          setOrders(ordersData || []);
          setWallet(walletData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  const totalValue = assets.reduce((s, a) => s + (a.quantity * (a.coin?.currentPrice || 0)), 0);
  const walletBal = parseFloat(wallet?.balance || 0);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "4px" }}>
          Welcome back, <span style={{ background: `linear-gradient(135deg,${c.accent},${c.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{user.fullName}</span> 👋
        </h1>
        <p style={{ color: c.muted, fontSize: "13px" }}>Your trading overview</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "Portfolio Value", value: fmtPrice(totalValue), rgb: "0,212,168" },
          { label: "Wallet Balance", value: fmtPrice(walletBal), rgb: "14,165,233" },
          { label: "Total Assets", value: assets.length, rgb: "168,85,247" },
          { label: "Total Orders", value: orders.length, rgb: "245,158,11" },
        ].map((s, i) => (
          <div key={i} style={S.statCard(s.rgb)}>
            <p style={{ color: c.muted, fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: "800", color: `rgb(${s.rgb})` }}>{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "18px" }}>
        {/* Live Coins */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontWeight: "700", fontSize: "15px" }}>Live Market</p>
            <button onClick={() => onNav("market")} style={{ ...S.btnSm(), fontSize: "11px" }}>View All →</button>
          </div>
          {loading ? <p style={{ color: c.muted }}>Loading...</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {coins.map((coin, i) => {
                  const pos = parseFloat(coin.priceChangePercentage24h) >= 0;
                  return (
                    <tr key={coin.id}>
                      <td style={{ ...S.td, paddingLeft: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={coin.image} alt="" style={{ width: "26px", height: "26px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                          <div>
                            <p style={{ fontWeight: "700", fontSize: "13px" }}>{coin.symbol?.toUpperCase()}</p>
                            <p style={{ color: c.muted, fontSize: "11px" }}>{coin.name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontWeight: "700" }}>{fmtPrice(coin.currentPrice)}</td>
                      <td style={S.td}><span style={S.badge(pos)}>{fmtPct(coin.priceChangePercentage24h)}</span></td>
                      <td style={{ ...S.td, paddingRight: 0 }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button style={S.btnSm("buy")} onClick={() => onTrade(coin, "BUY")}>Buy</button>
                          <button style={S.btnSm("sell")} onClick={() => onTrade(coin, "SELL")}>Sell</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Orders */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontWeight: "700", fontSize: "15px" }}>Recent Orders</p>
            <button onClick={() => onNav("orders")} style={{ ...S.btnSm(), fontSize: "11px" }}>View All →</button>
          </div>
          {loading ? <p style={{ color: c.muted }}>Loading...</p> : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: c.muted }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>📋</p>
              <p>No orders yet</p>
              <button style={{ ...S.btn, marginTop: "12px", padding: "8px 18px", fontSize: "12px" }} onClick={() => onNav("market")}>Start Trading</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderRadius: "9px", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", background: o.orderType === "BUY" ? "rgba(0,212,168,0.1)" : "rgba(244,63,94,0.1)", color: o.orderType === "BUY" ? c.accent : c.danger }}>
                      {o.orderType === "BUY" ? "B" : "S"}
                    </div>
                    <div>
                      <p style={{ fontWeight: "600", fontSize: "12px" }}>{o.orderItem?.coin?.symbol?.toUpperCase() || "—"}</p>
                      <p style={{ color: c.muted, fontSize: "11px" }}>{o.orderType}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: "700", fontSize: "12px" }}>{fmtPrice(o.price)}</p>
                    <p style={{ color: c.muted, fontSize: "10px" }}>{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MARKET PAGE ──────────────────────────────────────────────────────────────
function MarketPage({ token, onTrade }) {
  const [coins, setCoins] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async (p = 1) => {
  setLoading(true);
  try {
    // Try direct CoinGecko first
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=${p}&sparkline=false`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const normalized = data.map(c => ({
        ...c,
        currentPrice: c.current_price,
        priceChangePercentage24h: c.price_change_percentage_24h,
        marketCap: c.market_cap,
        totalVolume: c.total_volume,
      }));
      setCoins(normalized);
    } else {
      setCoins(MOCK_COINS);
    }
  } catch (e) {
    setCoins(MOCK_COINS);
  } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page]);

  const filtered = coins.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={S.pageTitle}>Live Market</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input style={{ ...S.input, width: "220px" }} placeholder="🔍 Search coins..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div style={S.card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["#", "Coin", "Price", "24h Change", "Market Cap", "Volume", "7D", "Trade"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ ...S.td, textAlign: "center", color: c.muted, padding: "40px" }}>Loading live data...</td></tr>
            ) : filtered.map((coin, i) => {
              const pos = parseFloat(coin.priceChangePercentage24h) >= 0;
              return (
                <tr key={coin.id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...S.td, color: c.muted, fontWeight: "600", width: "36px" }}>{(page - 1) * 10 + i + 1}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={coin.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                      <div>
                        <p style={{ fontWeight: "700" }}>{coin.name}</p>
                        <p style={{ color: c.muted, fontSize: "11px", textTransform: "uppercase" }}>{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...S.td, fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>{fmtPrice(coin.currentPrice)}</td>
                  <td style={S.td}><span style={S.badge(pos)}>{fmtPct(coin.priceChangePercentage24h)}</span></td>
                  <td style={{ ...S.td, color: c.muted, fontSize: "12px" }}>{fmtPrice(coin.marketCap)}</td>
                  <td style={{ ...S.td, color: c.muted, fontSize: "12px" }}>{fmtPrice(coin.totalVolume)}</td>
                  <td style={S.td}><Sparkline positive={pos} /></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button style={S.btnSm("buy")} onClick={() => onTrade(coin, "BUY")}>Buy</button>
                      <button style={S.btnSm("sell")} onClick={() => onTrade(coin, "SELL")}>Sell</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          <button style={{ ...S.btnGhost, padding: "6px 14px", fontSize: "12px", opacity: page === 1 ? 0.4 : 1 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ display: "flex", alignItems: "center", color: c.muted, fontSize: "13px" }}>Page {page}</span>
          <button style={{ ...S.btnGhost, padding: "6px 14px", fontSize: "12px" }} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────
function PortfolioPage({ token, user }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profile = await api.get("/api/users/profile", token);
        const data = await api.get(`/api/asset/user/${profile.id}`, token);
        setAssets(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const totalValue = assets.reduce((s, a) => s + (a.quantity * parseFloat(a.coin?.currentPrice || 0)), 0);
  const totalCost = assets.reduce((s, a) => s + (a.quantity * parseFloat(a.buyPrice || 0)), 0);
  const totalPnl = totalValue - totalCost;

  return (
    <div>
      <h1 style={S.pageTitle}>Portfolio</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "Total Value", value: fmtPrice(totalValue), rgb: "0,212,168" },
          { label: "Total Cost", value: fmtPrice(totalCost), rgb: "14,165,233" },
          { label: "Unrealized P&L", value: `${totalPnl >= 0 ? "+" : ""}${fmtPrice(Math.abs(totalPnl))}`, rgb: totalPnl >= 0 ? "0,212,168" : "244,63,94" },
          { label: "Holdings", value: assets.length, rgb: "168,85,247" },
        ].map((s, i) => (
          <div key={i} style={S.statCard(s.rgb)}>
            <p style={{ color: c.muted, fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{s.label}</p>
            <p style={{ fontSize: "20px", fontWeight: "800", color: `rgb(${s.rgb})` }}>{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "16px" }}>Your Holdings</p>
        {loading ? <p style={{ color: c.muted }}>Loading...</p> : assets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: c.muted }}>
            <p style={{ fontSize: "40px", marginBottom: "10px" }}>📦</p>
            <p>No holdings yet. Go buy some coins!</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Asset", "Quantity", "Buy Price", "Current Price", "Value", "P&L"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {assets.map((a, i) => {
                const val = a.quantity * parseFloat(a.coin?.currentPrice || 0);
                const cost = a.quantity * parseFloat(a.buyPrice || 0);
                const pnl = val - cost;
                const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                return (
                  <tr key={a.id}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <img src={a.coin?.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                        <div>
                          <p style={{ fontWeight: "700" }}>{a.coin?.name}</p>
                          <p style={{ color: c.muted, fontSize: "11px" }}>{a.coin?.symbol?.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontWeight: "600" }}>{parseFloat(a.quantity).toFixed(4)}</td>
                    <td style={S.td}>{fmtPrice(a.buyPrice)}</td>
                    <td style={{ ...S.td, fontWeight: "700" }}>{fmtPrice(a.coin?.currentPrice)}</td>
                    <td style={{ ...S.td, fontWeight: "700" }}>{fmtPrice(val)}</td>
                    <td style={S.td}>
                      <span style={S.badge(pnl >= 0)}>{pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                      <p style={{ color: pnl >= 0 ? c.accent : c.danger, fontSize: "11px", marginTop: "2px" }}>{pnl >= 0 ? "+" : ""}{fmtPrice(Math.abs(pnl))}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
function OrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profile = await api.get("/api/users/profile", token);
        const data = await api.get(`/api/orders/user/${profile.id}`, token);
        setOrders(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.orderType === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={S.pageTitle}>Order History</h1>
        <div style={{ display: "flex", gap: "6px" }}>
          {["ALL", "BUY", "SELL"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...S.btnSm(f.toLowerCase()), background: filter === f ? (f === "BUY" ? "rgba(0,212,168,0.15)" : f === "SELL" ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)", color: filter === f ? (f === "BUY" ? c.accent : f === "SELL" ? c.danger : c.text) : c.muted, padding: "6px 16px" }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        {loading ? <p style={{ color: c.muted, padding: "20px 0" }}>Loading orders...</p> : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: c.muted }}>
            <p style={{ fontSize: "40px", marginBottom: "10px" }}>📋</p>
            <p>No {filter !== "ALL" ? filter.toLowerCase() : ""} orders found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["ID", "Type", "Coin", "Quantity", "Price", "Status", "Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td style={{ ...S.td, color: c.muted, fontFamily: "monospace", fontSize: "12px" }}>#{o.id}</td>
                  <td style={S.td}>
                    <span style={{ padding: "3px 9px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: o.orderType === "BUY" ? "rgba(0,212,168,0.1)" : "rgba(244,63,94,0.1)", color: o.orderType === "BUY" ? c.accent : c.danger }}>
                      {o.orderType}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: "600" }}>{o.orderItem?.coin?.name || "—"} <span style={{ color: c.muted, fontWeight: "400" }}>({o.orderItem?.coin?.symbol?.toUpperCase()})</span></td>
                  <td style={S.td}>{parseFloat(o.orderItem?.quantity || 0).toFixed(4)}</td>
                  <td style={{ ...S.td, fontWeight: "700" }}>{fmtPrice(o.price)}</td>
                  <td style={S.td}>
                    <span style={{ padding: "3px 9px", borderRadius: "5px", fontSize: "11px", fontWeight: "600", background: o.status === "SUCCESS" ? "rgba(0,212,168,0.08)" : "rgba(245,158,11,0.08)", color: o.status === "SUCCESS" ? c.accent : c.warning }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: c.muted, fontSize: "12px" }}>{o.timeStamp ? new Date(o.timeStamp).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── WALLET PAGE ──────────────────────────────────────────────────────────────
function WalletPage({ token }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get("/api/wallet/api/wallet", token);
        setWallet(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const deposit = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setToast({ msg: "Enter a valid amount", type: "error" }); return;
    }
    setToast({ msg: `Deposit of ${fmtPrice(parseFloat(amount))} initiated! (Connect Razorpay/Stripe for real payments)`, type: "success" });
    setAmount("");
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h1 style={S.pageTitle}>Wallet</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "18px" }}>
        <div>
          <div style={{ ...S.card, background: "linear-gradient(135deg,rgba(0,212,168,0.08),rgba(14,165,233,0.04))", border: "1px solid rgba(0,212,168,0.15)", marginBottom: "14px" }}>
            <p style={{ color: c.muted, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Available Balance</p>
            {loading ? <p style={{ color: c.muted }}>Loading...</p> : (
              <>
                <p style={{ fontSize: "34px", fontWeight: "800", letterSpacing: "-1px", background: `linear-gradient(135deg,${c.accent},${c.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {fmtPrice(wallet?.balance || 0)}
                </p>
                <p style={{ color: c.muted, fontSize: "12px", marginTop: "4px" }}>Wallet ID: #{wallet?.id || "—"}</p>
              </>
            )}
          </div>
          <div style={{ ...S.card }}>
            <p style={{ fontWeight: "600", fontSize: "13px", marginBottom: "12px" }}>Payment Methods</p>
            {[["Razorpay", "Instant UPI & Cards"], ["Stripe", "International Cards"]].map(([name, sub]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderRadius: "9px", background: "rgba(0,212,168,0.04)", border: "1px solid rgba(0,212,168,0.1)", marginBottom: "8px", cursor: "pointer" }}>
                <div>
                  <p style={{ fontWeight: "600", fontSize: "13px", color: c.accent }}>{name}</p>
                  <p style={{ color: c.muted, fontSize: "11px" }}>{sub}</p>
                </div>
                <span style={{ color: c.muted, fontSize: "18px" }}>→</span>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "18px" }}>Add Funds</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={S.label}>Amount (USD)</label>
              <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Quick Select</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[100, 500, 1000, 5000].map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{ flex: 1, padding: "7px", borderRadius: "8px", border: `1px solid ${c.border}`, background: parseFloat(amount) === a ? "rgba(0,212,168,0.1)" : "rgba(255,255,255,0.03)", color: parseFloat(amount) === a ? c.accent : c.muted, cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>${a}</button>
                ))}
              </div>
            </div>
            <button style={S.btn} onClick={deposit}>Deposit Funds</button>
            <p style={{ color: c.muted, fontSize: "11px", textAlign: "center" }}>Payment gateway integration (Razorpay/Stripe) required for live deposits</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ user, token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get("/api/users/profile", token);
        setProfile(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h1 style={S.pageTitle}>Profile</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "18px" }}>
        <div style={S.card}>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: `linear-gradient(135deg,${c.accent},${c.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: "26px", fontWeight: "800", color: "#07090f" }}>
              {(profile?.fullName || user.fullName)?.[0]?.toUpperCase()}
            </div>
            <p style={{ fontWeight: "800", fontSize: "17px", marginBottom: "4px" }}>{loading ? "..." : profile?.fullName || user.fullName}</p>
            <p style={{ color: c.muted, fontSize: "13px", marginBottom: "6px" }}>{loading ? "..." : profile?.email || user.email}</p>
            <p style={{ color: c.muted, fontSize: "12px", marginBottom: "18px" }}>ID: #{profile?.id || "—"}</p>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "18px" }}>
              <span style={{ padding: "3px 10px", borderRadius: "20px", background: "rgba(0,212,168,0.1)", color: c.accent, fontSize: "11px", fontWeight: "600" }}>✓ Active</span>
              <span style={{ padding: "3px 10px", borderRadius: "20px", background: "rgba(14,165,233,0.1)", color: c.accent2, fontSize: "11px", fontWeight: "600" }}>{profile?.role || "CUSTOMER"}</span>
            </div>
            <button onClick={onLogout} style={{ width: "100%", padding: "10px", borderRadius: "9px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", background: "rgba(244,63,94,0.1)", color: c.danger, transition: "all 0.15s" }}>
              Sign Out
            </button>
          </div>
        </div>
        <div style={S.card}>
          <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "18px" }}>Account Info</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Full Name", value: profile?.fullName || "—" },
              { label: "Email Address", value: profile?.email || "—" },
              { label: "Mobile", value: profile?.mobile || "—" },
              { label: "Role", value: profile?.role || "ROLE_CUSTOMER" },
            ].map((f, i) => (
              <div key={i}>
                <label style={S.label}>{f.label}</label>
                <div style={{ ...S.input, color: c.muted, display: "flex", alignItems: "center" }}>{loading ? "Loading..." : f.value}</div>
              </div>
            ))}
            <div style={{ padding: "13px", borderRadius: "9px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
              <p style={{ fontWeight: "600", marginBottom: "3px", color: "#a855f7", fontSize: "13px" }}>🔐 Two-Factor Authentication</p>
              <p style={{ color: c.muted, fontSize: "12px" }}>Status: {profile?.twoFactorAuth?.enabled ? "Enabled ✅" : "Disabled"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRADE MODAL ──────────────────────────────────────────────────────────────
function TradeModal({ coin, type, token, onClose, onSuccess }) {
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const total = (parseFloat(qty) || 0) * parseFloat(coin?.currentPrice || 0);
  const isBuy = type === "BUY";

  const submit = async () => {
    if (!qty || parseFloat(qty) <= 0) { setErr("Enter a valid quantity"); return; }
    setLoading(true); setErr("");
    try {
      await api.post("/api/orders/pay", { coinId: coin.id, quantity: parseFloat(qty), orderType: type }, token);
      setDone(true);
      onSuccess?.();
    } catch (e) {
      setErr(e.message || "Order failed. Check wallet balance.");
    } finally { setLoading(false); }
  };

  if (!coin) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(8px)" }}>
      <div style={{ ...S.card, width: "400px", border: `1px solid ${isBuy ? "rgba(0,212,168,0.2)" : "rgba(244,63,94,0.2)"}` }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }}>✅</div>
            <p style={{ fontSize: "18px", fontWeight: "800", marginBottom: "6px" }}>Order Placed!</p>
            <p style={{ color: c.muted, marginBottom: "22px" }}>{type} {qty} {coin.symbol?.toUpperCase()} for {fmtPrice(total)}</p>
            <button style={S.btn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={coin.image} alt="" style={{ width: "34px", height: "34px", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                <div>
                  <p style={{ fontWeight: "800", fontSize: "15px" }}>{coin.name}</p>
                  <p style={{ color: c.muted, fontSize: "12px" }}>{fmtPrice(coin.currentPrice)}</p>
                </div>
              </div>
              <span style={{ padding: "5px 13px", borderRadius: "7px", fontWeight: "700", fontSize: "12px", background: isBuy ? "rgba(0,212,168,0.1)" : "rgba(244,63,94,0.1)", color: isBuy ? c.accent : c.danger }}>{type}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={S.label}>Quantity ({coin.symbol?.toUpperCase()})</label>
                <input style={S.input} type="number" value={qty} onChange={e => setQty(e.target.value)} min="0.0001" step="0.0001" />
              </div>
              <div style={{ padding: "14px", borderRadius: "9px", background: "rgba(255,255,255,0.02)", border: `1px solid ${c.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: c.muted, fontSize: "13px" }}>Price per {coin.symbol?.toUpperCase()}</span>
                  <span style={{ fontWeight: "600" }}>{fmtPrice(coin.currentPrice)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: c.muted, fontSize: "13px" }}>Total</span>
                  <span style={{ fontWeight: "800", fontSize: "16px", color: isBuy ? c.accent : c.danger }}>{fmtPrice(total)}</span>
                </div>
              </div>
              {err && <div style={{ padding: "10px 13px", borderRadius: "8px", background: "rgba(244,63,94,0.08)", color: c.danger, fontSize: "12px", border: `1px solid rgba(244,63,94,0.15)` }}>{err}</div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={{ ...S.btnGhost, flex: 1 }} onClick={onClose}>Cancel</button>
                <button onClick={submit} disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: "9px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px", opacity: loading ? 0.7 : 1, background: isBuy ? `linear-gradient(135deg,${c.accent},${c.accent2})` : `linear-gradient(135deg,${c.danger},#ff8552)`, color: isBuy ? "#07090f" : "#fff" }}>
                  {loading ? "Processing..." : `${type} ${coin.symbol?.toUpperCase()}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "market", label: "Market", icon: "◈" },
  { id: "portfolio", label: "Portfolio", icon: "◉" },
  { id: "orders", label: "Orders", icon: "≡" },
  { id: "wallet", label: "Wallet", icon: "◎" },
  { id: "profile", label: "Profile", icon: "○" },
];

export default function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("ct_auth");
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState("dashboard");
  const [trade, setTrade] = useState(null);
  const [toast, setToast] = useState(null);

  const handleLogin = (token, user) => {
    const data = { token, user };
    setAuth(data);
    localStorage.setItem("ct_auth", JSON.stringify(data));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("ct_auth");
    setPage("dashboard");
  };

  const handleTrade = (coin, type) => setTrade({ coin, type });

  const handleTradeSuccess = () => {
    setToast({ msg: `${trade?.type} order placed successfully!`, type: "success" });
  };

  if (!auth) return <AuthPage onLogin={handleLogin} />;

  return (
    <div style={S.app}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.logo} onClick={() => setPage("dashboard")}>◈ CryptoTrade</div>
        <div style={{ display: "flex", gap: "2px" }}>
          {["dashboard", "market", "portfolio", "orders"].map(p => (
            <button key={p} style={S.navBtn(page === p)} onClick={() => setPage(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: "600" }}>{auth.user.fullName}</p>
            <p style={{ fontSize: "11px", color: c.accent }}>● Live</p>
          </div>
          <div style={S.avatar} onClick={() => setPage("profile")}>
            {auth.user.fullName?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={S.layout}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          {NAV.map(item => (
            <button key={item.id} style={S.sideItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(0,212,168,0.05)", border: "1px solid rgba(0,212,168,0.1)" }}>
            <p style={{ color: c.accent, fontSize: "11px", fontWeight: "600", marginBottom: "2px" }}>● Backend Connected</p>
            <p style={{ color: c.muted, fontSize: "10px" }}>localhost:8090</p>
          </div>
        </div>

        {/* Main */}
        <div style={S.main}>
          {page === "dashboard" && <Dashboard user={auth.user} token={auth.token} onTrade={handleTrade} onNav={setPage} />}
          {page === "market" && <MarketPage token={auth.token} onTrade={handleTrade} />}
          {page === "portfolio" && <PortfolioPage token={auth.token} user={auth.user} />}
          {page === "orders" && <OrdersPage token={auth.token} />}
          {page === "wallet" && <WalletPage token={auth.token} />}
          {page === "profile" && <ProfilePage user={auth.user} token={auth.token} onLogout={handleLogout} />}
        </div>
      </div>

      {/* Trade Modal */}
      {trade && (
        <TradeModal
          coin={trade.coin}
          type={trade.type}
          token={auth.token}
          onClose={() => setTrade(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </div>
  );
}