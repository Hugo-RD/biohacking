import { TODAY, WDAYS } from "./constants";

// Grace-period streak: allows 1 miss without breaking
export function getStreak(logs, type, sid) {
  let s = 0, grace = 1, d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = d.toISOString().split("T")[0], log = logs[k];
    let ok = false;
    if (type === "supplement" && log?.supplements?.[sid]) ok = true;
    if (type === "training" && log?.training?.done) ok = true;
    if (type === "sleep" && log?.sleep?.hours) ok = true;
    if (ok) { s++; grace = 1; }
    else if (i > 0) { if (grace > 0) grace--; else break; }
    d.setDate(d.getDate() - 1);
  }
  return s;
}

export function cntTotal(logs, type, sid) {
  return Object.values(logs).filter(l => {
    if (type === "training") return l.training?.done;
    if (type === "sleep") return !!l.sleep?.hours;
    if (type === "supplement") return !!l.supplements?.[sid];
    return false;
  }).length;
}

export function getCons(state, type, days = 30, sid) {
  let done = 0, d = new Date();
  for (let i = 0; i < days; i++) {
    const k = d.toISOString().split("T")[0], log = state.logs[k];
    if (type === "training" && log?.training?.done) done++;
    else if (type === "sleep" && log?.sleep?.hours) done++;
    else if (type === "supplement" && log?.supplements?.[sid]) done++;
    d.setDate(d.getDate() - 1);
  }
  return Math.round((done / days) * 100);
}

export function getSuppCons(state, days = 30) {
  const daily = state.supplements.filter(s => !s.archivedAt && s.freq !== "conditional");
  if (!daily.length) return 0;
  let done = 0, d = new Date();
  for (let i = 0; i < days; i++) {
    const k = d.toISOString().split("T")[0], log = state.logs[k];
    if (daily.every(s => log?.supplements?.[s.id])) done++;
    d.setDate(d.getDate() - 1);
  }
  return Math.round((done / days) * 100);
}

export function getDayScore(log, supps) {
  if (!log) return 0;
  const daily = supps.filter(s => !s.archivedAt && s.freq !== "conditional");
  let s = 0, t = daily.length + 2;
  s += daily.filter(sp => log.supplements?.[sp.id]).length;
  if (log.training?.done) s++;
  if (log.sleep?.hours) s++;
  return t > 0 ? s / t : 0;
}

export function hasPerfect(state) {
  const daily = state.supplements.filter(s => !s.archivedAt && s.freq !== "conditional");
  return Object.values(state.logs).some(log => {
    if (!log.training?.done || !log.sleep?.hours) return false;
    return daily.length > 0 && daily.every(s => log.supplements?.[s.id]);
  });
}

export function hasPerfectWeek(state) {
  const daily = state.supplements.filter(s => !s.archivedAt && s.freq !== "conditional");
  const days = Object.keys(state.logs).sort();
  let c = 0, prev = null;
  for (const day of days) {
    const log = state.logs[day];
    const p = log.training?.done && log.sleep?.hours && daily.length > 0 && daily.every(s => log.supplements?.[s.id]);
    if (p) {
      if (prev && (new Date(day) - new Date(prev)) / 86400000 === 1) c++; else c = 1;
      if (c >= 7) return true;
    } else c = 0;
    prev = day;
  }
  return false;
}

export function getCorrelations(state) {
  const ins = [], logs = state.logs, days = Object.keys(logs).sort();

  // Sleep quality → next day training
  let sgT = 0, sgN = 0, sbT = 0, sbN = 0;
  for (let i = 0; i < days.length - 1; i++) {
    const log = logs[days[i]], next = logs[days[i + 1]];
    if (!log?.sleep?.hours) continue;
    const nd = new Date(days[i]); nd.setDate(nd.getDate() + 1);
    if (nd.toISOString().split("T")[0] !== days[i + 1]) continue;
    if (log.sleep.hours >= 7.5) { sgN++; if (next?.training?.done) sgT++; }
    else { sbN++; if (next?.training?.done) sbT++; }
  }
  if (sgN >= 3 && sbN >= 2) {
    const gp = Math.round((sgT / sgN) * 100), bp = Math.round((sbT / sbN) * 100);
    if (gp - bp > 15) ins.push({ icon: "😴→🏋️", text: `Cuando duermes 7.5h+, entrenas al día siguiente el ${gp}% de las veces (vs ${bp}% si duermes menos)` });
  }

  // Training → sleep quality
  let tsQ = 0, tsN = 0, nsQ = 0, nsN = 0;
  for (let i = 0; i < days.length - 1; i++) {
    const log = logs[days[i]], next = logs[days[i + 1]];
    const nd = new Date(days[i]); nd.setDate(nd.getDate() + 1);
    if (nd.toISOString().split("T")[0] !== days[i + 1]) continue;
    if (!next?.sleep?.quality) continue;
    if (log?.training?.done) { tsQ += next.sleep.quality; tsN++; }
    else { nsQ += next.sleep.quality; nsN++; }
  }
  if (tsN >= 3 && nsN >= 2) {
    const ta = (tsQ / tsN).toFixed(1), na = (nsQ / nsN).toFixed(1);
    if (parseFloat(ta) - parseFloat(na) > 0.3) ins.push({ icon: "🏋️→😴", text: `Los días que entrenas, tu calidad de sueño es ${ta}/5 (vs ${na}/5 sin entreno)` });
  }

  if (!ins.length && days.length >= 5) ins.push({ icon: "📊", text: "Sigue registrando para desbloquear insights" });
  return ins;
}

export function getDayType(log) {
  if (!log) return null;
  if (log.training?.done) return "training";
  if (log.supplements && Object.values(log.supplements).some(Boolean)) return "supplements";
  if (log.sleep?.hours) return "sleep";
  return null;
}

export function getWeekStats(state) {
  const today = new Date(), dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const mon = new Date(today); mon.setDate(mon.getDate() - dow);
  let ts = 0, dl = 0, bestDay = null, bestScore = 0, perfect = 0;
  const daily = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(d.getDate() + i);
    const k = d.toISOString().split("T")[0];
    if (k > TODAY()) break;
    const log = state.logs[k], score = getDayScore(log, state.supplements);
    daily.push({ day: WDAYS[i], score: Math.round(score * 100) });
    if (log && (log.training?.done || log.sleep?.hours || (log.supplements && Object.values(log.supplements).some(Boolean)))) {
      dl++; ts += score;
      if (score > bestScore) { bestScore = score; bestDay = WDAYS[i]; }
      if (score >= 1) perfect++;
    }
  }
  const avg = dl > 0 ? Math.round((ts / dl) * 100) : 0;
  let title = "semana en progreso";
  if (avg >= 95) title = "semana legendaria";
  else if (avg >= 80) title = "semana del guerrero";
  else if (avg >= 60) title = "semana sólida";
  else if (avg >= 40) title = "semana del superviviente";
  else if (dl > 0) title = "semana de recuperación";
  return { avg, dl, bestDay, bestScore: Math.round(bestScore * 100), perfect, title, daily };
}
