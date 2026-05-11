import { useState, useEffect, createContext, useContext } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qswsdgkosyjeczmtwrde.supabase.co";
const SUPABASE_KEY = "sb_publishable_n_GIwNQ6DgL78vHG_uocmw_CrdIuLI6";

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  navy:       "#0d2b45",
  teal:       "#0a7c5c",
  tealLight:  "#e6f4ef",
  tealMid:    "#1a9e78",
  sand:       "#f5f0e8",
  amber:      "#c47f17",
  amberLight: "#fdf3e0",
  coral:      "#c0392b",
  coralLight: "#fdf0ee",
  white:      "#ffffff",
  gray:       "#6b7280",
  grayLight:  "#f3f4f6",
  border:     "#e5e7eb",
};

// ─── SUPABASE MINI CLIENT ─────────────────────────────────────────────────────
const sb = {
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  },
  async signUp(email, password, fullName, role = "client") {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password, data: { full_name: fullName, role } }),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { ...this.headers, Authorization: `Bearer ${token}` },
    });
  },
  async getProfile(userId, token) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
      { headers: { ...this.headers, Authorization: `Bearer ${token}` } }
    );
    const data = await r.json();
    return data[0] || null;
  },
  async getAllClients(token) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?role=eq.client&select=*&order=full_name.asc`,
      { headers: { ...this.headers, Authorization: `Bearer ${token}` } }
    );
    return r.json();
  },
  async updateLastSeen(userId, token) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...this.headers, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
    });
  },
  async getCompletions(userId, token) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/workout_completions?user_id=eq.${userId}&select=*&order=completed_at.desc`,
      { headers: { ...this.headers, Authorization: `Bearer ${token}` } }
    );
    return r.json();
  },
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("mbb_session");
    if (saved) {
      const s = JSON.parse(saved);
      setSession(s);
      sb.getProfile(s.userId, s.token).then(p => {
        setProfile(p);
        setLoading(false);
        if (p) sb.updateLastSeen(s.userId, s.token);
      }).catch(() => {
        localStorage.removeItem("mbb_session");
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    const data = await sb.signIn(email, password);
    if (data.error) throw new Error(data.error_description || data.error);
    const s = { token: data.access_token, userId: data.user.id };
    const p = await sb.getProfile(s.userId, s.token);
    localStorage.setItem("mbb_session", JSON.stringify(s));
    setSession(s);
    setProfile(p);
    sb.updateLastSeen(s.userId, s.token);
    return p;
  };

  const signOut = async () => {
    if (session) await sb.signOut(session.token);
    localStorage.removeItem("mbb_session");
    setSession(null);
    setProfile(null);
  };

  const signUp = async (email, password, fullName, role) => {
    const data = await sb.signUp(email, password, fullName, role);
    if (data.error) throw new Error(data.error_description || data.error);
    return data;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Spinner({ size = 24, color = C.teal }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: size, height: size, border: `3px solid ${color}22`, borderTop: `3px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, loading: ld, style = {} }) {
  const styles = {
    primary:   { background: C.teal,  color: "#fff", border: "none" },
    secondary: { background: "transparent", color: C.teal, border: `1.5px solid ${C.teal}` },
    danger:    { background: C.coral, color: "#fff", border: "none" },
    ghost:     { background: "transparent", color: C.gray, border: `1.5px solid ${C.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled || ld}
      style={{ ...styles[variant], padding: "10px 20px", borderRadius: 8, fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, cursor: disabled || ld ? "not-allowed" : "pointer", opacity: disabled || ld ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s", ...style }}>
      {ld && <Spinner size={16} color={variant === "primary" ? "#fff" : C.teal} />}
      {children}
    </button>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: "11px 14px", border: `1.5px solid ${error ? C.coral : C.border}`, borderRadius: 8, fontFamily: "sans-serif", fontSize: 14, color: C.navy, outline: "none", background: "#fff", transition: "border-color 0.15s" }}
        onFocus={e => e.target.style.borderColor = C.teal}
        onBlur={e => e.target.style.borderColor = error ? C.coral : C.border}
      />
      {error && <span style={{ fontFamily: "sans-serif", fontSize: 12, color: C.coral }}>{error}</span>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function Badge({ children, color = C.teal, bg }) {
  return (
    <span style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color, background: bg || `${color}18`, padding: "3px 10px", borderRadius: 999 }}>
      {children}
    </span>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage() {
  const { signIn } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try { await signIn(email, password); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const demoLogin = async (role) => {
    setError(""); setLoading(true);
    try {
      const creds = role === "coach"
        ? { email: "coach@mindbodyboat.com",  password: "MBBcoach2024!" }
        : { email: "client@mindbodyboat.com", password: "MBBclient2024!" };
      await signIn(creds.email, creds.password);
    } catch (e) {
      setError("Demo accounts not set up yet — create an account below.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⛵</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.white, letterSpacing: "-0.01em" }}>MindBodyBoat</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#7a9db8", marginTop: 4 }}>Sailor-specific coaching platform</div>
      </div>

      <Card style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <div style={{ display: "flex", borderBottom: `1.5px solid ${C.border}`, marginBottom: 28 }}>
          {["login", "signup"].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
              style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: `2.5px solid ${tab === t ? C.teal : "transparent"}`, fontFamily: "sans-serif", fontSize: 14, fontWeight: tab === t ? 700 : 400, color: tab === t ? C.teal : C.gray, cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", marginBottom: -1.5 }}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tab === "signup" && <Input label="Full Name" value={name} onChange={setName} placeholder="Simone Bertone" />}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

          {error && <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.coral, background: C.coralLight, padding: "10px 14px", borderRadius: 8 }}>{error}</div>}
          {success && <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.teal, background: C.tealLight, padding: "10px 14px", borderRadius: 8 }}>{success}</div>}

          <Btn onClick={handleLogin} loading={loading} style={{ justifyContent: "center", marginTop: 4 }}>
            {tab === "login" ? "Sign In" : "Create Account"}
          </Btn>
        </div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "sans-serif", fontSize: 11, color: C.gray, textAlign: "center", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick demo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Btn variant="ghost" onClick={() => demoLogin("coach")} style={{ justifyContent: "center", fontSize: 13 }}>🎯 Coach view</Btn>
            <Btn variant="ghost" onClick={() => demoLogin("client")} style={{ justifyContent: "center", fontSize: 13 }}>🏋️ Client view</Btn>
          </div>
        </div>
      </Card>

      <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#4a6a7a", marginTop: 24 }}>
        Powered by Anthropic Claude · Supabase · MindBodyBoat
      </div>
    </div>
  );
}

// ─── TOP NAV ──────────────────────────────────────────────────────────────────
function TopNav({ onRefresh, lastRefreshed }) {
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const fmt = (d) => {
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div style={{ background: C.navy, color: C.white, padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: C.white }}>⛵ MindBodyBoat</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 11, color: "#7a9db8" }}>Updated {fmt(lastRefreshed)}</span>
        <button onClick={onRefresh}
          style={{ background: `${C.tealMid}22`, border: `1px solid ${C.tealMid}44`, color: C.tealMid, padding: "5px 12px", borderRadius: 6, fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>
      <Badge color={profile?.role === "coach" ? C.amber : C.tealMid} bg={profile?.role === "coach" ? C.amberLight : C.tealLight}>
        {profile?.role === "coach" ? "Coach" : "Athlete"}
      </Badge>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>
          {(profile?.full_name || "?")[0].toUpperCase()}
        </div>
        <div style={{ fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{profile?.full_name || profile?.email}</div>
        </div>
        <button onClick={async () => { setSigningOut(true); await signOut(); }}
          style={{ background: "none", border: "1px solid #ffffff22", color: "#7a9db8", padding: "5px 12px", borderRadius: 6, fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>
          {signingOut ? "..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}

// ─── COMPLETION GRAPH ─────────────────────────────────────────────────────────
function CompletionGraph({ completions }) {
  const days = ["mon", "tue", "wed", "thu", "fri"];
  const dayLabels = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri" };
  const weeks = [1,2,3,4,5,6,7,8,9,10,11,12];
  const done = new Set(completions.map(c => `${c.week_number}__${c.day_id}`));
  const total = weeks.length * days.length;
  const completed = done.size;
  const pct = Math.round((completed / total) * 100);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, color: C.navy }}>Workout Completion</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.teal, fontWeight: 700 }}>{completed}/{total} sessions · {pct}%</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "40px repeat(12, 1fr)", gap: 4, marginBottom: 4 }}>
        <div />
        {weeks.map(w => <div key={w} style={{ fontFamily: "sans-serif", fontSize: 9, color: C.gray, textAlign: "center", fontWeight: 600 }}>W{w}</div>)}
      </div>
      {days.map(day => (
        <div key={day} style={{ display: "grid", gridTemplateColumns: "40px repeat(12, 1fr)", gap: 4, marginBottom: 4 }}>
          <div style={{ fontFamily: "sans-serif", fontSize: 10, color: C.gray, display: "flex", alignItems: "center", fontWeight: 600 }}>{dayLabels[day]}</div>
          {weeks.map(w => {
            const key = `${w}__${day}`;
            const isDone = done.has(key);
            return (
              <div key={w} title={`Week ${w} · ${dayLabels[day]} · ${isDone ? "✓ Done" : "Not yet"}`}
                style={{ aspectRatio: "1", borderRadius: 3, background: isDone ? C.teal : C.grayLight, border: `1px solid ${isDone ? C.tealMid : C.border}`, transition: "all 0.15s" }} />
            );
          })}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: C.teal }} />
        <span style={{ fontFamily: "sans-serif", fontSize: 11, color: C.gray }}>Completed</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: C.grayLight, border: `1px solid ${C.border}`, marginLeft: 8 }} />
        <span style={{ fontFamily: "sans-serif", fontSize: 11, color: C.gray }}>Upcoming</span>
      </div>
    </div>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
function ClientDashboard({ onRefresh }) {
  const { profile, session } = useAuth();
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (!session) return;
    sb.getCompletions(session.userId, session.token).then(data => {
      setCompletions(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [session]);

  const navItems = [
    { id: "overview", label: "Overview",   icon: "🏠" },
    { id: "program",  label: "My Program", icon: "📋" },
    { id: "chat",     label: "AI Coach",   icon: "💬" },
    { id: "progress", label: "Progress",   icon: "📈" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
      <div style={{ width: 220, background: C.white, borderRight: `1px solid ${C.border}`, padding: "20px 0", flexShrink: 0 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveSection(item.id)}
            style={{ width: "100%", padding: "11px 20px", background: activeSection === item.id ? C.tealLight : "none", border: "none", borderLeft: `3px solid ${activeSection === item.id ? C.teal : "transparent"}`, textAlign: "left", fontFamily: "sans-serif", fontSize: 14, fontWeight: activeSection === item.id ? 600 : 400, color: activeSection === item.id ? C.teal : C.gray, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 32, background: C.sand, overflowY: "auto" }}>
        {activeSection === "overview" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.navy }}>
                Welcome back, {(profile?.full_name || "Athlete").split(" ")[0]} 👋
              </div>
              <div style={{ fontFamily: "sans-serif", fontSize: 14, color: C.gray, marginTop: 4 }}>Here's your training overview.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                ["Sessions Done", completions.length, C.teal],
                ["This Week", completions.filter(c => { const d = new Date(c.completed_at); return (Date.now() - d) / 86400000 <= 7; }).length, C.amber],
                ["Completion %", `${Math.round((completions.length / 60) * 100)}%`, C.navy],
              ].map(([label, val, color]) => (
                <Card key={label} style={{ padding: "20px 22px" }}>
                  <div style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 28, fontWeight: 700, color }}>{val}</div>
                </Card>
              ))}
            </div>
            <Card style={{ padding: 24 }}>
              {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : <CompletionGraph completions={completions} />}
            </Card>
          </div>
        )}
        {activeSection === "program" && (
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 20 }}>My Program</div>
            <Card style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <div style={{ fontFamily: "sans-serif", fontWeight: 600, fontSize: 16, color: C.navy, marginBottom: 8 }}>Program loading in Step 2</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 14, color: C.gray }}>Your full training plan with editable weights and workout submission will live here.</div>
            </Card>
          </div>
        )}
        {activeSection === "chat" && (
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 20 }}>AI Coach</div>
            <Card style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <div style={{ fontFamily: "sans-serif", fontWeight: 600, fontSize: 16, color: C.navy, marginBottom: 8 }}>AI Chat coming in Step 4</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 14, color: C.gray }}>Your personal Claude coach — knows your program, your history, your goals.</div>
            </Card>
          </div>
        )}
        {activeSection === "progress" && (
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 20 }}>Progress</div>
            <Card style={{ padding: 24 }}>
              {loading ? <Spinner /> : <CompletionGraph completions={completions} />}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COACH DASHBOARD ──────────────────────────────────────────────────────────
function CoachDashboard() {
  const { session } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    sb.getAllClients(session.token).then(data => {
      setClients(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [session]);

  const fmtLastSeen = (ts) => {
    if (!ts) return "Never";
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{ padding: 32, background: C.sand, minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Coach Dashboard</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 14, color: C.gray, marginBottom: 28 }}>All your clients at a glance.</div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={36} /></div>
        ) : clients.length === 0 ? (
          <Card style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: "sans-serif", fontWeight: 600, color: C.navy, marginBottom: 8 }}>No clients yet</div>
            <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.gray }}>Create client accounts and they'll appear here.</div>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {clients.map(client => (
              <Card key={client.id} style={{ padding: "20px 22px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${C.teal}22`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {(client.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 15, color: C.navy }}>{client.full_name || client.email}</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: 12, color: C.gray }}>{client.email}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: C.grayLight, borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last seen</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: C.navy, marginTop: 2 }}>{fmtLastSeen(client.last_seen_at)}</div>
                  </div>
                  <div style={{ background: C.tealLight, borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.06em" }}>Member since</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: C.navy, marginTop: 2 }}>{new Date(client.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                  </div>
                </div>
                <Btn variant="secondary" style={{ width: "100%", justifyContent: "center", marginTop: 14, fontSize: 13 }}>
                  View Program →
                </Btn>
              </Card>
            ))}
          </div>
        )}

        <Card style={{ marginTop: 24, padding: "20px 24px" }}>
          <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 4 }}>Add a Client</div>
          <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.gray, marginBottom: 14 }}>Create a login for a new client — they'll get access to their program and AI coach.</div>
          <AddClientForm onAdded={() => sb.getAllClients(session.token).then(d => setClients(Array.isArray(d) ? d : []))} />
        </Card>
      </div>
    </div>
  );
}

function AddClientForm({ onAdded }) {
  const { signUp } = useAuth();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState("");

  const handle = async () => {
    if (!name || !email || !password) { setMsg("All fields required."); return; }
    setLoading(true); setMsg("");
    try {
      await signUp(email, password, name, "client");
      setMsg(`✓ Account created for ${name}`);
      setName(""); setEmail(""); setPassword("");
      setTimeout(() => { setMsg(""); onAdded(); }, 1500);
    } catch (e) {
      setMsg(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 140px" }}><Input label="Full name" value={name} onChange={setName} placeholder="Simone Bertone" /></div>
      <div style={{ flex: "1 1 180px" }}><Input label="Email" type="email" value={email} onChange={setEmail} placeholder="simone@email.com" /></div>
      <div style={{ flex: "1 1 140px" }}><Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" /></div>
      <Btn onClick={handle} loading={loading}>Add Client</Btn>
      {msg && <div style={{ fontFamily: "sans-serif", fontSize: 13, color: msg.startsWith("✓") ? C.teal : C.coral, width: "100%", marginTop: 4 }}>{msg}</div>}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { profile, loading } = useAuth();
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  const handleRefresh = () => {
    setLastRefreshed(Date.now());
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy, flexDirection: "column", gap: 16 }}>
        <Spinner size={40} color={C.tealMid} />
        <div style={{ fontFamily: "sans-serif", fontSize: 14, color: "#7a9db8" }}>Loading MindBodyBoat…</div>
      </div>
    );
  }

  if (!profile) return <LoginPage />;

  return (
    <div style={{ background: C.sand, minHeight: "100vh" }}>
      <TopNav onRefresh={handleRefresh} lastRefreshed={lastRefreshed} />
      {profile.role === "coach"
        ? <CoachDashboard />
        : <ClientDashboard onRefresh={handleRefresh} />
      }
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
