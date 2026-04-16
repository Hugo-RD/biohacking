import { useState, useEffect, useCallback } from "react";
import { C, TODAY, DEFAULT_STATE, BADGES } from "./constants";
import * as storage from "./storage";
import * as utils from "./utils";
import Header from "./components/Header";
import Nav from "./components/Nav";
import Home from "./views/Home";
import Stats from "./views/Stats";
import Config from "./views/Config";

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [badgePop, setBadgePop] = useState(null);

  // Load state
  useEffect(() => {
    const saved = storage.load();
    if (saved) {
      if (!saved.trainingTypes) saved.trainingTypes = DEFAULT_STATE.trainingTypes;
      if (!saved.unlockedBadges) saved.unlockedBadges = [];
      saved.supplements = saved.supplements.map(s => ({ ...s, freq: s.freq || "daily" }));
      setState(saved);
    } else {
      setState(DEFAULT_STATE);
    }
    setLoading(false);
  }, []);

  // Save with badge checking
  const save = useCallback((s) => {
    const nb = [];
    for (const b of BADGES) {
      if (!s.unlockedBadges.includes(b.id) && b.check(s, utils)) {
        s.unlockedBadges = [...s.unlockedBadges, b.id];
        nb.push(b);
      }
    }
    setState(s);
    storage.save(s);
    if (nb.length) {
      setBadgePop(nb[0]);
      setTimeout(() => setBadgePop(null), 2500);
    }
  }, []);

  // Actions
  const toggleSupp = useCallback((sid) => {
    const t = TODAY();
    const ns = JSON.parse(JSON.stringify(state));
    if (!ns.logs[t]) ns.logs[t] = {};
    if (!ns.logs[t].supplements) ns.logs[t].supplements = {};
    ns.logs[t].supplements[sid] = !ns.logs[t].supplements[sid];
    save(ns);
  }, [state, save]);

  const doTrain = useCallback((trainId, trainInt) => {
    const t = TODAY();
    const ns = JSON.parse(JSON.stringify(state));
    if (!ns.logs[t]) ns.logs[t] = {};
    if (ns.logs[t].training?.done) return;
    const tt = ns.trainingTypes.find(x => x.id === trainId) || ns.trainingTypes[0];
    ns.logs[t].training = { done: true, type: tt?.name || "Gym", emoji: tt?.emoji || "🏋️", intensity: trainInt };
    save(ns);
  }, [state, save]);

  const doSleep = useCallback((hours, quality) => {
    const t = TODAY();
    const ns = JSON.parse(JSON.stringify(state));
    if (!ns.logs[t]) ns.logs[t] = {};
    if (ns.logs[t].sleep?.hours) return;
    ns.logs[t].sleep = { hours, quality };
    save(ns);
  }, [state, save]);

  const reset = useCallback(() => {
    storage.reset();
    setState(DEFAULT_STATE);
    setView("home");
  }, []);

  if (loading || !state) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.cyan, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
        cargando...
      </div>
    );
  }

  const today = TODAY(), tl = state.logs[today] || {};
  const dailySupps = state.supplements.filter(s => s.freq !== "conditional");
  const trainDone = tl.training?.done;
  const sleepDone = !!tl.sleep?.hours;
  const dsDone = dailySupps.filter(s => tl.supplements?.[s.id]).length;
  const suppsDone = dsDone === dailySupps.length && dailySupps.length > 0;
  const complete = trainDone && sleepDone && suppsDone;

  const trainCons = utils.getCons(state, "training");
  const sleepCons = utils.getCons(state, "sleep");
  const suppCons = utils.getSuppCons(state);
  const overall = Math.round((trainCons + sleepCons + suppCons) / 3);

  let status = "empezando";
  if (overall >= 80) status = "en racha";
  else if (overall >= 60) status = "consistente";
  else if (overall >= 40) status = "construyendo";
  else if (Object.keys(state.logs).length > 0) status = "en progreso";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 480, margin: "0 auto", position: "relative" }}>
      {/* Badge popup */}
      {badgePop && (
        <div style={{
          position: "fixed", top: "18%", left: "50%", transform: "translateX(-50%)", zIndex: 999,
          animation: "badgeIn 0.5s ease", pointerEvents: "none", textAlign: "center",
          background: C.bg, border: `0.5px solid ${C.amber}`, borderRadius: 12, padding: "14px 22px",
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{badgePop.emoji}</div>
          <div className="mono" style={{ fontSize: 8, color: C.amber, letterSpacing: 1.5 }}>LOGRO DESBLOQUEADO</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{badgePop.name}</div>
        </div>
      )}

      <Header name={state.profile.name} status={status} trainDone={trainDone} sleepDone={sleepDone} suppsDone={suppsDone} complete={complete} />

      <div style={{ padding: "0 14px 74px", animation: "slideUp 0.3s ease" }}>
        {view === "home" && <Home state={state} onToggleSupp={toggleSupp} onTrain={doTrain} onSleep={doSleep} />}
        {view === "stats" && <Stats state={state} />}
        {view === "config" && <Config state={state} onSave={save} onReset={reset} />}
      </div>

      <Nav view={view} setView={setView} />
    </div>
  );
}
