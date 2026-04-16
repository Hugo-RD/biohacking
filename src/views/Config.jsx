import { useState } from "react";
import { C } from "../constants";

export default function Config({ state, onSave, onReset }) {
  const [nSN, setSN] = useState("");
  const [nSD, setSD] = useState("");
  const [nSE, setSE] = useState("💊");
  const [nSF, setSF] = useState("daily");
  const [nTN, setTN] = useState("");
  const [nTE, setTE] = useState("🏋️");

  const update = (fn) => {
    const ns = JSON.parse(JSON.stringify(state));
    fn(ns);
    onSave(ns);
  };

  return (
    <>
      <div className="section-label">// perfil</div>
      <div className="card">
        <input type="text" value={state.profile.name}
          onChange={e => update(ns => { ns.profile.name = e.target.value; })}
          style={{ width: "100%", boxSizing: "border-box" }} placeholder="tu nombre" />
      </div>

      <div className="section-label">// suplementos</div>
      <div className="card">
        {state.supplements.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 11, flex: 1 }}>{s.emoji} {s.name} <span style={{ color: C.dim }}>— {s.dose}</span></span>
            <span className="freq-tag"
              onClick={() => update(ns => {
                const idx = ns.supplements.findIndex(x => x.id === s.id);
                ns.supplements[idx].freq = ns.supplements[idx].freq === "conditional" ? "daily" : "conditional";
              })}
              style={{
                cursor: "pointer",
                background: s.freq === "conditional" ? "rgba(255,184,0,0.06)" : "rgba(0,240,255,0.06)",
                color: s.freq === "conditional" ? C.amber : C.cyan,
                border: `0.5px solid ${s.freq === "conditional" ? "rgba(255,184,0,0.15)" : "rgba(0,240,255,0.15)"}`,
              }}>
              {s.freq === "conditional" ? "condicional" : "diario"}
            </span>
            <button className="btn btn-danger" style={{ fontSize: 9, padding: "2px 8px" }}
              onClick={() => update(ns => { ns.supplements = ns.supplements.filter(x => x.id !== s.id); })}>✕</button>
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
          <button className="btn btn-cyan" style={{ padding: "6px 10px" }} onClick={() => {
            if (!nSN.trim()) return;
            update(ns => { ns.supplements.push({ id: "s" + Date.now(), name: nSN.trim(), emoji: nSE, dose: nSD.trim() || "—", freq: nSF }); });
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
              onClick={() => update(ns => { ns.trainingTypes = ns.trainingTypes.filter(x => x.id !== t.id); })}>✕</button>
          </div>
        ))}
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          <select value={nTE} onChange={e => setTE(e.target.value)} style={{ width: 42, textAlign: "center", fontSize: 14, padding: 3 }}>
            {["🏋️", "🏊", "⚽", "🏀", "🚴", "🏃", "🧘", "🥊", "🎾", "🧗", "🏓", "🤸", "🥋", "🚣"].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="text" value={nTN} onChange={e => setTN(e.target.value)} placeholder="tipo" style={{ flex: 1 }} />
          <button className="btn btn-cyan" style={{ padding: "6px 10px" }} onClick={() => {
            if (!nTN.trim()) return;
            update(ns => { ns.trainingTypes.push({ id: "t" + Date.now(), name: nTN.trim(), emoji: nTE }); });
            setTN("");
          }}>+</button>
        </div>
      </div>

      <div className="section-label">// zona peligrosa</div>
      <div className="card" style={{ borderColor: "rgba(255,0,80,0.15)" }}>
        <button className="btn btn-danger" onClick={onReset} style={{ width: "100%" }}>resetear datos</button>
      </div>
    </>
  );
}
