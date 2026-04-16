import { useState, useEffect } from "react";
import { C } from "../constants";
import { supabase } from "../supabaseClient";

const FAKE_DOMAIN = "biohack.local";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup | check-email
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si Supabase redirige con error en el hash (#error=...&error_description=...),
  // mostrarlo al usuario en vez de dejar la pantalla muda, y limpiar la URL.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("error")) return;
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const desc = params.get("error_description");
    const code = params.get("error_code");
    if (desc || code) {
      const friendly = code === "otp_expired"
        ? "el enlace de confirmación ha caducado o ya se usó. regístrate de nuevo para recibir uno nuevo."
        : decodeURIComponent(desc || code).replace(/\+/g, " ");
      setError(friendly);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    const trimNick = nick.trim();
    if (!trimNick || trimNick.length < 2) { setError("nickname mínimo 2 caracteres"); return; }
    setLoading(true);
    try {
      // Check nickname availability
      const { data: existing } = await supabase.rpc("get_email_by_nickname", { nick: trimNick });
      if (existing) { setError("ese nickname ya está pillado"); setLoading(false); return; }

      const realEmail = email.trim();
      const authEmail = realEmail || `${trimNick.toLowerCase().replace(/[^a-z0-9]/g, "")}@${FAKE_DOMAIN}`;

      const { data, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: pass,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) { setError(authError.message); setLoading(false); return; }

      // Save nickname to profile
      if (data.user) {
        await supabase.from("profiles").update({ name: trimNick }).eq("id", data.user.id);
      }

      // If no session, Supabase requires email confirmation → show check-email screen
      // If session exists, user is logged in → onAuthStateChange redirects automatically
      if (!data.session && realEmail) {
        setMode("check-email");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc("get_email_by_nickname", { nick: nick.trim() });
      if (rpcError || !resolvedEmail) { setError("nickname no encontrado"); setLoading(false); return; }

      const { error: authError } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password: pass });
      if (authError) setError(authError.message);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const wrap = (children) => (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: 20,
      maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ width: "100%", animation: "slideUp 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: C.cyan, letterSpacing: -1 }}>biohack</div>
        </div>
        {children}
      </div>
    </div>
  );

  if (mode === "check-email") return wrap(
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
      <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>revisa tu email</div>
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
        hemos enviado un link de confirmación a<br />
        <span style={{ color: C.cyan }}>{email}</span>
      </div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 16 }}>
        después de confirmar, inicia sesión con tu nickname
      </div>
      <button className="btn btn-ghost" onClick={() => { setMode("login"); setError(null); }}
        style={{ marginTop: 20, padding: "8px 24px" }}>
        ir a iniciar sesión
      </button>
    </div>
  );

  if (mode === "login") return wrap(
    <>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 16 }}>inicia sesión</div>
      <form onSubmit={handleLogin} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" value={nick} onChange={e => setNick(e.target.value)}
          placeholder="nickname" required autoFocus
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px" }} />
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="contraseña" required minLength={6}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px",
            background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 6,
            color: C.text, fontFamily: "'Inter', sans-serif", fontSize: 12, outline: "none" }} />
        {error && <div style={{ fontSize: 11, color: C.magenta, textAlign: "center" }}>{error}</div>}
        <button type="submit" className="btn btn-cyan" disabled={loading}
          style={{ width: "100%", padding: "10px", fontSize: 13, opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : "entrar"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <span style={{ fontSize: 11, color: C.muted }}>no tienes cuenta? </span>
        <span onClick={() => { setMode("signup"); setError(null); }}
          style={{ fontSize: 11, color: C.cyan, cursor: "pointer" }}>regístrate</span>
      </div>
    </>
  );

  return wrap(
    <>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 16 }}>crea tu cuenta</div>
      <form onSubmit={handleSignup} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" value={nick} onChange={e => setNick(e.target.value)}
          placeholder="nickname" required autoFocus
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px" }} />
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="contraseña" required minLength={6}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px",
            background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 6,
            color: C.text, fontFamily: "'Inter', sans-serif", fontSize: 12, outline: "none" }} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="email (opcional, para recuperar contraseña)"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px" }} />
        {error && <div style={{ fontSize: 11, color: C.magenta, textAlign: "center" }}>{error}</div>}
        <button type="submit" className="btn btn-cyan" disabled={loading}
          style={{ width: "100%", padding: "10px", fontSize: 13, opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : "crear cuenta"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <span style={{ fontSize: 11, color: C.muted }}>ya tienes cuenta? </span>
        <span onClick={() => { setMode("login"); setError(null); }}
          style={{ fontSize: 11, color: C.cyan, cursor: "pointer" }}>inicia sesión</span>
      </div>
    </>
  );
}
