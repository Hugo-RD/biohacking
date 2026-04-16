import { useState, useEffect } from "react";
import { C } from "../constants";
import * as storage from "../storage";
import { supabase } from "../supabaseClient";

const FAKE_DOMAIN = "biohack.local";

export default function Config({ state, onUpdate, onReset, signOut }) {
  const [nSN, setSN] = useState("");
  const [nSD, setSD] = useState("");
  const [nSE, setSE] = useState("💊");
  const [nSF, setSF] = useState("daily");
  const [nTN, setTN] = useState("");
  const [nTE, setTE] = useState("🏋️");

  // --- Nickname edit ---
  const [editNick, setEditNick] = useState(state.profile.name || "");
  const [nickMsg, setNickMsg] = useState(null);
  const [savingNick, setSavingNick] = useState(false);

  useEffect(() => { setEditNick(state.profile.name || ""); }, [state.profile.name]);

  // --- Email link ---
  const [currentEmail, setCurrentEmail] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState(null);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email || null);
    });
  }, []);

  const hasFakeEmail = currentEmail?.endsWith(`@${FAKE_DOMAIN}`);

  const update = (fn) => {
    onUpdate(fn);
  };

  const saveNickname = async () => {
    const trim = editNick.trim();
    setNickMsg(null);
    if (trim.length < 2) { setNickMsg({ type: "error", text: "mínimo 2 caracteres" }); return; }
    if (trim === state.profile.name) return;
    setSavingNick(true);
    try {
      if (supabase) {
        const { data: existing } = await supabase.rpc("get_email_by_nickname", { nick: trim });
        // If someone else has this nick (not me), conflict
        if (existing && existing !== currentEmail) {
          setNickMsg({ type: "error", text: "ese nickname ya está pillado" });
          setSavingNick(false);
          return;
        }
      }
      const { error } = await storage.saveProfile(trim, state.onboarded);
      if (error) {
        setNickMsg({ type: "error", text: error.message || "no se pudo guardar" });
        setSavingNick(false);
        return;
      }
      update(ns => { ns.profile.name = trim; });
      setNickMsg({ type: "ok", text: "guardado" });
    } catch (err) {
      setNickMsg({ type: "error", text: err.message });
    }
    setSavingNick(false);
  };

  const linkEmail = async () => {
    const email = editEmail.trim().toLowerCase();
    setEmailMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailMsg({ type: "error", text: "email no válido" });
      return;
    }
    setSavingEmail(true);
    const { data, error } = await supabase.auth.updateUser({ email });
    if (error) {
      setEmailMsg({ type: "error", text: error.message });
    } else {
      setCurrentEmail(data.user?.email || email);
      setEditEmail("");
      setEmailMsg({ type: "ok", text: "email vinculado (puede pedir confirmación)" });
    }
    setSavingEmail(false);
  };

  const msgStyle = (m) => ({
    fontSize: 10,
    marginTop: 6,
    color: m?.type === "ok" ? C.green : C.magenta,
  });

  return (
    <>
      <div className="section-label">// perfil</div>
      <div className="card">
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>nickname</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" value={editNick}
            onChange={e => setEditNick(e.target.value)}
            style={{ flex: 1, boxSizing: "border-box" }} placeholder="tu nickname" />
          <button className="btn btn-cyan"
            disabled={savingNick || editNick.trim() === state.profile.name}
            onClick={saveNickname}
            style={{ padding: "6px 14px", fontSize: 11, opacity: (savingNick || editNick.trim() === state.profile.name) ? 0.5 : 1 }}>
            {savingNick ? "..." : "guardar"}
          </button>
        </div>
        {nickMsg && <div style={msgStyle(nickMsg)}>{nickMsg.text}</div>}

        {supabase && (
          <>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 14, marginBottom: 4 }}>
              email {hasFakeEmail ? "(sin vincular)" : ""}
            </div>
            {hasFakeEmail ? (
              <>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="email" value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="tu@email.com"
                    style={{ flex: 1, boxSizing: "border-box" }} />
                  <button className="btn btn-cyan"
                    disabled={savingEmail || !editEmail.trim()}
                    onClick={linkEmail}
                    style={{ padding: "6px 14px", fontSize: 11, opacity: (savingEmail || !editEmail.trim()) ? 0.5 : 1 }}>
                    {savingEmail ? "..." : "vincular"}
                  </button>
                </div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                  vincula un email para recuperar la cuenta si olvidas la contraseña
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: C.text }}>{currentEmail}</div>
            )}
            {emailMsg && <div style={msgStyle(emailMsg)}>{emailMsg.text}</div>}
          </>
        )}
      </div>

      <div className="section-label">// suplementos</div>
      <div className="card">
        {state.supplements.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 11, flex: 1 }}>{s.emoji} {s.name} <span style={{ color: C.dim }}>— {s.dose}</span></span>
            <span className="freq-tag"
              onClick={() => {
                const newFreq = s.freq === "conditional" ? "daily" : "conditional";
                update(ns => {
                  const idx = ns.supplements.findIndex(x => x.id === s.id);
                  ns.supplements[idx].freq = newFreq;
                });
                storage.updateSupplement(s.id, { freq: newFreq });
              }}
              style={{
                cursor: "pointer",
                background: s.freq === "conditional" ? "rgba(255,184,0,0.06)" : "rgba(0,240,255,0.06)",
                color: s.freq === "conditional" ? C.amber : C.cyan,
                border: `0.5px solid ${s.freq === "conditional" ? "rgba(255,184,0,0.15)" : "rgba(0,240,255,0.15)"}`,
              }}>
              {s.freq === "conditional" ? "condicional" : "diario"}
            </span>
            <button className="btn btn-danger" style={{ fontSize: 9, padding: "2px 8px" }}
              onClick={() => {
                update(ns => { ns.supplements = ns.supplements.filter(x => x.id !== s.id); });
                storage.removeSupplement(s.id);
              }}>✕</button>
          </div>
        ))}
        <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <select value={nSE} onChange={e => setSE(e.target.value)} style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
            {["💊", "🧪", "🐟", "🌿", "⚡", "🧠", "💉", "🍵", "🔬", "🫐", "🥛", "👓"].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="text" value={nSN} onChange={e => setSN(e.target.value)} placeholder="nombre" style={{ flex: 1, minWidth: 50 }} />
          <input type="text" value={nSD} onChange={e => setSD(e.target.value)} placeholder="dosis" style={{ width: 50 }} />
          <select value={nSF} onChange={e => setSF(e.target.value)} style={{ fontSize: 10, padding: "5px 4px", width: 80 }}>
            <option value="daily">diario</option>
            <option value="conditional">condicional</option>
          </select>
          <button className="btn btn-cyan" style={{ padding: "6px 10px" }} onClick={async () => {
            if (!nSN.trim()) return;
            const localId = "s" + Date.now();
            const supp = { id: localId, name: nSN.trim(), emoji: nSE, dose: nSD.trim() || "—", freq: nSF };
            update(ns => { ns.supplements.push(supp); });
            const dbId = await storage.addSupplement(supp);
            if (dbId && dbId !== localId) {
              // Update local state with DB id
              update(ns => {
                const idx = ns.supplements.findIndex(x => x.id === localId);
                if (idx >= 0) ns.supplements[idx].id = dbId;
              });
            }
            setSN(""); setSD("");
          }}>+</button>
        </div>
      </div>

      <div className="section-label">// tipos de entreno</div>
      <div className="card">
        {state.trainingTypes.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 11 }}>{t.emoji} {t.name}</span>
            <button className="btn btn-danger" style={{ fontSize: 9, padding: "2px 8px" }}
              onClick={() => {
                update(ns => { ns.trainingTypes = ns.trainingTypes.filter(x => x.id !== t.id); });
                storage.removeTrainingType(t.id);
              }}>✕</button>
          </div>
        ))}
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          <select value={nTE} onChange={e => setTE(e.target.value)} style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
            {["🏋️", "🏊", "⚽", "🏀", "🚴", "🏃", "🧘", "🥊", "🎾", "🧗", "🏓", "🤸", "🥋", "🚣"].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="text" value={nTN} onChange={e => setTN(e.target.value)} placeholder="tipo" style={{ flex: 1 }} />
          <button className="btn btn-cyan" style={{ padding: "6px 10px" }} onClick={async () => {
            if (!nTN.trim()) return;
            const localId = "t" + Date.now();
            const tt = { id: localId, name: nTN.trim(), emoji: nTE };
            update(ns => { ns.trainingTypes.push(tt); });
            const dbId = await storage.addTrainingType(tt);
            if (dbId && dbId !== localId) {
              update(ns => {
                const idx = ns.trainingTypes.findIndex(x => x.id === localId);
                if (idx >= 0) ns.trainingTypes[idx].id = dbId;
              });
            }
            setTN("");
          }}>+</button>
        </div>
      </div>

      {signOut && (
        <>
          <div className="section-label">// cuenta</div>
          <div className="card">
            <button className="btn btn-ghost" onClick={signOut} style={{ width: "100%" }}>cerrar sesión</button>
          </div>
        </>
      )}

      <div className="section-label">// zona peligrosa</div>
      <div className="card" style={{ borderColor: "rgba(255,0,80,0.15)" }}>
        <button className="btn btn-danger" onClick={onReset} style={{ width: "100%" }}>resetear datos</button>
      </div>
    </>
  );
}
