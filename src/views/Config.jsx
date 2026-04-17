import { useState, useEffect } from "react";
import { C, ARCHETYPES, getArchetype } from "../constants";
import * as storage from "../storage";
import { supabase } from "../supabaseClient";

const FAKE_DOMAIN = "biohack.local";
const SUPP_EMOJIS = ["💊", "🧪", "🐟", "🌿", "⚡", "🧠", "💉", "🍵", "🔬", "🫐", "🥛", "👓"];
const TRAIN_EMOJIS = ["🏋️", "🏊", "⚽", "🏀", "🚴", "🏃", "🧘", "🥊", "🎾", "🧗", "🏓", "🤸", "🥋", "🚣"];

export default function Config({ state, onUpdate, onReset, signOut }) {
  // New supplement form state
  const [nSN, setSN] = useState("");
  const [nSD, setSD] = useState("");
  const [nSE, setSE] = useState("💊");
  const [nSF, setSF] = useState("daily");
  const [nSCue, setSCue] = useState("");
  const [nSAnchor, setSAnchor] = useState("");

  // New training form state
  const [nTN, setTN] = useState("");
  const [nTE, setTE] = useState("🏋️");
  const [nTCue, setTCue] = useState("");
  const [nTAnchor, setTAnchor] = useState("");

  // Expand state per item (for inline editing)
  const [expSupp, setExpSupp] = useState({});
  const [expTrain, setExpTrain] = useState({});

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

  // --- Identity edit ---
  const [identityMsg, setIdentityMsg] = useState(null);
  const [customIdentity, setCustomIdentity] = useState(state.profile.identityCustom || "");
  const [showCustomIdentity, setShowCustomIdentity] = useState(state.profile.identity === "custom");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email || null);
    });
  }, []);

  const hasFakeEmail = currentEmail?.endsWith(`@${FAKE_DOMAIN}`);

  const update = (fn) => { onUpdate(fn); };

  const saveNickname = async () => {
    const trim = editNick.trim();
    setNickMsg(null);
    if (trim.length < 2) { setNickMsg({ type: "error", text: "mínimo 2 caracteres" }); return; }
    if (trim === state.profile.name) return;
    setSavingNick(true);
    try {
      if (supabase) {
        const { data: existing } = await supabase.rpc("get_email_by_nickname", { nick: trim });
        if (existing && existing !== currentEmail) {
          setNickMsg({ type: "error", text: "ese nickname ya está pillado" });
          setSavingNick(false);
          return;
        }
      }
      const { error } = await storage.saveProfile(trim, state.onboarded);
      if (error) { setNickMsg({ type: "error", text: error.message || "no se pudo guardar" }); setSavingNick(false); return; }
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
    if (error) setEmailMsg({ type: "error", text: error.message });
    else {
      setCurrentEmail(data.user?.email || email);
      setEditEmail("");
      setEmailMsg({ type: "ok", text: "email vinculado (puede pedir confirmación)" });
    }
    setSavingEmail(false);
  };

  const selectIdentity = async (archetypeId) => {
    setIdentityMsg(null);
    const isCustom = archetypeId === "custom";
    const identity = archetypeId;
    const identityCustom = isCustom ? customIdentity.trim() : null;
    if (isCustom && !identityCustom) {
      setIdentityMsg({ type: "error", text: "escribe algo en el campo" });
      return;
    }
    const { error } = await storage.saveIdentity(identity, identityCustom);
    if (error) { setIdentityMsg({ type: "error", text: error.message }); return; }
    update(ns => {
      ns.profile.identity = identity;
      ns.profile.identityCustom = identityCustom;
    });
    setIdentityMsg({ type: "ok", text: "guardado" });
  };

  const clearIdentity = async () => {
    setIdentityMsg(null);
    const { error } = await storage.saveIdentity(null, null);
    if (error) { setIdentityMsg({ type: "error", text: error.message }); return; }
    update(ns => { ns.profile.identity = null; ns.profile.identityCustom = null; });
    setShowCustomIdentity(false);
    setCustomIdentity("");
    setIdentityMsg({ type: "ok", text: "sin identidad" });
  };

  const msgStyle = (m) => ({
    fontSize: 10,
    marginTop: 6,
    color: m?.type === "ok" ? C.green : C.magenta,
  });

  // --- Data slicing ---
  const activeSupps = state.supplements.filter(s => !s.archivedAt);
  const archivedSupps = state.supplements.filter(s => s.archivedAt);
  const activeTrainings = state.trainingTypes.filter(t => !t.archivedAt);
  const archivedTrainings = state.trainingTypes.filter(t => t.archivedAt);

  // --- Helpers ---
  const saveCue = (type, id, cue) => {
    const updates = { cue: cue || null };
    update(ns => {
      const arr = type === "supp" ? ns.supplements : ns.trainingTypes;
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) arr[idx].cue = cue || null;
    });
    if (type === "supp") storage.updateSupplement(id, updates);
    else storage.updateTrainingType(id, updates);
  };

  const archiveItem = (type, id) => {
    update(ns => {
      const arr = type === "supp" ? ns.supplements : ns.trainingTypes;
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) arr[idx].archivedAt = new Date().toISOString();
    });
    if (type === "supp") storage.archiveSupplement(id);
    else storage.archiveTrainingType(id);
  };

  const unarchiveItem = (type, id) => {
    update(ns => {
      const arr = type === "supp" ? ns.supplements : ns.trainingTypes;
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) arr[idx].archivedAt = null;
    });
    if (type === "supp") storage.unarchiveSupplement(id);
    else storage.unarchiveTrainingType(id);
  };

  const deleteForever = (type, id) => {
    if (!window.confirm("borrar para siempre? se perderán los logs históricos.")) return;
    update(ns => {
      if (type === "supp") ns.supplements = ns.supplements.filter(x => x.id !== id);
      else ns.trainingTypes = ns.trainingTypes.filter(x => x.id !== id);
    });
    if (type === "supp") storage.deleteSupplementForever(id);
    else storage.deleteTrainingTypeForever(id);
  };

  return (
    <>
      {/* ========== PERFIL ========== */}
      <div className="section-label">// perfil</div>
      <div className="card">
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>nickname</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" value={editNick} onChange={e => setEditNick(e.target.value)}
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
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    placeholder="tu@email.com" style={{ flex: 1, boxSizing: "border-box" }} />
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

      {/* ========== IDENTIDAD ========== */}
      <div className="section-label">// identidad</div>
      <div className="card">
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>
          ¿qué tipo de persona quieres construir?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ARCHETYPES.map(a => {
            const sel = state.profile.identity === a.id;
            return (
              <div key={a.id} onClick={() => { setShowCustomIdentity(false); selectIdentity(a.id); }}
                className={`pill ${sel ? "pill-done" : "pill-off"}`}
                style={{ fontSize: 11, cursor: "pointer" }}
                title={a.desc}>
                {a.emoji} {a.name}
              </div>
            );
          })}
          <div onClick={() => setShowCustomIdentity(true)}
            className={`pill ${state.profile.identity === "custom" ? "pill-done" : "pill-off"}`}
            style={{ fontSize: 11, cursor: "pointer" }}>
            ✏️ otro
          </div>
        </div>

        {showCustomIdentity && (
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <input type="text" value={customIdentity}
              onChange={e => setCustomIdentity(e.target.value)}
              placeholder="quiero ser alguien que..."
              style={{ flex: 1, boxSizing: "border-box" }} />
            <button className="btn btn-cyan" onClick={() => selectIdentity("custom")}
              disabled={!customIdentity.trim()}
              style={{ padding: "6px 14px", fontSize: 11, opacity: customIdentity.trim() ? 1 : 0.5 }}>
              guardar
            </button>
          </div>
        )}

        {state.profile.identity === "custom" && !showCustomIdentity && state.profile.identityCustom && (
          <div style={{ fontSize: 11, color: C.text, marginTop: 8 }}>
            <span style={{ color: C.muted }}>actual: </span>{state.profile.identityCustom}
          </div>
        )}

        {(state.profile.identity || state.profile.identityCustom) && (
          <div onClick={clearIdentity}
            style={{ fontSize: 9, color: C.dim, cursor: "pointer", marginTop: 10, textAlign: "center" }}>
            quitar identidad
          </div>
        )}

        {identityMsg && <div style={msgStyle(identityMsg)}>{identityMsg.text}</div>}
      </div>

      {/* ========== SUPLEMENTOS ACTIVOS ========== */}
      <div className="section-label">// suplementos</div>
      <div className="card">
        {activeSupps.map(s => {
          const isExp = !!expSupp[s.id];
          return (
            <div key={s.id} style={{ borderBottom: `0.5px solid ${C.border}`, padding: "5px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, flex: 1, cursor: "pointer" }}
                  onClick={() => setExpSupp({ ...expSupp, [s.id]: !isExp })}>
                  {s.emoji} {s.name} <span style={{ color: C.dim }}>— {s.dose}</span>
                  {s.cue && !isExp && <span style={{ color: C.dim, fontSize: 9, marginLeft: 6 }}>· {s.cue}</span>}
                </span>
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
                <button className="btn btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}
                  title="archivar (conserva histórico)"
                  onClick={() => archiveItem("supp", s.id)}>📦</button>
              </div>
              {isExp && (
                <div style={{ marginTop: 6, paddingLeft: 4 }}>
                  <div style={{ fontSize: 9, color: C.dim, marginBottom: 3 }}>cuándo lo tomas? (opcional)</div>
                  <input type="text" defaultValue={s.cue || ""}
                    placeholder="cuando me levante y encienda la cafetera..."
                    onBlur={e => saveCue("supp", s.id, e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", fontSize: 11 }} />
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                    los hábitos con un disparador claro se cumplen 2-3x más
                  </div>
                  <div onClick={() => deleteForever("supp", s.id)}
                    style={{ fontSize: 9, color: C.magenta, cursor: "pointer", marginTop: 8, textAlign: "right" }}>
                    borrar para siempre
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* New supplement form */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <select value={nSE} onChange={e => setSE(e.target.value)}
              style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
              {SUPP_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" value={nSN} onChange={e => setSN(e.target.value)}
              placeholder="nombre" style={{ flex: 1, minWidth: 50 }} />
            <input type="text" value={nSD} onChange={e => setSD(e.target.value)}
              placeholder="dosis" style={{ width: 50 }} />
            <select value={nSF} onChange={e => setSF(e.target.value)}
              style={{ fontSize: 10, padding: "5px 4px", width: 80 }}>
              <option value="daily">diario</option>
              <option value="conditional">condicional</option>
            </select>
          </div>
          <input type="text" value={nSCue}
            onChange={e => { setSCue(e.target.value); setSAnchor(""); }}
            placeholder="cuándo lo harás? (opcional)"
            style={{ width: "100%", boxSizing: "border-box", fontSize: 11, marginTop: 4 }} />
          {activeSupps.length > 0 && (
            <select value={nSAnchor}
              onChange={e => {
                setSAnchor(e.target.value);
                const anchor = activeSupps.find(x => x.id === e.target.value);
                if (anchor) setSCue(`después de ${anchor.name.toLowerCase()}`);
              }}
              style={{ width: "100%", boxSizing: "border-box", fontSize: 10, marginTop: 4 }}>
              <option value="">o ancla a un hábito existente...</option>
              {activeSupps.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
          )}
          <button className="btn btn-cyan"
            style={{ padding: "6px 10px", marginTop: 6, width: "100%" }}
            onClick={async () => {
              if (!nSN.trim()) return;
              const localId = "s" + Date.now();
              const supp = {
                id: localId, name: nSN.trim(), emoji: nSE,
                dose: nSD.trim() || "—", freq: nSF,
                cue: nSCue.trim() || null,
              };
              update(ns => { ns.supplements.push(supp); });
              const dbId = await storage.addSupplement(supp);
              if (dbId && dbId !== localId) {
                update(ns => {
                  const idx = ns.supplements.findIndex(x => x.id === localId);
                  if (idx >= 0) ns.supplements[idx].id = dbId;
                });
              }
              setSN(""); setSD(""); setSCue(""); setSAnchor("");
            }}>+ añadir suplemento</button>
        </div>
      </div>

      {/* ========== SUPLEMENTOS ARCHIVADOS ========== */}
      {archivedSupps.length > 0 && (
        <>
          <div className="section-label">// archivados</div>
          <div className="card">
            {archivedSupps.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `0.5px solid ${C.border}`, opacity: 0.6 }}>
                <span style={{ fontSize: 11, flex: 1 }}>
                  {s.emoji} {s.name} <span style={{ color: C.dim }}>— {s.dose}</span>
                </span>
                <button className="btn btn-ghost" style={{ fontSize: 9, padding: "2px 8px" }}
                  onClick={() => unarchiveItem("supp", s.id)}>restaurar</button>
                <button className="btn btn-ghost" style={{ fontSize: 9, padding: "2px 6px", color: C.magenta }}
                  title="borrar permanentemente (pierde logs)"
                  onClick={() => deleteForever("supp", s.id)}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== TIPOS DE ENTRENO ACTIVOS ========== */}
      <div className="section-label">// tipos de entreno</div>
      <div className="card">
        {activeTrainings.map(t => {
          const isExp = !!expTrain[t.id];
          return (
            <div key={t.id} style={{ borderBottom: `0.5px solid ${C.border}`, padding: "4px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, cursor: "pointer", flex: 1 }}
                  onClick={() => setExpTrain({ ...expTrain, [t.id]: !isExp })}>
                  {t.emoji} {t.name}
                  {t.cue && !isExp && <span style={{ color: C.dim, fontSize: 9, marginLeft: 6 }}>· {t.cue}</span>}
                </span>
                <button className="btn btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}
                  title="archivar"
                  onClick={() => archiveItem("train", t.id)}>📦</button>
              </div>
              {isExp && (
                <div style={{ marginTop: 6, paddingLeft: 4 }}>
                  <div style={{ fontSize: 9, color: C.dim, marginBottom: 3 }}>cuándo lo haces? (opcional)</div>
                  <input type="text" defaultValue={t.cue || ""}
                    placeholder="los lunes, miércoles, viernes al salir del trabajo..."
                    onBlur={e => saveCue("train", t.id, e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", fontSize: 11 }} />
                  <div onClick={() => deleteForever("train", t.id)}
                    style={{ fontSize: 9, color: C.magenta, cursor: "pointer", marginTop: 8, textAlign: "right" }}>
                    borrar para siempre
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* New training form */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <select value={nTE} onChange={e => setTE(e.target.value)}
              style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
              {TRAIN_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" value={nTN} onChange={e => setTN(e.target.value)}
              placeholder="tipo" style={{ flex: 1 }} />
          </div>
          <input type="text" value={nTCue}
            onChange={e => { setTCue(e.target.value); setTAnchor(""); }}
            placeholder="cuándo lo harás? (opcional)"
            style={{ width: "100%", boxSizing: "border-box", fontSize: 11, marginTop: 4 }} />
          {(activeSupps.length > 0 || activeTrainings.length > 0) && (
            <select value={nTAnchor}
              onChange={e => {
                setTAnchor(e.target.value);
                const anchor = [...activeSupps, ...activeTrainings].find(x => x.id === e.target.value);
                if (anchor) setTCue(`después de ${anchor.name.toLowerCase()}`);
              }}
              style={{ width: "100%", boxSizing: "border-box", fontSize: 10, marginTop: 4 }}>
              <option value="">o ancla a un hábito existente...</option>
              {activeSupps.map(s => <option key={`s-${s.id}`} value={s.id}>{s.emoji} {s.name}</option>)}
              {activeTrainings.map(t => <option key={`t-${t.id}`} value={t.id}>{t.emoji} {t.name}</option>)}
            </select>
          )}
          <button className="btn btn-cyan"
            style={{ padding: "6px 10px", marginTop: 6, width: "100%" }}
            onClick={async () => {
              if (!nTN.trim()) return;
              const localId = "t" + Date.now();
              const tt = {
                id: localId, name: nTN.trim(), emoji: nTE,
                cue: nTCue.trim() || null,
              };
              update(ns => { ns.trainingTypes.push(tt); });
              const dbId = await storage.addTrainingType(tt);
              if (dbId && dbId !== localId) {
                update(ns => {
                  const idx = ns.trainingTypes.findIndex(x => x.id === localId);
                  if (idx >= 0) ns.trainingTypes[idx].id = dbId;
                });
              }
              setTN(""); setTCue(""); setTAnchor("");
            }}>+ añadir tipo</button>
        </div>
      </div>

      {/* ========== TRAININGS ARCHIVADOS ========== */}
      {archivedTrainings.length > 0 && (
        <>
          <div className="section-label">// entrenos archivados</div>
          <div className="card">
            {archivedTrainings.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `0.5px solid ${C.border}`, opacity: 0.6 }}>
                <span style={{ fontSize: 11, flex: 1 }}>{t.emoji} {t.name}</span>
                <button className="btn btn-ghost" style={{ fontSize: 9, padding: "2px 8px" }}
                  onClick={() => unarchiveItem("train", t.id)}>restaurar</button>
                <button className="btn btn-ghost" style={{ fontSize: 9, padding: "2px 6px", color: C.magenta }}
                  title="borrar permanentemente"
                  onClick={() => deleteForever("train", t.id)}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== CUENTA ========== */}
      {signOut && (
        <>
          <div className="section-label">// cuenta</div>
          <div className="card">
            <button className="btn btn-ghost" onClick={signOut} style={{ width: "100%" }}>cerrar sesión</button>
          </div>
        </>
      )}

      {/* ========== ZONA PELIGROSA ========== */}
      <div className="section-label">// zona peligrosa</div>
      <div className="card" style={{ borderColor: "rgba(255,0,80,0.15)" }}>
        <button className="btn btn-danger" onClick={onReset} style={{ width: "100%" }}>resetear datos</button>
      </div>
    </>
  );
}
