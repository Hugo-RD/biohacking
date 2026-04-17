import { useState } from "react";
import { C, TODAY } from "../constants";

export default function QuickLog({ state, onToggleSupp, onTrain, onSleep }) {
  const [showTrain, setShowTrain] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const [trainId, setTrainId] = useState(state.trainingTypes[0]?.id);
  const [trainInt, setTrainInt] = useState(3);
  const [sleepH, setSleepH] = useState(7);
  const [sleepQ, setSleepQ] = useState(3);

  const tl = state.logs[TODAY()] || {};
  const dailySupps = state.supplements.filter(s => !s.archivedAt && s.freq !== "conditional");
  const condSupps = state.supplements.filter(s => !s.archivedAt && s.freq === "conditional");
  const dsDone = dailySupps.filter(s => tl.supplements?.[s.id]).length;
  const trainDone = tl.training?.done;
  const sleepDone = !!tl.sleep?.hours;
  const complete = trainDone && sleepDone && dsDone === dailySupps.length && dailySupps.length > 0;

  // Implementation Intention reminders — cues of pending habits (Gollwitzer effect)
  const pendingCues = [
    ...dailySupps.filter(s => s.cue && !tl.supplements?.[s.id]).map(s => ({ emoji: s.emoji, name: s.name, cue: s.cue })),
    ...condSupps.filter(s => s.cue && !tl.supplements?.[s.id]).map(s => ({ emoji: s.emoji, name: s.name, cue: s.cue })),
  ];

  return (
    <div className="card">
      {/* Implementation Intention reminders (Gollwitzer, d=0.65) — collapsed by default */}
      {pendingCues.length > 0 && (
        <div style={{ marginBottom: showCues ? 10 : 8, paddingBottom: showCues ? 8 : 0, borderBottom: showCues ? `0.5px solid ${C.border}` : "none" }}>
          <div onClick={() => setShowCues(!showCues)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.muted }}>
            <span>🔔</span>
            <span>{pendingCues.length} {pendingCues.length === 1 ? "recordatorio" : "recordatorios"}</span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: 9, color: C.dim }}>{showCues ? "▲" : "▼"}</span>
          </div>
          {showCues && (
            <div style={{ marginTop: 6 }}>
              {pendingCues.map((p, i) => (
                <div key={i} style={{ fontSize: 10, color: C.muted, lineHeight: 1.6, paddingLeft: 4 }}>
                  <span style={{ marginRight: 4 }}>{p.emoji}</span>
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span style={{ color: C.dim }}> — {p.cue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily supplements */}
      {dailySupps.length > 0 && <>
        <div className="mono" style={{ fontSize: 10, color: C.dim, marginBottom: 6 }}>diario ({dsDone}/{dailySupps.length})</div>
        <div style={{ marginBottom: condSupps.length ? 6 : 0 }}>
          {dailySupps.map(s => {
            const done = !!tl.supplements?.[s.id];
            return <span key={s.id} className={`pill ${done ? "pill-done" : "pill-off"}`} onClick={() => onToggleSupp(s.id)}>
              {done ? <span className="mono" style={{ fontSize: 10 }}>✓</span> : <span style={{ fontSize: 12 }}>{s.emoji}</span>}
              <span style={{ fontWeight: done ? 600 : 400 }}>{s.name}</span>
            </span>;
          })}
        </div>
      </>}

      {/* Conditional supplements */}
      {condSupps.length > 0 && <>
        <div className="mono" style={{ fontSize: 10, color: C.dim, marginBottom: 6, marginTop: dailySupps.length ? 4 : 0 }}>condicional</div>
        <div>
          {condSupps.map(s => {
            const done = !!tl.supplements?.[s.id];
            return <span key={s.id} className={`pill ${done ? "pill-done" : "pill-off"} pill-cond`} onClick={() => onToggleSupp(s.id)}>
              {done ? <span className="mono" style={{ fontSize: 10 }}>✓</span> : <span style={{ fontSize: 12 }}>{s.emoji}</span>}
              <span style={{ fontWeight: done ? 600 : 400 }}>{s.name}</span>
            </span>;
          })}
        </div>
      </>}

      {!state.supplements.length && <div style={{ fontSize: 10, color: C.dim, padding: "4px 0" }}>configura supps en ⚙️</div>}

      {/* Training */}
      <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 6, marginTop: 8 }}>
        {trainDone ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            <span style={{ fontSize: 15 }}>{tl.training.emoji}</span>
            <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>{tl.training.type}</span>
            <span style={{ fontSize: 10, color: C.dim }}>intensidad {tl.training.intensity}/5</span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: C.green }}>✓</span>
          </div>
        ) : (<>
          <div className="expand-row" onClick={() => setShowTrain(!showTrain)}>
            <span style={{ fontSize: 15 }}>🏋️</span>
            <span className="expand-label">registrar entreno</span>
            <span className="expand-arrow">{showTrain ? "▲" : "▼"}</span>
          </div>
          {showTrain && (
            <div style={{ paddingTop: 8 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {state.trainingTypes.filter(t => !t.archivedAt).map(t =>
                  <button key={t.id} className={`btn btn-ghost ${trainId === t.id ? "active" : ""}`}
                    style={{ fontSize: 11, padding: "5px 9px" }} onClick={() => setTrainId(t.id)}>
                    {t.emoji} {t.name}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10, color: C.dim }}>int:</span>
                {[1, 2, 3, 4, 5].map(n =>
                  <div key={n} onClick={() => setTrainInt(n)} style={{
                    width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    background: n <= trainInt ? "rgba(0,255,136,0.08)" : "transparent",
                    border: `0.5px solid ${n <= trainInt ? "rgba(0,255,136,0.3)" : C.border}`,
                    cursor: "pointer", fontWeight: 600, fontSize: 12, color: n <= trainInt ? C.green : C.dim,
                    fontFamily: "'Space Mono', monospace",
                  }}>{n}</div>
                )}
              </div>
              <button className="btn btn-green" style={{ width: "100%" }}
                onClick={() => { onTrain(trainId, trainInt); setShowTrain(false); }}>
                registrar entreno
              </button>
            </div>
          )}
        </>)}
      </div>

      {/* Sleep */}
      <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 6 }}>
        {sleepDone ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            <span style={{ fontSize: 15 }}>🌙</span>
            <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>{tl.sleep.hours}h</span>
            <span style={{ fontSize: 10, color: C.dim }}>{"⭐".repeat(tl.sleep.quality)}</span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: C.purple }}>✓</span>
          </div>
        ) : (<>
          <div className="expand-row" onClick={() => setShowSleep(!showSleep)}>
            <span style={{ fontSize: 15 }}>😴</span>
            <span className="expand-label">registrar sueño</span>
            <span className="expand-arrow">{showSleep ? "▲" : "▼"}</span>
          </div>
          {showSleep && (
            <div style={{ paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim, marginBottom: 4 }}>
                <span>horas</span><span className="mono" style={{ color: C.purple, fontWeight: 600 }}>{sleepH}h</span>
              </div>
              <input type="range" min={3} max={12} step={0.5} value={sleepH}
                onChange={e => setSleepH(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: C.purple, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 8, justifyContent: "center" }}>
                {["😵", "😐", "🙂", "😊", "🤩"].map((e, i) =>
                  <div key={i} onClick={() => setSleepQ(i + 1)} style={{
                    width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, cursor: "pointer",
                    background: sleepQ === i + 1 ? "rgba(123,104,238,0.1)" : "transparent",
                    border: `0.5px solid ${sleepQ === i + 1 ? "rgba(123,104,238,0.4)" : C.border}`,
                  }}>{e}</div>
                )}
              </div>
              <button className="btn btn-purple" style={{ width: "100%" }}
                onClick={() => { onSleep(sleepH, sleepQ); setShowSleep(false); }}>
                registrar sueño
              </button>
            </div>
          )}
        </>)}
      </div>

      {complete && (
        <div className="mono" style={{
          fontSize: 8, color: C.green, textAlign: "center", letterSpacing: 1.5,
          background: "linear-gradient(90deg,transparent,rgba(0,255,136,0.04),transparent)",
          backgroundSize: "200% 100%", animation: "shimmer 3s infinite",
          padding: 6, borderRadius: 6, marginTop: 8, border: "0.5px solid rgba(0,255,136,0.1)",
        }}>★ DÍA COMPLETADO ★</div>
      )}
    </div>
  );
}
