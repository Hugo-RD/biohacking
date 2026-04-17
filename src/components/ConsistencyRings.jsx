import { useState } from "react";
import { C } from "../constants";
import { getCons, getSuppCons, getStreak, cntTotal } from "../utils";
import Ring from "./Ring";

export default function ConsistencyRings({ state }) {
  const [expanded, setExpanded] = useState(false);
  const dailySupps = state.supplements.filter(s => !s.archivedAt && s.freq !== "conditional");
  const condSupps = state.supplements.filter(s => !s.archivedAt && s.freq === "conditional");

  const items = [
    { label: "Entreno", emoji: "🏋️", color: C.green, pct: getCons(state, "training"), total: cntTotal(state.logs, "training"), unit: "entrenos", sk: getStreak(state.logs, "training") },
    { label: "Sueño", emoji: "😴", color: C.purple, pct: getCons(state, "sleep"), total: cntTotal(state.logs, "sleep"), unit: "noches", sk: getStreak(state.logs, "sleep") },
    { label: "Suplementos", emoji: "💊", color: C.cyan, pct: getSuppCons(state), isSuppGroup: true },
  ];

  return (
    <div className="card">
      {items.map((item, i) => (
        <div key={i}>
          <div onClick={item.isSuppGroup ? () => setExpanded(!expanded) : undefined}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: i < 2 || expanded ? `0.5px solid ${C.border}` : "none",
              cursor: item.isSuppGroup ? "pointer" : "default" }}>
            <div style={{ position: "relative" }}>
              <Ring pct={item.pct} color={item.color} />
              <div className="mono" style={{ position: "absolute", top: 0, left: 0, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: item.color }}>{item.pct}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{item.emoji} {item.label}</div>
              {item.total != null && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.total} {item.unit} en total</div>}
              {item.isSuppGroup && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{dailySupps.length} diarios · {condSupps.length} condicionales</div>}
            </div>
            {item.sk != null && <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 9, color: C.dim }}>racha</div>
              <div className="mono" style={{ fontSize: 13, color: item.sk > 0 ? C.muted : C.dim }}>{item.sk}d</div>
            </div>}
            {item.isSuppGroup && <span className="mono" style={{ fontSize: 9, color: C.dim }}>{expanded ? "▲" : "▼"}</span>}
          </div>

          {item.isSuppGroup && expanded && (
            <div style={{ paddingLeft: 12, paddingBottom: 8 }}>
              {dailySupps.map(s => {
                const pct = getCons(state, "supplement", 30, s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: pct >= 70 ? C.cyan : pct >= 40 ? C.amber : C.magenta }} />
                    <span style={{ fontSize: 11, flex: 1 }}>{s.emoji} {s.name}</span>
                    <span className="freq-tag" style={{ background: "rgba(0,240,255,0.06)", color: C.cyan, border: "0.5px solid rgba(0,240,255,0.15)" }}>diario</span>
                    <span className="mono" style={{ fontSize: 11, color: C.cyan, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
              {condSupps.map(s => {
                const total = cntTotal(state.logs, "supplement", s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: C.dim }} />
                    <span style={{ fontSize: 11, flex: 1 }}>{s.emoji} {s.name}</span>
                    <span className="freq-tag" style={{ background: "rgba(255,184,0,0.06)", color: C.amber, border: "0.5px solid rgba(255,184,0,0.15)" }}>cuando toca</span>
                    <span className="mono" style={{ fontSize: 11, color: C.muted, minWidth: 32, textAlign: "right" }}>{total}x</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
