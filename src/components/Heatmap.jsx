import { C, TODAY } from "../constants";
import { getDayScore } from "../utils";

const RAMP = ["#111118", "#0a2a2a", "#0d3d3d", "#115555", "#1a7070", "#209090", "#28b0b0", "#00d4d4"];

export default function Heatmap({ logs, supps }) {
  const weeks = 13, todayStr = TODAY(), d = new Date();
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow - (weeks - 1) * 7);
  const cols = [];

  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let day = 0; day < 7; day++) {
      const k = d.toISOString().split("T")[0], future = k > todayStr;
      const score = future ? -1 : getDayScore(logs[k], supps);
      const isToday = k === todayStr;
      let bg = RAMP[0];
      if (!future && score > 0) bg = RAMP[Math.min(Math.ceil(score * 7), 7)];
      if (future) bg = "transparent";

      const log = logs[k];
      let tip = k;
      if (log && !future) {
        const p = [];
        const sd = log.supplements ? Object.values(log.supplements).filter(Boolean).length : 0;
        if (sd > 0) p.push(`${sd} supps`);
        if (log.training?.done) p.push(log.training.type);
        if (log.sleep?.hours) p.push(`${log.sleep.hours}h`);
        tip = p.length ? `${k} · ${p.join(" · ")}` : k;
      }
      cells.push(
        <div key={k} title={tip} style={{
          width: 14, height: 14, borderRadius: 2, background: bg,
          border: isToday ? `1.5px solid ${C.cyan}` : future ? "none" : `0.5px solid ${C.border}`,
        }} />
      );
      d.setDate(d.getDate() + 1);
    }
    cols.push(<div key={w} style={{ display: "flex", flexDirection: "column", gap: 2 }}>{cells}</div>);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>{cols}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5, alignItems: "center", gap: 3, fontSize: 7, color: C.dim }}>
        <span>menos</span>
        {RAMP.slice(0, 6).map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, border: `0.5px solid ${C.border}` }} />)}
        <span>más</span>
      </div>
    </div>
  );
}
