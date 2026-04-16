import { useState, useEffect, useCallback } from "react";
import { C, TODAY, DEFAULT_STATE, BADGES } from "./constants";
import * as storage from "./storage";
import * as utils from "./utils";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import Nav from "./components/Nav";
import Onboarding from "./components/Onboarding";
import Auth from "./components/Auth";
import Home from "./views/Home";
import Stats from "./views/Stats";
import Config from "./views/Config";

export default function App() {
  const { user, loading: authLoading, signOut, enabled: authEnabled } = useAuth();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splash, setSplash] = useState(true);
  const [view, setView] = useState("home");
  const [badgePop, setBadgePop] = useState(null);

  // Splash screen 1.5s
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // Load state when user changes
  useEffect(() => {
    const doLoad = async () => {
      setLoading(true);
      if (authEnabled && user) storage.init(user.id);
      else storage.init(null);

      const saved = await storage.load();
      if (saved) {
        if (!saved.trainingTypes) saved.trainingTypes = DEFAULT_STATE.trainingTypes;
        if (!saved.unlockedBadges) saved.unlockedBadges = [];
        if (saved.supplements) saved.supplements = saved.supplements.map(s => ({ ...s, freq: s.freq || "daily" }));
        // Old users without onboarded flag but with logs → skip onboarding
        if (!saved.onboarded && Object.keys(saved.logs || {}).length > 0) saved.onboarded = true;
        setState(saved);
      } else {
        setState({ onboarded: false });
      }
      setLoading(false);
    };
    if (!authEnabled || !authLoading) doLoad();
  }, [user, authLoading, authEnabled]);

  // Check badges and trigger popup
  const checkBadges = useCallback((s) => {
    const nb = [];
    for (const b of BADGES) {
      if (!s.unlockedBadges.includes(b.id) && b.check(s, utils)) {
        s.unlockedBadges = [...s.unlockedBadges, b.id];
        nb.push(b);
        storage.unlockBadge(b.id);
      }
    }
    if (nb.length) {
      setBadgePop(nb[0]);
      setTimeout(() => setBadgePop(null), 2500);
    }
    return s;
  }, []);

  // --- Actions (granular) ---

  const toggleSupp = useCallback((sid) => {
    const t = TODAY();
    const ns = JSON.parse(JSON.stringify(state));
    if (!ns.logs[t]) ns.logs[t] = {};
    if (!ns.logs[t].supplements) ns.logs[t].supplements = {};
    ns.logs[t].supplements[sid] = !ns.logs[t].supplements[sid];
    setState(checkBadges(ns));
    storage.cacheState(ns);
    storage.toggleSupplement(sid, t);
  }, [state, checkBadges]);

  const doTrain = useCallback((trainId, trainInt) => {
    const t = TODAY();
    const ns = JSON.parse(JSON.stringify(state));
    if (!ns.logs[t]) ns.logs[t] = {};
    if (ns.logs[t].training?.done) return;
    const tt = ns.trainingTypes.find(x => x.id === trainId) || ns.trainingTypes[0];
    const typeName = tt?.name || "Gym";
    const typeEmoji = tt?.emoji || "🏋️";
    ns.logs[t].training = { done: true, type: typeName, emoji: typeEmoji, intensity: trainInt };
    setState(checkBadges(ns));
    storage.cacheState(ns);
    storage.logTraining(t, trainId, typeName, typeEmoji, trainInt);
  }, [state, checkBadges]);

  const doSleep = useCallback((hours, quality) => {
    const t = TODAY();
    const ns = JSON.parse(JSON.stringify(state));
    if (!ns.logs[t]) ns.logs[t] = {};
    if (ns.logs[t].sleep?.hours) return;
    ns.logs[t].sleep = { hours, quality };
    setState(checkBadges(ns));
    storage.cacheState(ns);
    storage.logSleep(t, hours, quality);
  }, [state, checkBadges]);

  // --- Config actions (passed to Config.jsx) ---

  const updateState = useCallback((fn) => {
    const ns = JSON.parse(JSON.stringify(state));
    const action = fn(ns);
    setState(checkBadges(ns));
    storage.cacheState(ns);
    return { state: ns, action };
  }, [state, checkBadges]);

  const handleOnboardingComplete = useCallback(async (newState) => {
    // Name comes from profile (set during signup), not from onboarding
    if (state?.profile?.name) newState.profile.name = state.profile.name;
    const saved = await storage.saveOnboarding(newState);
    setState(saved);
    setView("home");
  }, [state]);

  const handleReset = useCallback(async () => {
    await storage.reset();
    setState({ onboarded: false });
    setView("home");
  }, []);

  // Splash screen
  if (splash) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", background: C.bg, animation: "slideUp 0.5s ease",
      }}>
        <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: C.cyan, letterSpacing: -1 }}>biohack</div>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 8, letterSpacing: 2 }}>TRACK. OPTIMIZE. REPEAT.</div>
      </div>
    );
  }

  // Loading screen
  if (authLoading || loading || !state) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.cyan, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
        cargando...
      </div>
    );
  }

  // Auth gate (only if Supabase is configured)
  if (authEnabled && !user) {
    return <Auth />;
  }

  // Onboarding gate
  if (!state.onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
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
        {view === "config" && <Config state={state} onUpdate={updateState} onReset={handleReset} signOut={authEnabled ? signOut : null} />}
      </div>

      <Nav view={view} setView={setView} />
    </div>
  );
}
