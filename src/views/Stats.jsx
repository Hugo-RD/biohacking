import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { C, TODAY, BADGES } from "../constants";
import { getCorrelations, cntTotal } from "../utils";
import WeeklySummary from "../components/WeeklySummary";

export default function Stats({ state }) {
  const correlations = useMemo(() => getCorrelations(state), [state]);

  const trainData = useMemo(() => {
    const data = [], d = new Date(), ds = new Date(d);
    ds.setDate(ds.getDate() - (ds.getDay() === 0 ? 6 : ds.getDay() - 1));
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(ds); ws.setDate(ws.getDate() - w * 7);
      let c = 0;
      for (let i = 0; i < 7; i++) {
        const wd = new Date(ws); wd.setDate(wd.getDate() + i);
        if (state.logs[wd.toISOString().split("T")[0]]?.training?.done) c++;
      }
      data.push({ week: `S${4 - w}`, s: c });
    }
    return data;
  }, [state]);

  const sleepData = useMemo(() => {
    const data = [], d = new Date(); d.setDate(d.getDate() - 13);
    for (let i = 0; i < 14; i++) {
      const k = d.toISOString().split("T")[0];
      data.push({ d: k.slice(5), h: state.logs[k]?.sleep?.hours || 0 });
      d.setDate(d.getDate() + 1);
    }
    return data;
  }, [state]);

  const tt = { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.text };

  return (
    <>
      <div className="section-label">// informe semanal</div>
      <WeeklySummary state={state} />

      <div className="section-label">// insights</div>
      <div className="card">
        {correlations.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: i > 0 ? "8px 0 0" : 0 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{c.icon}</span>
            <p style={{ fontSize: 11, color: C.text, lineHeight: 1.5, margin: 0 }}>{c.text}</p>
          </div>
        ))}
      </div>

      <div className="section-label">// entrenos / semana</div>
      <div className="card">
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={trainData}>
            <XAxis dataKey="week" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 7]} tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="s" fill={C.cyan} radius={[3, 3, 0, 0]} name="Sesiones" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="section-label">// sueño · 14 días</div>
      <div className="card">
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={sleepData}>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="d" tick={{ fill: C.dim, fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 12]} tick={{ fill: C.dim, fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
            <Tooltip contentStyle={tt} />
            <Area type="monotone" dataKey="h" stroke={C.purple} fill="url(#sg)" strokeWidth={2} name="Horas" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="section-label">// hitos</div>
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[{ l: "Días", v: Object.keys(state.logs).length, c: C.amber },
            { l: "Entrenos", v: cntTotal(state.logs, "training"), c: C.green },
            { l: "Logros", v: `${state.unlockedBadges.length}/${BADGES.length}`, c: C.magenta }]
            .map((x, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 8, padding: 10, textAlign: "center", border: `0.5px solid ${C.border}` }}>
                <div className="mono" style={{ fontSize: 18, color: x.c }}>{x.v}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{x.l}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="section-label">// logros</div>
      <div className="card" style={{ padding: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {BADGES.map(b => {
            const u = state.unlockedBadges.includes(b.id);
            return (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8,
                background: u ? "rgba(255,184,0,0.03)" : "transparent",
                border: `0.5px solid ${u ? "rgba(255,184,0,0.1)" : C.border}`, opacity: u ? 1 : 0.35,
              }}>
                <span style={{ fontSize: 18, filter: u ? "none" : "grayscale(1)" }}>{b.emoji}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: u ? C.amber : C.dim }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: C.dim }}>{b.desc}</div>
                </div>
                {u && <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: C.green }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
