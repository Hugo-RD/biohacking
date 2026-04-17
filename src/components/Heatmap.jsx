import { C, TODAY } from "../constants";
import { getDayScore, getDayType } from "../utils";

// Empty cell color (index 0) pumped from #111118 to #1e1e2e for better contrast vs card bg (#0e0e1a)
const RAMP_CYAN = ["#1e1e2e", "#0a1e2e", "#0d3050", "#115570", "#1a7090", "#2090b0", "#28b0d0", "#00f0ff"];
const RAMP_GREEN = ["#1e1e2e", "#0a2e1a", "#0d4028", "#115538", "#1a7050", "#209060", "#28b070", "#00ff88"];
const RAMP_PURPLE = ["#1e1e2e", "#150e2e", "#1e1545", "#2a1e5e", "#3a2878", "#4a3890", "#5a48a8", "#7b68ee"];

function getRamp(dayType) {
  if (dayType === "training") return RAMP_CYAN;
  if (dayType === "supplements") return RAMP_GREEN;
  if (dayType === "sleep") return RAMP_PURPLE;
  return RAMP_CYAN;
}

export default function Heatmap({ logs, supps }) {
  const weeks = 13, todayStr = TODAY(), d = new Date();
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow - (weeks - 1) * 7);
  const cells = [];

  // Generate cells in column-major order (each column = a week, 7 rows = days)
  for (let w = 0; w < weeks; w++) {
    for (let day = 0; day < 7; day++) {
      const k = d.toISOString().split("T")[0], future = k > todayStr;
      const score = future ? -1 : getDayScore(logs[k], supps);
      const dayType = getDayType(logs[k]);
      const ramp = getRamp(dayType);
      const isToday = k === todayStr;
      let bg = ramp[0];
      if (!future && score > 0) bg = ramp[Math.min(Math.ceil(score * 7), 7)];
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
          aspectRatio: "1 / 1",
          borderRadius: 3, background: bg,
          border: isToday ? `1.5px solid ${C.cyan}` : future ? "none" : `0.5px solid ${C.border}`,
        }} />
      );
      d.setDate(d.getDate() + 1);
    }
  }

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${weeks}, 1fr)`,
        gridTemplateRows: "repeat(7, 1fr)",
        gridAutoFlow: "column",
        gap: 3,
        width: "100%",
      }}>
        {cells}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, alignItems: "center", gap: 10, fontSize: 9, color: C.dim }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 9, height: 9, borderRadius: 2, background: RAMP_CYAN[6] }} />entreno
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 9, height: 9, borderRadius: 2, background: RAMP_GREEN[6] }} />supps
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 9, height: 9, borderRadius: 2, background: RAMP_PURPLE[6] }} />sleep
        </span>
      </div>
    </div>
  );
}
