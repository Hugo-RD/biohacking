import { useState } from "react";
import { C, TODAY, ARCHETYPES } from "../constants";

const SUGG_SUPPS = [
  { name: "Creatina", emoji: "💊", dose: "5g", freq: "daily" },
  { name: "Magnesio", emoji: "🧪", dose: "400mg", freq: "daily" },
  { name: "Omega-3", emoji: "🐟", dose: "1g", freq: "daily" },
  { name: "Vitamina D", emoji: "☀️", dose: "4000UI", freq: "daily" },
  { name: "Ashwagandha", emoji: "🌿", dose: "600mg", freq: "daily" },
  { name: "Zinc", emoji: "⚡", dose: "15mg", freq: "daily" },
];

const SUGG_TRAINING = [
  { name: "Gym", emoji: "🏋️" },
  { name: "Correr", emoji: "🏃" },
  { name: "Natación", emoji: "🏊" },
  { name: "Fútbol", emoji: "⚽" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Ciclismo", emoji: "🚴" },
  { name: "Calistenia", emoji: "🤸" },
];

const SUPP_EMOJIS = ["💊", "🧪", "🐟", "🌿", "⚡", "🧠", "💉", "🍵", "🔬", "🫐", "🥛", "👓"];
const TRAIN_EMOJIS = ["🏋️", "🏊", "⚽", "🏀", "🚴", "🏃", "🧘", "🥊", "🎾", "🧗", "🏓", "🤸", "🥋", "🚣"];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  // Identity (Pilar 1.3)
  const [identity, setIdentity] = useState(null);
  const [identityCustom, setIdentityCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Supps
  const [supps, setSupps] = useState([]);
  const [showCustomSupp, setShowCustomSupp] = useState(false);
  const [nSN, setSN] = useState("");
  const [nSD, setSD] = useState("");
  const [nSE, setSE] = useState("💊");
  const [nSF, setSF] = useState("daily");
  const [nSCue, setSCue] = useState("");

  // Trainings
  const [trains, setTrains] = useState([]);
  const [showCustomTrain, setShowCustomTrain] = useState(false);
  const [nTN, setTN] = useState("");
  const [nTE, setTE] = useState("🏋️");
  const [nTCue, setTCue] = useState("");

  const toggleSugg = (sugg, list, setList) => {
    const exists = list.find(s => s.name === sugg.name);
    if (exists) setList(list.filter(s => s.name !== sugg.name));
    else setList([...list, { ...sugg, id: "s" + Date.now() + Math.random().toString(36).slice(2, 5), cue: null }]);
  };

  const finish = () => {
    const finalIdentity = showCustom && identityCustom.trim() ? "custom" : identity;
    const finalIdentityCustom = finalIdentity === "custom" ? identityCustom.trim() : null;
    onComplete({
      profile: {
        created: TODAY(),
        identity: finalIdentity,
        identityCustom: finalIdentityCustom,
      },
      supplements: supps.map((s, i) => ({ ...s, id: s.id || "s" + (i + 1), cue: s.cue || null })),
      trainingTypes: trains.map((t, i) => ({ ...t, id: t.id || "t" + (i + 1), cue: t.cue || null })),
      logs: {},
      unlockedBadges: [],
      onboarded: true,
    });
  };

  const STEPS = 4;
  const dots = (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: STEPS }, (_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i === step ? C.cyan : C.dim,
          transition: "background 0.3s",
          boxShadow: i === step ? `0 0 6px ${C.cyan}` : "none",
        }} />
      ))}
    </div>
  );

  const wrap = (children) => (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "20px",
      maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ width: "100%", animation: "slideUp 0.3s ease" }}>
        {dots}
        {children}
      </div>
    </div>
  );

  // Step 0: Welcome
  if (step === 0) return wrap(
    <div style={{ textAlign: "center" }}>
      <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: C.cyan, letterSpacing: -1 }}>biohack</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
        vamos a construir tus hábitos.<br />
        identidad, suplementos, entreno y sueño.
      </div>
      <button className="btn btn-cyan" onClick={() => setStep(1)}
        style={{ marginTop: 28, padding: "10px 32px", fontSize: 13 }}>
        empezar
      </button>
    </div>
  );

  // Step 1: Identity (Pilar 1.3)
  if (step === 1) return wrap(
    <div>
      <div className="section-label" style={{ textAlign: "center", marginBottom: 12 }}>// identidad</div>
      <div style={{ fontSize: 12, color: C.text, textAlign: "center", marginBottom: 6, lineHeight: 1.5 }}>
        ¿qué tipo de persona quieres construir?
      </div>
      <div style={{ fontSize: 10, color: C.dim, textAlign: "center", marginBottom: 16 }}>
        la identidad guía los hábitos, no al revés
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 12 }}>
        {ARCHETYPES.map(a => {
          const sel = identity === a.id && !showCustom;
          return (
            <div key={a.id} onClick={() => { setIdentity(a.id); setShowCustom(false); }}
              className={sel ? "pill pill-done" : "pill pill-off"}
              style={{ fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 12px" }}
              title={a.desc}>
              <span style={{ fontSize: 16 }}>{a.emoji}</span>
              <span style={{ marginTop: 3 }}>{a.name}</span>
            </div>
          );
        })}
        <div onClick={() => { setShowCustom(true); setIdentity(null); }}
          className={showCustom ? "pill pill-done" : "pill pill-off"}
          style={{ fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 12px" }}>
          <span style={{ fontSize: 16 }}>✏️</span>
          <span style={{ marginTop: 3 }}>otro</span>
        </div>
      </div>

      {identity && !showCustom && (() => {
        const arch = ARCHETYPES.find(a => a.id === identity);
        return arch && <div style={{ fontSize: 10, color: C.muted, textAlign: "center", fontStyle: "italic", marginTop: 6 }}>
          "{arch.desc}"
        </div>;
      })()}

      {showCustom && (
        <input type="text" value={identityCustom}
          onChange={e => setIdentityCustom(e.target.value)}
          placeholder="quiero ser alguien que..."
          style={{ width: "100%", boxSizing: "border-box", marginTop: 8 }} />
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
        <button className="btn btn-ghost" onClick={() => setStep(0)} style={{ padding: "8px 20px" }}>atrás</button>
        <button className="btn btn-ghost" onClick={() => { setIdentity(null); setShowCustom(false); setStep(2); }} style={{ padding: "8px 20px" }}>saltar</button>
        <button className="btn btn-cyan" onClick={() => setStep(2)}
          disabled={!identity && !(showCustom && identityCustom.trim())}
          style={{ padding: "8px 24px", opacity: (!identity && !(showCustom && identityCustom.trim())) ? 0.5 : 1 }}>
          siguiente
        </button>
      </div>
    </div>
  );

  // Step 2: Supplements
  if (step === 2) return wrap(
    <div>
      <div className="section-label" style={{ textAlign: "center", marginBottom: 12 }}>// tus suplementos</div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 16 }}>selecciona o añade los que tomas</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {SUGG_SUPPS.map(s => {
          const sel = supps.find(x => x.name === s.name);
          return (
            <div key={s.name} onClick={() => toggleSugg(s, supps, setSupps)}
              className={sel ? "pill pill-done" : "pill pill-off"}
              style={{ fontSize: 11 }}>
              {s.emoji} {s.name} <span style={{ color: C.dim, fontSize: 9 }}>{s.dose}</span>
            </div>
          );
        })}
      </div>

      {supps.filter(s => !SUGG_SUPPS.find(sg => sg.name === s.name)).map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `0.5px solid ${C.border}` }}>
          <span style={{ fontSize: 11, flex: 1 }}>
            {s.emoji} {s.name} <span style={{ color: C.dim }}>— {s.dose}</span>
            {s.cue && <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>· {s.cue}</div>}
          </span>
          <button className="btn btn-danger" style={{ fontSize: 9, padding: "2px 8px" }}
            onClick={() => setSupps(supps.filter(x => x.id !== s.id))}>✕</button>
        </div>
      ))}

      {!showCustomSupp ? (
        <div onClick={() => setShowCustomSupp(true)}
          style={{ fontSize: 11, color: C.muted, cursor: "pointer", textAlign: "center", marginTop: 8, padding: 6 }}>
          + añadir otro
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <select value={nSE} onChange={e => setSE(e.target.value)} style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
              {SUPP_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" value={nSN} onChange={e => setSN(e.target.value)} placeholder="nombre" style={{ flex: 1, minWidth: 50 }} />
            <input type="text" value={nSD} onChange={e => setSD(e.target.value)} placeholder="dosis" style={{ width: 50 }} />
            <select value={nSF} onChange={e => setSF(e.target.value)} style={{ fontSize: 10, padding: "5px 4px", width: 80 }}>
              <option value="daily">diario</option>
              <option value="conditional">condicional</option>
            </select>
          </div>
          <input type="text" value={nSCue} onChange={e => setSCue(e.target.value)}
            placeholder="cuándo lo harás? (opcional, cuando me levante...)"
            style={{ width: "100%", boxSizing: "border-box", fontSize: 11, marginTop: 4 }} />
          <button className="btn btn-cyan" style={{ padding: "6px 10px", marginTop: 6, width: "100%" }} onClick={() => {
            if (!nSN.trim()) return;
            setSupps([...supps, { id: "s" + Date.now(), name: nSN.trim(), emoji: nSE, dose: nSD.trim() || "—", freq: nSF, cue: nSCue.trim() || null }]);
            setSN(""); setSD(""); setSCue(""); setShowCustomSupp(false);
          }}>+ añadir</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ padding: "8px 20px" }}>atrás</button>
        <button className="btn btn-ghost" onClick={() => setStep(3)} style={{ padding: "8px 20px" }}>saltar</button>
        <button className="btn btn-cyan" onClick={() => setStep(3)} style={{ padding: "8px 24px" }}>siguiente</button>
      </div>
    </div>
  );

  // Step 3: Training types
  if (step === 3) return wrap(
    <div>
      <div className="section-label" style={{ textAlign: "center", marginBottom: 12 }}>// tipos de entreno</div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 16 }}>selecciona o añade tus actividades</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {SUGG_TRAINING.map(t => {
          const sel = trains.find(x => x.name === t.name);
          return (
            <div key={t.name} onClick={() => toggleSugg(t, trains, setTrains)}
              className={sel ? "pill pill-done" : "pill pill-off"}
              style={{ fontSize: 11 }}>
              {t.emoji} {t.name}
            </div>
          );
        })}
      </div>

      {trains.filter(t => !SUGG_TRAINING.find(sg => sg.name === t.name)).map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: `0.5px solid ${C.border}` }}>
          <span style={{ fontSize: 11 }}>
            {t.emoji} {t.name}
            {t.cue && <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>· {t.cue}</div>}
          </span>
          <button className="btn btn-danger" style={{ fontSize: 9, padding: "2px 8px" }}
            onClick={() => setTrains(trains.filter(x => x.id !== t.id))}>✕</button>
        </div>
      ))}

      {!showCustomTrain ? (
        <div onClick={() => setShowCustomTrain(true)}
          style={{ fontSize: 11, color: C.muted, cursor: "pointer", textAlign: "center", marginTop: 8, padding: 6 }}>
          + añadir otro
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <select value={nTE} onChange={e => setTE(e.target.value)} style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
              {TRAIN_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" value={nTN} onChange={e => setTN(e.target.value)} placeholder="tipo" style={{ flex: 1 }} />
          </div>
          <input type="text" value={nTCue} onChange={e => setTCue(e.target.value)}
            placeholder="cuándo lo harás? (opcional, los lunes al salir del trabajo...)"
            style={{ width: "100%", boxSizing: "border-box", fontSize: 11, marginTop: 4 }} />
          <button className="btn btn-cyan" style={{ padding: "6px 10px", marginTop: 6, width: "100%" }} onClick={() => {
            if (!nTN.trim()) return;
            setTrains([...trains, { id: "t" + Date.now(), name: nTN.trim(), emoji: nTE, cue: nTCue.trim() || null }]);
            setTN(""); setTCue(""); setShowCustomTrain(false);
          }}>+ añadir</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => setStep(2)} style={{ padding: "8px 20px" }}>atrás</button>
        <button className="btn btn-ghost" onClick={finish} style={{ padding: "8px 20px" }}>saltar</button>
        <button className="btn btn-cyan" onClick={finish} style={{ padding: "8px 24px" }}>completar</button>
      </div>
    </div>
  );
}
