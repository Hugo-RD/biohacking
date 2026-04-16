import { C } from "../constants";
import { getWeekStats } from "../utils";

export default function WeeklySummary({ state }) {
  const ws = getWeekStats(state);
  return (
    <div className="card">
      <div className="mono" style={{ fontSize: 8, color: C.purple, letterSpacing: 1.5, marginBottom: 6 }}>// INFORME SEMANAL</div>
      <div className="mono" style={{ fontSize: 12, color: C.amber, marginBottom: 12 }}>{ws.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[{ v: ws.avg + "%", l: "completitud", c: ws.avg >= 80 ? C.green : ws.avg >= 50 ? C.amber : C.magenta },
          { v: ws.dl, l: "días activos", c: C.cyan },
          { v: ws.perfect, l: "perfectos", c: C.amber }]
          .map((x, i) => <div key={i} style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: x.c }}>{x.v}</div>
            <div style={{ fontSize: 8, color: C.muted }}>{x.l}</div>
          </div>)}
      </div>
      {ws.bestDay && <div style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>
        mejor día: <span style={{ color: C.green, fontWeight: 600 }}>{ws.bestDay}</span> ({ws.bestScore}%)
      </div>}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginTop: 12, height: 36 }}>
        {ws.daily.map((d, i) => <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: 24, height: Math.max(2, d.score * 0.32), borderRadius: 2,
            background: d.score >= 100 ? C.cyan : d.score >= 50 ? "rgba(0,240,255,0.4)" : d.score > 0 ? "rgba(0,240,255,0.15)" : C.card,
            border: `0.5px solid ${C.border}` }} />
          <div className="mono" style={{ fontSize: 7, color: C.dim }}>{d.day}</div>
        </div>)}
      </div>
    </div>
  );
}
